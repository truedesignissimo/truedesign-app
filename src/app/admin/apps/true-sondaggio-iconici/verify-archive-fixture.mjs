// This generator ONLY prints SQL. It has no database client, credentials or network.
// Execute the complete output in one administrator transaction; never just an excerpt.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const schema = `survey_archive_test_${randomBytes(8).toString("hex")}`;
const migration = readFileSync(new URL("../../../../../supabase/migrations/20260903110000_survey_archive_concurrency.sql", import.meta.url), "utf8");
const isolated = migration
  .replace(/^begin;\s*$/gm, "")
  .replace(/^commit;\s*$/gm, "")
  .replace(/\bpublic\./g, `${schema}.`)
  .replace(/\bauth\.users/g, `${schema}.users`)
  .replace(/set search_path = pg_catalog, public/g, `set search_path = pg_catalog, ${schema}`);

if (/\b(public|auth)\.|\bcommit;/i.test(isolated)) throw new Error("Unsafe fixture: schema rewrite incomplete");

process.stdout.write(`-- ISOLATED SYNTHETIC FIXTURE: no real survey tables or auth records are accessed.
-- Entire schema and all changes disappear on the final ROLLBACK.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
create schema ${schema};
create table ${schema}.users (id uuid primary key);
create table ${schema}.survey_iconic_responses (
  id uuid primary key default gen_random_uuid(), participant_name text not null,
  choices jsonb not null, submitted_at timestamptz not null default now()
);
${isolated}
-- Applying the same isolated migration twice proves rerun compatibility.
${isolated}

create function ${schema}.assert_true(ok boolean, label text) returns void
language plpgsql as $$ begin
  if ok is distinct from true then raise exception 'Fixture failed: %', label; end if;
end $$;

create function ${schema}.forced_failure() returns trigger language plpgsql as $$ begin
  raise exception using errcode = '23514', message = 'fixture_forced_failure';
end $$;

insert into ${schema}.users values ('11111111-1111-4111-8111-111111111111');
insert into ${schema}.survey_iconic_responses (id, participant_name, choices, submitted_at) values
  ('22222222-2222-4222-8222-222222222222', 'Fixture One', '[{"name":"A"},{"name":"B"}]', '2026-09-01T10:00:00Z'),
  ('33333333-3333-4333-8333-333333333333', 'Fixture Two', '[{"name":"B"}]', '2026-09-02T10:00:00Z');
create table ${schema}.original as select * from ${schema}.survey_iconic_responses;

-- A mid-reset exception must roll back both the copied snapshot and deletion.
create trigger fixture_fail before delete on ${schema}.survey_iconic_responses
  for each row execute function ${schema}.forced_failure();
do $$ begin
  begin
    perform ${schema}.archive_and_reset_iconic_survey('11111111-1111-4111-8111-111111111111');
    raise exception 'Expected forced reset failure';
  exception when check_violation then
    if sqlerrm <> 'fixture_forced_failure' then raise; end if;
  end;
  perform ${schema}.assert_true((select count(*) = 2 from ${schema}.survey_iconic_responses)
    and (select count(*) = 0 from ${schema}.survey_iconic_archives)
    and (select count(*) = 0 from ${schema}.survey_iconic_archive_responses), 'fixture_reset_rollback');
end $$;
drop trigger fixture_fail on ${schema}.survey_iconic_responses;

create table ${schema}.state as
  select * from ${schema}.archive_and_reset_iconic_survey('11111111-1111-4111-8111-111111111111');
select ${schema}.assert_true((select response_count = 2 from ${schema}.state), 'reset returns actual count');
select ${schema}.assert_true((select count(*) = 0 from ${schema}.survey_iconic_responses), 'reset clears active dataset');
select ${schema}.assert_true((select response_count = 2 and preference_count = 3
  and first_response_at = '2026-09-01T10:00:00Z' and last_response_at = '2026-09-02T10:00:00Z'
  from ${schema}.survey_iconic_archives), 'archive metadata exact');
select ${schema}.assert_true(not exists (
  (select id, participant_name, choices, submitted_at from ${schema}.original
   except select source_response_id, participant_name, choices, submitted_at from ${schema}.survey_iconic_archive_responses)
  union all
  (select source_response_id, participant_name, choices, submitted_at from ${schema}.survey_iconic_archive_responses
   except select id, participant_name, choices, submitted_at from ${schema}.original)
), 'snapshot identity and values preserved');

do $$ begin
  begin
    perform ${schema}.archive_and_reset_iconic_survey(null);
    raise exception 'Expected empty reset rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'no_survey_responses' then raise; end if;
  end;
  begin
    perform ${schema}.restore_iconic_survey_archive('44444444-4444-4444-8444-444444444444', null);
    raise exception 'Expected missing restore rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'survey_archive_missing' then raise; end if;
  end;
end $$;

create table ${schema}.empty_restore as select restored.* from ${schema}.state s
  cross join lateral ${schema}.restore_iconic_survey_archive(s.archive_id, null) restored;
select ${schema}.assert_true((select restored_count = 2 and safety_archive_id is null from ${schema}.empty_restore), 'restore empty has no safety archive');
select ${schema}.assert_true((select count(*) = 2 from ${schema}.survey_iconic_responses), 'restore exact count');

-- Replace only synthetic data to test the safety archive and rollback of restore.
delete from ${schema}.survey_iconic_responses;
insert into ${schema}.survey_iconic_responses (id, participant_name, choices) values
  ('55555555-5555-4555-8555-555555555555', 'New synthetic vote', '[]');
create trigger fixture_fail before insert on ${schema}.survey_iconic_responses
  for each row execute function ${schema}.forced_failure();
do $$ begin
  begin
    perform ${schema}.restore_iconic_survey_archive((select archive_id from ${schema}.state), null);
    raise exception 'Expected forced restore failure';
  exception when check_violation then
    if sqlerrm <> 'fixture_forced_failure' then raise; end if;
  end;
  perform ${schema}.assert_true((select count(*) = 1 from ${schema}.survey_iconic_responses)
    and (select bool_and(participant_name = 'New synthetic vote') from ${schema}.survey_iconic_responses)
    and (select count(*) = 1 from ${schema}.survey_iconic_archives), 'fixture_restore_rollback');
end $$;
drop trigger fixture_fail on ${schema}.survey_iconic_responses;

create table ${schema}.restored as select restored.* from ${schema}.state s
  cross join lateral ${schema}.restore_iconic_survey_archive(s.archive_id, '11111111-1111-4111-8111-111111111111') restored;
select ${schema}.assert_true((select restored_count = 2 and safety_archive_id is not null from ${schema}.restored), 'safety archive returned');
select ${schema}.assert_true((select count(*) = 1 from ${schema}.survey_iconic_archive_responses
  where archive_id = (select safety_archive_id from ${schema}.restored) and participant_name = 'New synthetic vote'), 'new votes preserved in safety snapshot');
select ${schema}.assert_true(not exists (
  (select * from ${schema}.original except select * from ${schema}.survey_iconic_responses)
  union all (select * from ${schema}.survey_iconic_responses except select * from ${schema}.original)
), 'restored ids and data exactly match original');

-- Repeating restore keeps exactly one active row per source id.
select ${schema}.restore_iconic_survey_archive((select archive_id from ${schema}.state), null);
select ${schema}.assert_true((select count(*) = 2 and count(distinct id) = 2 from ${schema}.survey_iconic_responses), 'repeated restore has no duplicates');

-- Inconsistent snapshots must fail before the current dataset can be replaced.
update ${schema}.survey_iconic_archives set response_count = 999 where id = (select archive_id from ${schema}.state);
do $$ begin
  begin
    perform ${schema}.restore_iconic_survey_archive((select archive_id from ${schema}.state), null);
    raise exception 'Expected inconsistent count rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'survey_archive_count_mismatch' then raise; end if;
  end;
  perform ${schema}.assert_true((select count(*) = 2 from ${schema}.survey_iconic_responses), 'inconsistent snapshot preserves current data');
end $$;
update ${schema}.survey_iconic_archives set response_count = 2 where id = (select archive_id from ${schema}.state);

-- Unique source ids in an archive are enforced in the database, not just in UI.
do $$ begin
  begin
    insert into ${schema}.survey_iconic_archive_responses (archive_id, source_response_id, participant_name, choices, submitted_at)
      select archive_id, source_response_id, participant_name, choices, submitted_at
      from ${schema}.survey_iconic_archive_responses limit 1;
    raise exception 'Expected duplicate source rejection';
  exception when unique_violation then null;
  end;
end $$;

create table ${schema}.before_delete as select count(*) as n from ${schema}.survey_iconic_archives;
select ${schema}.delete_iconic_survey_archive((select archive_id from ${schema}.state));
select ${schema}.assert_true((select count(*) from ${schema}.survey_iconic_archives) = (select n - 1 from ${schema}.before_delete)
  and (select count(*) = 0 from ${schema}.survey_iconic_archive_responses where archive_id = (select archive_id from ${schema}.state))
  and (select count(*) = 1 from ${schema}.survey_iconic_archives where id = (select safety_archive_id from ${schema}.restored))
  and (select count(*) = 2 from ${schema}.survey_iconic_responses), 'fixture_delete_scoped');
do $$ begin
  begin
    perform ${schema}.delete_iconic_survey_archive((select archive_id from ${schema}.state));
    raise exception 'Expected missing delete rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'survey_archive_missing' then raise; end if;
  end;
end $$;

do $$ declare signature text; proc oid; begin
  foreach signature in array array['archive_and_reset_iconic_survey(uuid)', 'restore_iconic_survey_archive(uuid,uuid)', 'delete_iconic_survey_archive(uuid)'] loop
    proc := ('${schema}.' || signature)::regprocedure;
    perform ${schema}.assert_true(not has_function_privilege('anon', proc, 'execute')
      and not has_function_privilege('authenticated', proc, 'execute')
      and has_function_privilege('service_role', proc, 'execute'), 'RPC restricted: ' || signature);
    perform ${schema}.assert_true(not exists (
      select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      where p.oid = proc and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
    ), 'PUBLIC has no RPC execute grant');
  end loop;
end $$;
select 'All isolated archive fixtures passed; all fixture changes rolled back below.' as result;
rollback;
`);

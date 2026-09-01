export type KeepAliveResponse =
  | { status: 200; body: { ok: true } }
  | { status: 401 | 503; body: { ok: false } };

export async function executeSupabaseKeepAlive(input: {
  authorization: string | null;
  secret: string | undefined;
  query(): Promise<void>;
  logger?: (error: unknown) => void;
}): Promise<KeepAliveResponse> {
  if (!input.secret || input.authorization !== `Bearer ${input.secret}`) {
    return { status: 401, body: { ok: false } };
  }

  try {
    await input.query();
    return { status: 200, body: { ok: true } };
  } catch (error) {
    (input.logger ?? console.error)(error);
    return { status: 503, body: { ok: false } };
  }
}

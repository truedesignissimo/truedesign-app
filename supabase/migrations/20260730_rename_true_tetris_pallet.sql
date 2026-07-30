update public.apps
set name = 'Tetris Pallet'
where url = '/apps/true-tetris-pallet'
  and name is distinct from 'Tetris Pallet';


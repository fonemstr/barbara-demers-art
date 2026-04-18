import * as migration_20260418_221212_initial from './20260418_221212_initial';

export const migrations = [
  {
    up: migration_20260418_221212_initial.up,
    down: migration_20260418_221212_initial.down,
    name: '20260418_221212_initial'
  },
];

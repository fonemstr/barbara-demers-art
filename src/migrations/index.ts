import * as migration_20260418_221212_initial from './20260418_221212_initial';
import * as migration_20260525_184500_painting_show_fields from './20260525_184500_painting_show_fields';

export const migrations = [
  {
    up: migration_20260418_221212_initial.up,
    down: migration_20260418_221212_initial.down,
    name: '20260418_221212_initial'
  },
  {
    up: migration_20260525_184500_painting_show_fields.up,
    down: migration_20260525_184500_painting_show_fields.down,
    name: '20260525_184500_painting_show_fields'
  },
];

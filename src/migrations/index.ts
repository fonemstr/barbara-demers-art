import * as migration_20260418_221212_initial from './20260418_221212_initial';
import * as migration_20260525_add_painting_story from './20260525_add_painting_story';
import * as migration_20260728_104917_add_free_shipping_tier from './20260728_104917_add_free_shipping_tier';

export const migrations = [
  {
    up: migration_20260418_221212_initial.up,
    down: migration_20260418_221212_initial.down,
    name: '20260418_221212_initial',
  },
  {
    up: migration_20260525_add_painting_story.up,
    down: migration_20260525_add_painting_story.down,
    name: '20260525_add_painting_story',
  },
  {
    up: migration_20260728_104917_add_free_shipping_tier.up,
    down: migration_20260728_104917_add_free_shipping_tier.down,
    name: '20260728_104917_add_free_shipping_tier'
  },
];

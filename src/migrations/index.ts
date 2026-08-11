import * as migration_20260418_221212_initial from './20260418_221212_initial';
import * as migration_20260525_add_painting_story from './20260525_add_painting_story';
import * as migration_20260728_104917_add_free_shipping_tier from './20260728_104917_add_free_shipping_tier';
import * as migration_20260805_add_print_options from './20260805_add_print_options';
import * as migration_20260806_120000_add_social_posts from './20260806_120000_add_social_posts';
import * as migration_20260806_add_collections from './20260806_add_collections';
import * as migration_20260811_add_commissioned_portraits from './20260811_add_commissioned_portraits';

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
    name: '20260728_104917_add_free_shipping_tier',
  },
  {
    up: migration_20260805_add_print_options.up,
    down: migration_20260805_add_print_options.down,
    name: '20260805_add_print_options',
  },
  {
    up: migration_20260806_120000_add_social_posts.up,
    down: migration_20260806_120000_add_social_posts.down,
    name: '20260806_120000_add_social_posts',
  },
  {
    up: migration_20260806_add_collections.up,
    down: migration_20260806_add_collections.down,
    name: '20260806_add_collections'
  },
  {
    up: migration_20260811_add_commissioned_portraits.up,
    down: migration_20260811_add_commissioned_portraits.down,
    name: '20260811_add_commissioned_portraits',
  },
];

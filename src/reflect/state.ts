import { Feed } from '@/data';
import { generate } from '@rocicorp/rails';

export const {
  get: getFeed,
  mustGet: mustGetFeed,
  set: setFeed,
  update: updateFeed,
  delete: deleteFeed,
  list: listFeedsImpl,
  listIDs: listFeedIds,
} = generate<Feed>('feed');

import PartySocket from 'partysocket';
import { Replicache, type WriteTransaction } from 'replicache';
import type { MessageWithID } from '@/types';
import { type Feed } from '@/services/podcast-api';

const PARTYKIT_HOST = import.meta.env.PARTYKIT_HOST;
const PARTY_NAME = 'main';
const ROOM_NAME = 'replicache-party';

const socket = new PartySocket({
  host: PARTYKIT_HOST,
  room: ROOM_NAME,
});

const protocol =
  PARTYKIT_HOST.startsWith('localhost') || PARTYKIT_HOST.startsWith('127.0.0.1')
    ? 'http'
    : 'https';

export const replicache =
  typeof window !== 'undefined'
    ? new Replicache({
        name: 'chat-user-id',
        // This would get bundled in client code no matter what we do.
        licenseKey: 'lea631f54a3f64f76b5ebce1bcdc97fbc',
        pushURL: `${protocol}://${PARTYKIT_HOST}/parties/${PARTY_NAME}/${ROOM_NAME}?push`,
        pullURL: `${protocol}://${PARTYKIT_HOST}/parties/${PARTY_NAME}/${ROOM_NAME}?pull`,

        mutators: {
          async createMessage(
            tx: WriteTransaction,
            { id, from, content, order }: MessageWithID,
          ) {
            await tx.set(`message/${id}`, {
              from,
              content,
              order,
            });
          },

          async addFeeds(tx: WriteTransaction, feeds: Feed[]) {
            await Promise.all(
              feeds.map(async (feed) => await tx.set(`feed/${feed.id}`, feed)),
            );
          },
        },
      })
    : null!;

socket.addEventListener('message', (event) => {
  if (event.data === 'poke') {
    if (!replicache) return;
    replicache.pull();
  }
});

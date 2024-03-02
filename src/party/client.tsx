import PartySocket from 'partysocket';
import { Replicache, type WriteTransaction } from 'replicache';
import type { MessageWithID } from '@/types';

const PARTYKIT_HOST = import.meta.env.PARTYKIT_HOST;
const PARTY_NAME = 'main';
const ROOM_NAME = 'replicache-party';

const socket = new PartySocket({
  host: PARTYKIT_HOST,
  room: ROOM_NAME,
});

export const replicache =
  typeof window !== 'undefined'
    ? new Replicache({
        name: 'chat-user-id',
        // This would get bundled in client code no matter what we do.
        licenseKey: 'lea631f54a3f64f76b5ebce1bcdc97fbc',
        pushURL: `/parties/${PARTY_NAME}/${ROOM_NAME}?push`,
        pullURL: `/parties/${PARTY_NAME}/${ROOM_NAME}?pull`,

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
        },
      })
    : null!;

socket.addEventListener('message', (event) => {
  if (event.data === 'poke') {
    if (!replicache) return;
    replicache.pull();
  }
});

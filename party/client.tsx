import PartySocket from 'partysocket';
import { Replicache, type WriteTransaction } from 'replicache';

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
        name: 'main-user',
        // This would get bundled in client code no matter what we do.
        licenseKey: 'lea631f54a3f64f76b5ebce1bcdc97fbc',
        pushURL: `${protocol}://${PARTYKIT_HOST}/parties/${PARTY_NAME}/${ROOM_NAME}?push`,
        pullURL: `${protocol}://${PARTYKIT_HOST}/parties/${PARTY_NAME}/${ROOM_NAME}?pull`,

        mutators: {
          async addFeeds(tx: WriteTransaction, feeds: Feed[]) {
            await Promise.all(
              feeds.map(async (feed) => await tx.set(`feed/${feed.id}`, feed)),
            );
          },

          async addEpisodesForFeed(tx: WriteTransaction, episodes: Episode[]) {
            console.log(episodes.map(JSON.stringify));
            await Promise.all(
              episodes.map(
                async (episode) =>
                  await tx.set(
                    `episode/${episode.id}`,
                    JSON.stringify(episode),
                  ),
              ),
            );
          },
        },
      })
    : null!;

socket.addEventListener('message', (event) => {
  if (!replicache) return;
  if (event.data === 'poke') {
    replicache.pull();
  }
});

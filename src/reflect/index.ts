import { Reflect } from '@rocicorp/reflect/client';
import { mutators } from './mutators';

const server = import.meta.env.VITE_REFLECT_URL;
const userID = 'testing';

export const r = new Reflect({
  server,
  userID,
  roomID: 'my-room-1',
  auth: userID,
  schemaVersion: '1',
  kvStore: 'idb',
  mutators,
});

import { Reflect } from '@rocicorp/reflect/client';
import { mutators } from './mutators';

const server = import.meta.env.VITE_REFLECT_URL;
const userID = 'testing';
const roomID = 'my-room-1';

export const r = new Reflect({
  server,
  userID,
  roomID,
  auth: userID,
  schemaVersion: '1',
  kvStore: 'idb',
  mutators,
});

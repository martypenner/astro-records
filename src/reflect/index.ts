import { Reflect } from '@rocicorp/reflect/client';
import { nanoid } from 'nanoid';
import { mutators } from './mutators';

const server = import.meta.env.VITE_REFLECT_URL;
const userID = nanoid();

export const r = new Reflect({
  server,
  userID,
  roomID: 'my-room',
  auth: userID,
  schemaVersion: '1',
  kvStore: 'idb',
  mutators,
});

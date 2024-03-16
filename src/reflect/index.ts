import { Reflect } from '@rocicorp/reflect/client';
import { nanoid } from 'nanoid';
import { mutators } from './mutators';

const server: string | undefined = import.meta.env.PUBLIC_REFLECT_URL;
if (!server) {
  throw new Error('PUBLIC_REFLECT_URL required');
}

const userID = nanoid();

export const r = new Reflect({
  server,
  userID,
  roomID: 'my-room',
  auth: userID,
  schemaVersion: '1',
  mutators,
});

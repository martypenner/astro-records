import PQueue from 'p-queue';

export const feedApiQueue = new PQueue({ concurrency: 1 });

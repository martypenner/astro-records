import pRetry from 'p-retry';

const apiKey = import.meta.env.PUBLIC_PODCAST_INDEX_API_KEY;
const apiSecret = import.meta.env.PUBLIC_PODCAST_INDEX_API_SECRET;
const baseUrl = new URL('https://api.podcastindex.org/api/1.0');

async function createHash(
  apiKey: string,
  apiSecret: string,
  apiHeaderTime: number,
): Promise<string> {
  const dataForHash = apiKey + apiSecret + apiHeaderTime;
  const algo = 'SHA-1';
  const encoder = new TextEncoder();
  const data = encoder.encode(dataForHash);
  const hashBuffer = await crypto.subtle.digest(algo, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

const apiHeaderTime = Math.floor(Date.now() / 1000);
const hashForHeader = await createHash(apiKey, apiSecret, apiHeaderTime);

const options = {
  method: 'get',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-Date': apiHeaderTime.toString(),
    'X-Auth-Key': apiKey,
    Authorization: hashForHeader,
    'User-Agent': 'CloudflarePodcaster/0.1',
  },
};

const retryable =
  <T, U>(fn: (...args: U[]) => Promise<T>) =>
  (...args: U[]) =>
    pRetry(async () => await fn(...args), {
      onFailedAttempt: (error) => {
        console.log(
          `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`,
        );
      },
      retries: 3,
      randomize: true,
    });

export type Feed = {
  id: string;
  podcastGuid: string;
  title: string;
  description: string;
  url: string;
  image: string;
};

export const searchByTerm = retryable(
  async (query: string): Promise<Feed[]> => {
    const url = new URL(baseUrl);
    url.pathname = baseUrl.pathname.concat('/search/byterm');
    const params = url.searchParams;
    params.set('q', query);
    url.search = params.toString();
    const response = await fetch(url, options).then((res) => res.json());
    if (response.status !== 'true') {
      throw new Error(response.description);
    }

    return response.feeds as Feed[];
  },
);

export const trending = retryable(async (): Promise<Feed[]> => {
  const url = `${baseUrl}/podcasts/trending`;
  const response = await fetch(url, options).then((res) => res.json());
  if (response.status !== 'true') {
    throw new Error(response.description);
  }

  return response.feeds as Feed[];
});

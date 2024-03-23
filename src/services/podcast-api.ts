import type { ApiEpisode, Feed } from '@/data';
import { env } from '@/env';
import pRetry from 'p-retry';

const {
  VITE_PODCAST_INDEX_API_KEY: apiKey,
  VITE_PODCAST_INDEX_API_SECRET: apiSecret,
} = env;

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

export const podcastById = retryable(async (id: string): Promise<Feed> => {
  const params = new URLSearchParams();
  params.set('id', id);
  params.set('fulltext', 'true');
  const url = `${baseUrl}/podcasts/byfeedid?${params.toString()}`;
  const response = await fetch(url, options);
  console.log(response);
  if (response.status !== 200) {
    throw response;
  }
  const data = await response.json();
  if (data.status !== 'true') {
    throw new Error(data.description);
  }

  return data.feed as Feed;
});

export const episodesByPodcastId = retryable(
  async (id: string): Promise<ApiEpisode[]> => {
    const params = new URLSearchParams();
    params.set('id', id);
    params.set('fulltext', 'true');
    const url = `${baseUrl}/episodes/byfeedid?${params.toString()}`;
    const response = await fetch(url, options);
    console.log(response);
    if (response.status !== 200) {
      throw response;
    }
    const data = await response.json();
    if (data.status !== 'true') {
      throw new Error(data.description);
    }
    console.log(data);

    return (data.items as ApiEpisode[]).map((episode) => ({
      id: episode.id,
      feedId: id,
      title: episode.title,
      description: episode.description,
      author: episode.author,
      image:
        episode.image?.trim().length === 0
          ? episode.feedImage
          : episode.image == null
            ? episode.feedImage
            : episode.image,
      datePublished: episode.datePublished,
      duration: episode.duration,
      episode: episode.episode,
      enclosureUrl: episode.enclosureUrl,
      enclosureType: episode.enclosureType,
      explicit: episode.explicit,
    })) as ApiEpisode[];
  },
);

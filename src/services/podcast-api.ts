import type { ApiEpisode, ApiFeed, Feed } from '@/data';
import { env } from '@/env';

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

export const searchByTerm = async (query: string): Promise<Feed[]> => {
  const url = new URL(baseUrl);
  url.pathname = baseUrl.pathname.concat('/search/byterm');
  const params = url.searchParams;
  params.set('q', query);
  url.search = params.toString();
  const response = (await fetch(url, options).then((res) => res.json())) as {
    status: string;
    description: string;
    feeds: Feed[];
  };
  if (response.status !== 'true') {
    throw new Error(response.description);
  }

  return response.feeds;
};

export const trending = async (): Promise<Feed[]> => {
  const url = `${baseUrl}/podcasts/trending`;
  const response = (await fetch(url, options).then((res) => res.json())) as {
    status: string;
    description: string;
    feeds: Feed[];
  };
  if (response.status !== 'true') {
    throw new Error(response.description);
  }

  return response.feeds as Feed[];
};

export const podcastById = async (id: string): Promise<ApiFeed> => {
  const params = new URLSearchParams();
  params.set('id', id);
  params.set('fulltext', 'true');
  const url = `${baseUrl}/podcasts/byfeedid?${params.toString()}`;
  const response = await fetch(url, options);
  console.log(response);
  if (response.status !== 200) {
    throw response;
  }
  const data = (await response.json()) as {
    status: string;
    description: string;
    feed: ApiFeed;
  };
  if (data.status !== 'true') {
    throw new Error(data.description);
  }

  return data.feed as ApiFeed;
};

export const episodeById = async (id: string): Promise<ApiEpisode> => {
  const params = new URLSearchParams();
  params.set('id', id);
  params.set('fulltext', 'true');
  const url = `${baseUrl}/episodes/byid?${params.toString()}`;
  const response = await fetch(url, options);
  console.log(response);
  if (response.status !== 200) {
    throw response;
  }
  const data = (await response.json()) as {
    status: string;
    description: string;
    episode: ApiEpisode;
  };
  if (data.status !== 'true') {
    throw new Error(data.description);
  }
  console.log(data);
  const episode = data.episode;

  return {
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
    // This is the number of SECONDS - not ms - since unix epoch, so we need to multiply by 1000
    datePublished: Number(episode.datePublished) * 1000,
    duration: episode.duration,
    episode: episode.episode,
    enclosureUrl: episode.enclosureUrl,
    enclosureType: episode.enclosureType,
    explicit: episode.explicit,
  };
};

export const episodesByPodcastId = async (
  id: string,
): Promise<ApiEpisode[]> => {
  const params = new URLSearchParams();
  params.set('id', id);
  params.set('fulltext', 'true');
  const url = `${baseUrl}/episodes/byfeedid?${params.toString()}`;
  const response = await fetch(url, options);
  console.log(response);
  if (response.status !== 200) {
    throw response;
  }
  const data = (await response.json()) as {
    status: string;
    description: string;
    items: ApiEpisode[];
  };
  if (data.status !== 'true') {
    throw new Error(data.description);
  }
  console.log(data);

  return data.items.map((episode) => ({
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
};

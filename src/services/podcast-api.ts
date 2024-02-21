import crypto from "node:crypto";
import pRetry from "p-retry";

const apiKey = import.meta.env.PUBLIC_PODCAST_INDEX_API_KEY;
const apiSecret = import.meta.env.PUBLIC_PODCAST_INDEX_API_SECRET;
const baseUrl = "https://api.podcastindex.org/api/1.0";

const apiHeaderTime = Math.floor(Date.now() / 1000);
const algo = "sha1";
const hash = crypto.createHash(algo);
const data4Hash = apiKey + apiSecret + apiHeaderTime;

hash.update(data4Hash);

const hash4Header = hash.digest("hex");

const options = {
  method: "get",
  headers: {
    "Content-Type": "application/json",
    "X-Auth-Date": apiHeaderTime.toString(),
    "X-Auth-Key": apiKey,
    Authorization: hash4Header,
    "User-Agent": "CloudflarePodcaster/0.1",
  },
};
const retryable =
  <T, U>(fn: (...args: U[]) => Promise<T>) =>
  (...args: U[]) =>
    pRetry(async () => await fn(...args), { retries: 5 });

type Feed = {
  podcastGuid: string;
  title: string;
  description: string;
  url: string;
  image: string;
};

export const searchByTerm = retryable(
  async (query: string): Promise<Feed[]> => {
    const url = `${baseUrl}/search/byterm?q=${query}`;
    const response = await fetch(url, options).then((res) => res.json());
    if (response.status !== "true") {
      throw new Error(response.description);
    }

    return response.feeds as Feed[];
  },
);

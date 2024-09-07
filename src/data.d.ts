import type { ReadonlyJSONValue } from '@rocicorp/reflect';

export interface ApiFeed {
  id: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;
}

/** Our personal metadata. */
export interface StoredFeed {
  id: string;
  lastUpdatedAt: number;
  lastAccessedAt: number;
  lastSubscribedAt?: number;
  subscribed: boolean;

  /** Fallback */
  [key: string]: ReadonlyJSONValue;
}

export interface Feed extends StoredFeed {}

export interface ApiEpisode {
  id: string;
  feedId: string;
  title: string;
  description: string;
  author: string;
  image?: string;
  feedImage?: string;
  datePublished: number;
  /** Duration in seconds. I think. */
  duration: number;
  /** The episode number within the broader feed, e.g. 605. */
  episode: number;
  enclosureUrl: string;
  enclosureType: string;
  explicit: 0 | 1;

  /** Fallback */
  // [key: string]: string | number | boolean | Date;
  [key: string]: ReadonlyJSONValue | undefined;
}

export interface StoredEpisode {
  id: string;
  feedId: string;
  /** Progress of playing the episode. */
  currentTime: number;
  lastPlayedAt: number;
  downloaded: boolean;
  /** Fallback */
  [key: string]: ReadonlyJSONValue;
}

export interface Episode extends StoredEpisode {
  enclosureType: MIMEType;
}

// This should eventually be a union of all types we encounter.
export type MIMEType = string;

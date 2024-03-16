import type { ReadonlyJSONValue } from '@rocicorp/reflect';

export interface StoredFeed {
  id: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;

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
  duration: number;
  durationFormatted: string;
  /** The episode number within the broader feed, e.g. 605. */
  episode: number;
  enclosureUrl: string;
  enclosureType: string;
  explicit: 0 | 1;

  /** Fallback */
  // [key: string]: string | number | boolean | Date;
  [key: string]: ReadonlyJSONValue;
}

export interface StoredEpisode extends ApiEpisode {}

export interface Episode extends StoredEpisode {
  datePublished: Date;
  enclosureType: MIMEType;
  explicit: boolean;
}

// This should eventually be a union of all types we encounter.
export type MIMEType = string;

type Feed = {
  id: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;
};

type Episode = {
  id: string;
  feedId: string;
  title: string;
  description: string;
  author: string;
  image?: string;
  datePublished: Date;
  duration: number;
  durationFormatted: string;
  /** The episode number within the broader feed, e.g. 605. */
  number: number;
  enclosureUrl: URL;
  enclosureType: MIMEType;
  explicit: boolean;
};

// This should eventually be a union of all types we encounter.
type MIMEType = string;

type Message = {
  from: string;
  content: string;
  order: number;
};

type MessageWithID = Message & { id: string };

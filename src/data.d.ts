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
  number: number;
};

type Message = {
  from: string;
  content: string;
  order: number;
};

type MessageWithID = Message & { id: string };

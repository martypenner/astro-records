import { replicache } from '@/party/client';
import { trending } from '@/services/podcast-api';
import type { Message } from '@/types';
import { nanoid } from 'nanoid';
import { useRef, type FormEvent } from 'react';
import { useSubscribe } from 'replicache-react';

const feeds = await trending();
// const feeds = await searchByTerm("computer programming");
console.log(feeds);

export default function App() {
  return (
    <main className="prose lg:prose-xl">
      <ul>
        {feeds.map((feed) => (
          <li key={feed.id}>
            <a href={feed.url}>
              <img src={feed.image} alt="" width={100} height={100} />
              {feed.title}
            </a>
          </li>
        ))}
      </ul>

      <Messages />
    </main>
  );
}

function Messages() {
  const messages = useSubscribe(
    replicache,
    async (tx) => {
      const list = (await tx
        .scan({ prefix: 'message/' })
        .entries()
        .toArray()) as [string, Message][];
      list.sort(([, { order: a }], [, { order: b }]) => a - b);
      return list;
    },
    { default: [] },
  );

  const usernameRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!usernameRef.current) return;
    if (!contentRef.current) return;
    const last = messages[messages.length - 1]?.[1];
    const order = (last?.order ?? 0) + 1;

    replicache.mutate.createMessage({
      id: nanoid(),
      from: usernameRef.current.value,
      content: contentRef.current.value,
      order,
    });
    contentRef.current.value = '';
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input ref={usernameRef} required /> says:{' '}
        <input ref={contentRef} required /> <input type="submit" />
      </form>
      <MessageList messages={messages} />
    </div>
  );
}

function MessageList({ messages }: { messages: [string, Message][] }) {
  return messages.map(([k, v]) => {
    return (
      <div key={k}>
        <b>{v.from}: </b>
        {v.content}
      </div>
    );
  });
}

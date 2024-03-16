import { r } from '@/reflect';
import { useFeeds } from '@/reflect/subscriptions';
import { Card } from './Card';

export function FeedList() {
  const feeds = useFeeds(r) ?? [];

  return (
    <>
      <title>Astro Podcasts</title>

      <section className="py-8">
        <div className="container mx-auto max-w-screen-lg px-6 lg:px-0 flex items-center flex-wrap pt-4 pb-12">
          {/* <h1 class="font-bold text-3xl text-black tracking-tight mb-12"> */}
          {/*   Recently Played <span class="sr-only">Albums</span> */}
          {/* </h1> */}

          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {feeds.map((feed) => (
              <Card key={feed.id} {...feed} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

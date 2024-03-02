import { trending } from '@/services/podcast-api';

const feeds = await trending();
// const feeds = await searchByTerm("computer programming");
console.log(feeds);

function App() {
  return (
    <main className="prose lg:prose-xl">
      <ul>
        {feeds.map((feed) => (
          <li key={feed.podcastGuid}>
            <a href={feed.url}>
              <img src={feed.image} alt="" width={100} height={100} />
              {feed.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;

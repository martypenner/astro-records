import { FeedList } from '@/components/FeedList';
import { Feed } from '@/data';
import { searchByTerm } from '@/services/podcast-api';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('q')?.toString() ?? '';
  const feeds = await searchByTerm(searchTerm);
  const transformedFeeds = feeds;
  return transformedFeeds;
}

export function Component() {
  const searchedFeeds = useLoaderData() as Feed[];

  return <FeedList feeds={searchedFeeds} />;
}

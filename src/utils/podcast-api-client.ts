import podcastApi from "podcast-index-api";

export const podcastApiClient = podcastApi(
  import.meta.env.PUBLIC_PODCAST_INDEX_API_KEY,
  import.meta.env.PUBLIC_PODCAST_INDEX_API_SECRET,
  // Custom user agent here if needed
  "PodcastIndexBot/@podcast@penner.me",
);

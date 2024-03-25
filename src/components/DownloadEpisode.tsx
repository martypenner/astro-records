import { Episode } from '@/data';
import { env } from '@/env';
import { r } from '@/reflect';
import { useEpisodeById } from '@/reflect/subscriptions';
import { useCallback, useState } from 'react';
import { CircleProgress } from './CircleProgress';

interface DownloadEpisodeProps {
  id: Episode['id'];
}

export function DownloadEpisode({ id }: DownloadEpisodeProps) {
  const episode = useEpisodeById(r, id);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(false);

  const onProgress = useCallback(
    (progress: number | 'indeterminate') => {
      if (episode == null) return;

      if (progress === 'indeterminate') {
        setProgress(0);
        setIndeterminate(true);
      } else {
        setProgress(progress);
        setIndeterminate(false);
      }

      if (progress === 100) {
        // const cache = await caches.open('podcast-episode-cache/v1');
        // // Store by episode ID instead of enclosure URL since the URL might change.
        //  await cache.put(episode.id, response);
        // console.log('Done downloading episode:', episode);
      }
    },
    [episode],
  );

  return (
    <>
      <button
        type="button"
        disabled={downloading}
        onClick={async () => {
          if (!episode) return;

          setDownloading(true);
          setProgress(0);
          setIndeterminate(false);

          const data = new FormData();
          data.set('episodeUrl', episode.enclosureUrl);
          try {
            const response = await fetch(
              `${env.VITE_SERVER_URL}/download-episode`,
              {
                method: 'post',
                body: data,
              },
            );
            await downloadWithProgress(response, onProgress);
          } catch (error) {
            console.error('Could not download podcast episode:', episode);
          }

          setDownloading(false);
          setProgress(0);
          setIndeterminate(false);
        }}
      >
        download
        {downloading && (
          <CircleProgress value={progress} isIndeterminate={indeterminate} />
        )}
      </button>
    </>
  );
}

async function downloadWithProgress(
  response: Response,
  onProgress: (progress: number | 'indeterminate') => void,
) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (response.body == null) {
    throw new Error(`No response body`);
  }

  const reader = response.body.getReader();
  const contentLength = response.headers.get('Content-Length') ?? 0;
  let receivedLength = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (contentLength === 0) {
      onProgress('indeterminate');
    } else {
      receivedLength += value.length;
      onProgress((receivedLength / +contentLength) * 100);
    }
  }
}

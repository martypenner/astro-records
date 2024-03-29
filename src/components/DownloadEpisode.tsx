import { Episode } from '@/data';
import { env } from '@/env';
import { r } from '@/reflect';
import { useEpisodeById } from '@/reflect/subscriptions';
import { useCallback, useRef, useState } from 'react';
import { CircleProgress } from './CircleProgress';

interface DownloadEpisodeProps {
  id: Episode['id'];
}

export function DownloadEpisode({ id }: DownloadEpisodeProps) {
  const episode = useEpisodeById(r, id);
  const [state, setState] = useState<'empty' | 'downloaded' | 'downloading'>(
    'empty',
  );
  const [progress, setProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(false);

  const controller = useRef(new AbortController());

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
    },
    [episode],
  );

  const triggerDownload = useCallback(
    (signal: AbortSignal) => {
      const download = async () => {
        if (!episode) return;

        setState('downloading');
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
              // Note that even the though we technically finish fetching the metadata
              // and create a reader in the below function, setting a signal on the fetch
              // allows us to cancel the streaming read at any time. Handy!
              signal,
            },
          );
          await downloadWithProgress(response.clone(), onProgress);
          const cache = await caches.open('podcast-episode-cache/v1');
          // Store by episode ID instead of enclosure URL since the URL might change.
          await cache.put(new Request('/episode/' + episode.id), response);
          // Update the last played time so it doesn't expire right away.
          r.mutate.updateEpisode({ id: episode.id, lastPlayedAt: Date.now() });
          console.log('Done downloading episode:', episode);
          setState('downloaded');
        } catch (error) {
          console.error('Could not download podcast episode:', episode, error);
          setState('empty');
        }

        setProgress(0);
        setIndeterminate(false);
      };

      download();
    },
    [episode, onProgress],
  );

  const checkDownloadStatus = useCallback(() => {
    const deleteDownload = async () => {
      if (!episode) return;

      const cache = await caches.open('podcast-episode-cache/v1');
      const request = new Request('/episode/' + episode.id);
      const response = await cache.match(request);
      if (response) {
        await cache.delete(request);
      }
    };

    const check = async () => {
      if (!episode) return;

      switch (state) {
        case 'empty': {
          controller.current = new AbortController();
          triggerDownload(controller.current.signal);
          break;
        }
        case 'downloading':
          if (window.confirm('Are you sure you want to cancel the download?')) {
            controller.current.abort('cancelled');
            // The download may have finished while we were asking the question, so we
            // need to make sure we clean up.
            await deleteDownload();
            setState('empty');
          }
          break;
        case 'downloaded': {
          if (
            !window.confirm(
              `Are you sure you want to delete the download? You'll be able to download it again later.`,
            )
          )
            return;

          await deleteDownload();
          setState('empty');
          break;
        }
      }
    };

    check();
  }, [episode, state, triggerDownload]);

  return (
    <>
      <button
        type="button"
        onClick={checkDownloadStatus}
        className={`relative flex items-center justify-center w-8 h-8 ${state === 'downloaded' ? 'text-pink-700' : ''}`}
      >
        <span className="sr-only">
          {state === 'downloading' ? 'Cancel download' : 'Download'}
        </span>

        {state === 'downloading' && (
          <CircleProgress value={progress} isIndeterminate={indeterminate} />
        )}

        <svg
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6/12 h-6/12 relative"
        >
          <path
            d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </>
  );
}

// TODO: stick this thing in a web worker
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

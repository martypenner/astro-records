import type { Episode } from '@/data';
import { r } from '@/reflect';
import { useCurrentEpisode } from '@/reflect/subscriptions';
import { formatDuration } from '@/services/format-duration';
import { $isPlaying, togglePlaying } from '@/services/state';
import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';

import { Slider, SliderThumb, SliderTrack } from 'react-aria-components';
import { NavLink } from 'react-router-dom';

export default function PlayerGuard() {
  const currentEpisode = useCurrentEpisode(r);

  if (currentEpisode == null) {
    return;
  }

  return <Player {...currentEpisode} />;
}

const PlayIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-10 h-10 sm:w-14 sm:h-14"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
      clipRule="evenodd"
    />
  </svg>
);

const PauseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-10 h-10 sm:w-14 sm:h-14"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
      clipRule="evenodd"
    />
  </svg>
);

type PlayerProps = Pick<Episode, 'feedId' | 'author' | 'title' | 'image'>;

function Player({ feedId, author, title, image }: PlayerProps) {
  const isPlaying = useStore($isPlaying);
  const currentEpisode = useCurrentEpisode(r);
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(currentEpisode?.progress ?? 0);

  // Sync updates from the player to local progress - to update the slider - and
  // persist progress per episode.
  useEffect(() => {
    const audio = audioPlayer.current;
    if (!audio) return;

    const localUpdateInterval = 100;
    const persistedUpdateInterval = 4000;
    let lastUpdatedLocalTime = Date.now();
    let lastUpdatedPersistedTime = Date.now();
    const handleTimeUpdate = () => {
      if (!currentEpisode?.id) return;
      const now = Date.now();
      const currentTime = audio.currentTime;
      // Throttle updates to every 1 second
      if (now - lastUpdatedLocalTime >= localUpdateInterval) {
        lastUpdatedLocalTime = Date.now();
        setProgress(Math.min(currentTime, audio.duration));
      }
      // Persist changes even less frequently
      if (now - lastUpdatedPersistedTime >= persistedUpdateInterval) {
        lastUpdatedPersistedTime = Date.now();
        r.mutate.updateProgressForEpisode({
          id: currentEpisode.id,
          progress: Math.min(currentTime, audio.duration),
        });
      }
    };
    const handleEnded = () => {
      setProgress(0);
      if (!currentEpisode?.id) return;
      r.mutate.updateProgressForEpisode({
        id: currentEpisode.id,
        progress: 0,
        played: true,
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentEpisode?.id]);

  // When the store playing state changes - e.g. when controlling it using a
  // different play / pause button - update the player playing state.
  useEffect(() => {
    const audio = audioPlayer.current;
    if (!audio) return;

    // Delay by a bit to let the audio player catch up
    requestAnimationFrame(() => {
      if (isPlaying) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  }, [isPlaying]);

  // When the current episode changes, update the audio src to it and restore player progress.
  useEffect(() => {
    const audio = audioPlayer.current;
    if (!audio || currentEpisode?.enclosureUrl == null) return;

    audio.src = currentEpisode.enclosureUrl.toString();
    audio.currentTime = currentEpisode.progress;
    audio.play();
    setProgress(currentEpisode.progress);

    // We don't want to react to changes in episode progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode?.enclosureUrl]);

  // Update the progress tracker / slider if a mutation comes in while we're not playing.
  // This is important so that the player picks up where it left off when you switch episodes.
  useEffect(() => {
    if (!isPlaying) {
      if (currentEpisode?.progress == null) return;
      setProgress(currentEpisode.progress);
    }
  }, [currentEpisode?.progress, isPlaying]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gray-100 z-10"
      role="region"
      aria-labelledby="audio-player-heading"
      style={{ viewTransitionName: 'player' }}
    >
      <h2 id="audio-player-heading" className="sr-only">
        Audio player
      </h2>

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 flex justify-center">
        <span className="text-gray-50">
          {formatDuration(progress, true)} /{' '}
          {currentEpisode?.durationFormatted ?? ''}
        </span>

        <Slider
          aria-label="Audio timeline"
          className="w-full"
          value={progress}
          minValue={0}
          // TODO: update this AS SOON AS the current episode changes
          maxValue={
            Number.isNaN(audioPlayer.current?.duration ?? 0)
              ? 0
              : audioPlayer.current?.duration
          }
          step={0.1}
          onChange={(progress: number) => {
            setProgress(progress);
            if (!audioPlayer.current) return;
            audioPlayer.current.currentTime = progress;
          }}
        >
          <SliderTrack className="relative w-full h-7">
            {({ state }) => (
              <>
                {/* track */}
                <div className="absolute h-2 top-[50%] translate-y-[-50%] w-full rounded-full bg-white/40" />
                {/* fill */}
                <div
                  className="absolute h-2 top-[50%] translate-y-[-50%] rounded-full bg-white"
                  style={{ width: state.getThumbPercent(0) * 100 + '%' }}
                />
                <SliderThumb className="h-5 w-5 top-[50%] rounded-full border border-solid border-purple-800/75 bg-white transition dragging:bg-purple-100 outline-none focus-visible:ring-2 ring-black" />
              </>
            )}
          </SliderTrack>
        </Slider>
      </div>

      {/* <div className="flex-1 bg-gray-200 h-3 dark:bg-gray-700"> */}
      {/*   <div */}
      {/*     aria-orientation="horizontal" */}
      {/*     role="slider" */}
      {/*     aria-label="audio timeline" */}
      {/*     aria-valuemin={0} */}
      {/*     aria-valuemax={ */}
      {/*       audioPlayer.current && audioPlayer.current.duration */}
      {/*         ? Math.floor(audioPlayer.current.duration) */}
      {/*         : 0 */}
      {/*     } */}
      {/*     aria-valuenow={ */}
      {/*       audioPlayer.current && audioPlayer.current.currentTime */}
      {/*         ? Math.floor(audioPlayer.current.currentTime) */}
      {/*         : 0 */}
      {/*     } */}
      {/*     aria-valuetext={`${ */}
      {/*       audioPlayer.current && audioPlayer.current.currentTime */}
      {/*         ? Math.floor(audioPlayer.current.currentTime) */}
      {/*         : 0 */}
      {/*     } seconds`} */}
      {/*     className="bg-pink-700 h-full" */}
      {/*     style={{ width: `${progress}%` }} */}
      {/*   ></div> */}
      {/* </div> */}

      <div className="container mx-auto max-w-screen-lg px-3 py-2 sm:px-6 sm:py-4 flex items-center justify-between gap-5">
        {/* TODO: maybe link to the episode instead? some sort of slide-in player? */}
        <NavLink
          unstable_viewTransition
          to={`/podcast/${feedId}`}
          className="flex items-center gap-5 shrink-0"
        >
          <img
            src={image}
            // Decorative only
            alt=""
            aria-hidden="true"
            width="60"
            height="60"
            className="block rounded-md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xl text-black font-medium overflow-hidden text-ellipsis whitespace-nowrap">
              {title}
            </div>
            <div className="text-xl text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">
              {author}
            </div>
          </div>
        </NavLink>

        <audio ref={audioPlayer} />

        <div className="flex gap-6 items-center shrink-0 text-black">
          <button
            type="button"
            disabled
            className="opacity-50 focus-visible:ring-2 focus:outline-none focus:ring-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 hidden sm:block"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
            </svg>
            <span className="sr-only">Previous in queue</span>
          </button>

          <button
            type="button"
            className="focus-visible:ring-2 focus:outline-none focus:ring-black"
            onClick={() => togglePlaying()}
          >
            {isPlaying ? PauseIcon : PlayIcon}
            <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            disabled
            className="opacity-50 focus-visible:ring-2 focus:outline-none focus:ring-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 hidden sm:block"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
            </svg>
            {/* TODO: can probably make these announcements more helpful by adding actual episode numbers and names, along with the podcast they relate to */}
            <span className="sr-only">Next in queue</span>
          </button>
        </div>
      </div>
    </div>
  );
}

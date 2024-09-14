import type { ApiEpisode } from '@/data';
import { formatDuration } from '@/lib/format-duration';
import {
  addEpisodesForFeed,
  getVolume,
  setAudioVolume,
  updateProgressForEpisode,
} from '@/services/data';
import { $isPlaying, pause, togglePlaying } from '@/services/ephemeral-state';
import { episodeById } from '@/services/podcast-api';
import { useCurrentEpisode, usePlayerSpeed } from '@/services/subscriptions';
import { debounce } from '@/utils';
import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Slider, SliderThumb, SliderTrack } from 'react-aria-components';
import { NavLink } from 'react-router-dom';

export default function PlayerGuard() {
  const currentEpisode = useCurrentEpisode();

  const {
    isPending,
    isError,
    data: episode,
    error,
  } = useQuery({
    queryKey: ['podcast', 'episode', currentEpisode?.id],
    queryFn: async () => {
      if (currentEpisode == null) return null;

      const episode = await episodeById(currentEpisode.id);
      await addEpisodesForFeed([episode]);
      return episode;
    },
    enabled: currentEpisode != null,
  });

  if (currentEpisode == null) {
    return;
  }

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (!episode) {
    return;
  }

  return <Player {...episode} />;
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

const RewindIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full absolute"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const FFIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full absolute"
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

type PlayerProps = Pick<
  ApiEpisode,
  'feedId' | 'author' | 'title' | 'image' | 'enclosureUrl' | 'duration'
>;

const initialVolume = await getVolume();

function Player({
  feedId,
  author,
  title,
  image,
  enclosureUrl,
  duration: episodeDuration,
}: PlayerProps) {
  const isPlaying = useStore($isPlaying);
  const currentEpisode = useCurrentEpisode();
  const playerSpeed = usePlayerSpeed();

  const audioPlayer = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // When the current episode changes, update the audio src and restore player progress.
  // This also kicks off a change to other effects, so it's important to get this one right.
  useEffect(() => {
    const setupAudioSource = async () => {
      if (currentEpisode?.id == null) return;

      // Use the cached source if available.
      let url = enclosureUrl;
      const cache = await caches.open('podcast-episode-cache/v1');
      const request = new Request('/episode/' + currentEpisode.id);
      const response = await cache.match(request);
      if (response) {
        // Swap the remote URL for the local one when the downloaded state changes
        // and resume playing. Note that we don't need to worry about swapping
        // local -> remote since the browser will play the local file in memory
        // anyway, even if we delete it while playing.
        const blob = await response.blob();
        url = URL.createObjectURL(blob);
        console.debug('Using cached episode:', currentEpisode.id);
      }

      setAudioSrc(url);
      // We need atomically update currentTime and duration to avoid jumpiness.
      // We could set duration to 0 here, but I found it jarring for the slider to jump to 0 when
      // changing episodes, then jump back to wherever it needs to be for current episode's
      // currentTime. On average, I think leaving the slider where it is until the metadata is
      // loaded in the other effect provides a less jumpy experience.
    };

    setupAudioSource();
  }, [enclosureUrl, currentEpisode?.id, currentEpisode?.downloaded]);

  // This is the big one:
  // 1) Handle buffering state of new episodes;
  // 2) sync updates from the player to local progress (for the slider); and
  // 3) persist progress per episode.
  useEffect(() => {
    const audio = audioPlayer.current;
    if (!audio) return;

    audio.currentTime = currentEpisode?.currentTime ?? 0;
    setIsBuffering(false);

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlayThrough = () => setIsBuffering(false);
    const handleLoadedMetadata = () => {
      setCurrentTime(currentEpisode?.currentTime ?? 0);
      setDuration(
        audio.duration === Infinity || isNaN(audio.duration)
          ? 0
          : audio.duration,
      );
    };

    // This interval needs to be fast enough to avoid the "skipping" effect
    // that happens when the update happens "in between" sync frames; it
    // looks like time skips a bit. But we also want to be respectful
    // to the device's battery life.
    const localUpdateInterval = 100;
    const persistedUpdateInterval = 4_000;
    let lastUpdatedLocalTime = Date.now();
    let lastUpdatedPersistedTime = Date.now();
    const handleTimeUpdate = () => {
      if (!currentEpisode?.id) return;

      const now = Date.now();
      const currentTime = audio.currentTime;
      // Throttle updates
      if (now - lastUpdatedLocalTime >= localUpdateInterval) {
        lastUpdatedLocalTime = Date.now();
        setCurrentTime(currentTime);
      }

      // We're near the end; mark at as done. This won't update the local
      // component; this syncs the state with the server in case we pick
      // up this episode elsewhere.
      if (audio.duration - audio.currentTime <= 10) {
        // Only update once at the end
        if (currentEpisode.progress !== 100) {
          updateProgressForEpisode({
            id: currentEpisode.id,
            progress: 100,
          });
        }
      } else {
        // Persist regular time updates even less frequently
        if (now - lastUpdatedPersistedTime >= persistedUpdateInterval) {
          lastUpdatedPersistedTime = Date.now();
          updateProgressForEpisode({
            id: currentEpisode.id,
            progress: currentTime,
          });
        }
      }
    };

    const handleEnded = () => {
      if (!currentEpisode?.id) return;

      pause();
      setCurrentTime(0);
      updateProgressForEpisode({
        id: currentEpisode.id,
        progress: 100,
      });
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      // Manually load the new source, since apparently some browsers
      // won't start playing properly if you don't.
      audio.load();
      audio
        .play()
        .catch((error) =>
          console.error('Error attempting to play audio:', error),
        );
    }

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };

    // Don't want to react to changes to anything other than audio source updates.
    // Other effects will handle reacting to the other relevant fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc]);

  // When the store playing state changes - e.g. when controlling it using a
  // different play / pause button - update the player playing state.
  useEffect(() => {
    const audio = audioPlayer.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Update the progress tracker if a mutation comes in while we're not playing.
  // This is important so that the player picks up where it left off when you switch episodes.
  useEffect(() => {
    if (!isPlaying) {
      if (currentEpisode?.currentTime == null) return;
      setCurrentTime(currentEpisode.currentTime);
    }
  }, [currentEpisode?.currentTime, isPlaying]);

  // Update player speed reactively.
  useEffect(() => {
    const audio = audioPlayer.current;
    if (!audio) return;
    audio.playbackRate = playerSpeed;
  }, [playerSpeed]);

  const rewind = useCallback(() => {
    const audio = audioPlayer.current;
    if (!audio) return;

    audio.currentTime -= 10;
    setCurrentTime((c) => c - 10);
  }, []);
  const fastForward = useCallback(() => {
    const audio = audioPlayer.current;
    if (!audio) return;

    audio.currentTime += 30;
    setCurrentTime((c) => c + 30);
  }, []);

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
          {formatDuration(currentTime, true)} /{' '}
          {formatDuration(episodeDuration * 1000)}
        </span>

        {audioSrc != null && (
          <Slider
            aria-label="Audio timeline"
            className="w-full"
            value={currentTime}
            minValue={0}
            maxValue={duration}
            step={0.1}
            onChange={(currentTime: number) => {
              setCurrentTime(currentTime);
              if (!audioPlayer.current) return;
              audioPlayer.current.currentTime = currentTime;
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
        )}
      </div>

      {/* Volume */}
      {audioSrc != null && (
        <Slider
          aria-label="Audio volume"
          className="w-full"
          defaultValue={initialVolume}
          minValue={0}
          maxValue={1}
          step={0.0001}
          onChange={(volume: number) => {
            if (!audioPlayer.current) return;
            audioPlayer.current.volume = volume;
            updateVolume(volume);
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
      )}

      <div>
        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 focus-visible:ring-2 focus:outline-none focus:ring-black"
          onClick={() => rewind()}
        >
          {RewindIcon}
          <div className="absolute font-semibold text-xs">
            <span className="sr-only">Rewind by</span>
            10
            <span className="sr-only">seconds</span>
          </div>
        </button>

        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 focus-visible:ring-2 focus:outline-none focus:ring-black"
          onClick={() => fastForward()}
        >
          {FFIcon}
          <div className="absolute font-semibold text-xs">
            <span className="sr-only">Fast-forward by</span>
            30
            <span className="sr-only">seconds</span>
          </div>
        </button>
      </div>

      <div className="container mx-auto max-w-screen-lg px-3 py-2 sm:px-6 sm:py-4 flex items-center justify-between gap-5">
        {/* TODO: maybe link to the episode instead? some sort of slide-in player? */}
        <NavLink
          unstable_viewTransition
          to={`/podcast/${feedId}`}
          className="flex items-center gap-5 truncate"
        >
          <div className="text-pink-700">{playerSpeed}x</div>

          {isBuffering && <div>Buffering...</div>}

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
            <div className="text-xl text-black font-medium overflow-hidden whitespace-nowrap truncate">
              {title}
            </div>
            <div className="text-xl text-gray-700 overflow-hidden whitespace-nowrap truncate">
              {author}
            </div>
          </div>
        </NavLink>

        {audioSrc != null && <audio ref={audioPlayer} src={audioSrc} />}

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

const updateVolume = debounce((volume: number) => {
  setAudioVolume(volume);
}, 300);

import { useEffect, useRef, useState, useId } from 'react';
import { extractYouTubeId, QUALITY_OPTIONS, qualityLabel } from '../utils/youtube.js';

// Re-export extractYouTubeId so consumers can import it directly from LecturePlayer
export { extractYouTubeId };

// Singleton loader to ensure https://www.youtube.com/iframe_api is only injected once
let ytApiPromise = null;
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);

  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        resolve(window.YT);
      };
    });
  }
  return ytApiPromise;
}

/**
 * Dedicated LecturePlayer component using the YouTube IFrame Player API.
 * Provides programmatic playback and quality controller via setPlaybackQuality().
 */
export default function LecturePlayer({
  videoUrl,
  videoId: propVideoId,
  title,
  autoPlay = false,
  className = '',
  onReady,
  onStateChange,
}) {
  const rawId = useId().replace(/[:]/g, '_');
  const containerId = `yt_player_${rawId}`;

  // Auto-extract 11-character video ID from raw ID, standard link, shortened link, or embed link
  const videoId = extractYouTubeId(propVideoId || videoUrl);

  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('default');
  const [activeQuality, setActiveQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [playerError, setPlayerError] = useState(null);

  // Initialize and manage YouTube Player lifecycle
  useEffect(() => {
    let isMounted = true;
    setPlayerError(null);
    setIsReady(false);

    if (!videoId) {
      return;
    }

    loadYouTubeIframeApi()
      .then((YT) => {
        if (!isMounted) return;

        // If player already exists, load the new video ID
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId,
            suggestedQuality: selectedQuality !== 'default' ? selectedQuality : undefined,
          });
          return;
        }

        // Create player instance
        const player = new YT.Player(containerId, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              playerRef.current = event.target;
              setIsReady(true);

              // Probe available qualities
              const levels = event.target.getAvailableQualityLevels?.() || [];
              setAvailableQualities(levels);

              const current = event.target.getPlaybackQuality?.() || 'auto';
              setActiveQuality(current);

              if (typeof onReady === 'function') onReady(event);
            },
            onPlaybackQualityChange: (event) => {
              if (!isMounted) return;
              setActiveQuality(event.data);
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              // When playback starts or state changes, refresh qualities
              if (event.target.getAvailableQualityLevels) {
                const levels = event.target.getAvailableQualityLevels();
                if (levels && levels.length > 0) setAvailableQualities(levels);
              }
              if (event.target.getPlaybackQuality) {
                setActiveQuality(event.target.getPlaybackQuality());
              }
              if (typeof onStateChange === 'function') onStateChange(event);
            },
            onError: (event) => {
              if (!isMounted) return;
              console.warn('YouTube Player error code:', event.data);
              setPlayerError(
                'This video cannot be played directly here. It may be private or restricted by YouTube.'
              );
            },
          },
        });
        playerRef.current = player;
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to initialize YouTube IFrame API:', err);
        setPlayerError('Unable to load YouTube player API. Please check your internet connection.');
      });

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          /* ignore destruction errors */
        }
        playerRef.current = null;
      }
    };
  }, [videoId, containerId]);

  // Handle Quality Selection Change via YouTube IFrame API
  const handleQualitySelect = (e) => {
    const quality = e.target.value;
    setSelectedQuality(quality);

    if (playerRef.current && typeof playerRef.current.setPlaybackQuality === 'function') {
      // 1. Programmatically set quality on YouTube Player API
      playerRef.current.setPlaybackQuality(quality);

      // 2. Re-buffer slightly if currently playing to apply resolution change immediately
      try {
        const state = playerRef.current.getPlayerState?.();
        // 1 = PLAYING, 2 = PAUSED
        if (state === 1 || state === 2) {
          const currentTime = playerRef.current.getCurrentTime?.() || 0;
          playerRef.current.seekTo(currentTime, true);
        }
      } catch {
        /* seekTo fallback */
      }
    }
  };

  if (!videoId) {
    return (
      <div className="lecture-player-error empty">
        <p>No valid YouTube video link or ID provided.</p>
      </div>
    );
  }

  return (
    <div className={`lecture-player ${className}`}>
      {/* 16:9 Responsive Video Container */}
      <div className="video-responsive-16-9">
        <div id={containerId} className="video-iframe-target" />
      </div>

      {/* Programmatic Player Toolbar & Quality Controller */}
      <div className="player-toolbar">
        <div className="player-meta">
          {title && <span className="player-title">{title}</span>}
          {isReady && (
            <span className="player-badge" title="Active stream resolution">
              Active: <strong>{qualityLabel(activeQuality)}</strong>
            </span>
          )}
        </div>

        <div className="player-controls">
          <label htmlFor={`quality_${rawId}`} className="player-quality-label">
            Quality:
          </label>
          <select
            id={`quality_${rawId}`}
            className="player-quality-select"
            value={selectedQuality}
            onChange={handleQualitySelect}
            aria-label="Select playback quality"
          >
            {QUALITY_OPTIONS.map((opt) => {
              // Highlight whether this quality is detected as available by the player
              const isDetected = availableQualities.length === 0 || availableQualities.includes(opt.value) || opt.value === 'default';
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {!isDetected && '(auto-scale)'}
                </option>
              );
            })}
          </select>

          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ghost player-yt-link"
            title="Watch on YouTube"
          >
            YouTube ↗
          </a>
        </div>
      </div>

      {playerError && (
        <div className="player-fallback-note note">
          <p>{playerError}</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="primary"
          >
            Open Video on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

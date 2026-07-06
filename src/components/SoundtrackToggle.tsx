import { useRef, useState } from 'react';

const soundtrackPath = '/audio/main-theme.mp3';

export function SoundtrackToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMissing, setIsMissing] = useState(false);

  async function handleToggle() {
    const audio = audioRef.current;
    if (!audio || isMissing) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      audio.volume = 0.35;
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsMissing(true);
      setIsPlaying(false);
    }
  }

  return (
    <div className="soundtrack-toggle">
      <audio
        loop
        preload="none"
        ref={audioRef}
        src={soundtrackPath}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsMissing(true);
          setIsPlaying(false);
        }}
      />
      <button
        aria-label="Включить или выключить саундтрек"
        className={isPlaying ? 'active' : ''}
        disabled={isMissing}
        type="button"
        onClick={handleToggle}
      >
        {isMissing ? 'No audio' : isPlaying ? 'Pause' : 'Theme'}
      </button>
    </div>
  );
}

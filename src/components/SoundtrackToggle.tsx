import { useRef, useState } from 'react';

const soundtrackPath = '/audio/succession-theme.mp3';
const comfortableVolume = 0.18;

export function SoundtrackToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [missingFile, setMissingFile] = useState(false);

  async function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = comfortableVolume;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setMissingFile(false);
      setIsPlaying(true);
    } catch {
      setMissingFile(true);
      setIsPlaying(false);
    }
  }

  return (
    <div className="soundtrack-control">
      <audio
        loop
        preload="none"
        ref={audioRef}
        src={soundtrackPath}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setMissingFile(true);
          setIsPlaying(false);
        }}
      />
      <button
        className={`soundtrack-button ${isPlaying ? 'active' : ''}`}
        type="button"
        onClick={handleToggle}
        title={missingFile ? 'Добавь файл public/audio/succession-theme.mp3' : 'Soundtrack'}
      >
        {isPlaying ? 'Sound on' : 'Soundtrack'}
      </button>
      {missingFile && <span>add mp3</span>}
    </div>
  );
}

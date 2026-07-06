import { useEffect, useRef, useState } from 'react';

const soundtrackPath = '/audio/main-theme.mp3';

export function SoundtrackToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldPlayRef = useRef(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    startSoundtrack();

    const startAfterGesture = () => {
      if (shouldPlayRef.current) {
        startSoundtrack();
      }
    };

    window.addEventListener('pointerdown', startAfterGesture);
    window.addEventListener('keydown', startAfterGesture);

    return () => {
      window.removeEventListener('pointerdown', startAfterGesture);
      window.removeEventListener('keydown', startAfterGesture);
    };
  }, []);

  async function startSoundtrack() {
    const audio = audioRef.current;
    if (!audio || isMissing || !shouldPlayRef.current) return;

    try {
      audio.volume = 0.28;
      await audio.play();
    } catch {
      // Browsers can block autoplay until the first user gesture.
    }
  }

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio || isMissing) return;

    if (shouldPlayRef.current) {
      shouldPlayRef.current = false;
      setIsEnabled(false);
      audio.pause();
      return;
    }

    shouldPlayRef.current = true;
    setIsEnabled(true);
    startSoundtrack();
  }

  return (
    <div className="soundtrack-toggle">
      <audio
        loop
        preload="auto"
        ref={audioRef}
        src={soundtrackPath}
        onCanPlay={() => {
          if (shouldPlayRef.current) startSoundtrack();
        }}
        onError={() => {
          setIsMissing(true);
        }}
      />
      <button
        aria-label="Выключить или включить фоновую музыку"
        className={isEnabled ? 'active' : ''}
        disabled={isMissing}
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleToggle}
      >
        {isMissing ? 'No audio' : isEnabled ? 'Theme on' : 'Theme off'}
      </button>
    </div>
  );
}

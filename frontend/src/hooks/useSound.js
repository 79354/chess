import { useRef, useCallback } from 'react';

const SOUNDS = {
  move: '/assets/sound/Move.mp3',
  capture: '/assets/sound/Capture.mp3',
  check: '/assets/sound/Check.mp3',
  checkmate: '/assets/sound/Checkmate.mp3',
};

function useSound() {
  const audioContextRef = useRef(null);
  const soundBuffersRef = useRef({});
  const enabledRef = useRef(true);
  const audioElementsRef = useRef({});

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported, falling back to HTML5 Audio');
      }
    }
  }, []);

  const loadSound = useCallback(async (name, url) => {
    if (soundBuffersRef.current[name]) return;

    try {
      initAudio();
      
      if (audioContextRef.current) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        soundBuffersRef.current[name] = audioBuffer;
      } else {
        // Fallback to HTML5 Audio
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioElementsRef.current[name] = audio;
      }
    } catch (error) {
      console.error(`Failed to load sound: ${name}`, error);
    }
  }, [initAudio]);

  const play = useCallback((soundName, volume = 1.0) => {
    if (!enabledRef.current) return;

    const soundUrl = SOUNDS[soundName];
    if (!soundUrl) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    try {
      if (audioContextRef.current && soundBuffersRef.current[soundName]) {
        // Use Web Audio API
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        source.buffer = soundBuffersRef.current[soundName];
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        source.start(0);
      } else {
        // Fallback to HTML5 Audio
        const audio = audioElementsRef.current[soundName] || new Audio(soundUrl);
        audio.volume = volume;
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Playback failed:', err));
      }
    } catch (error) {
      console.error(`Failed to play sound: ${soundName}`, error);
    }
  }, []);

  const playMove = useCallback(({ isCapture = false, isCheck = false } = {}) => {
    if (isCheck) {
      play('check');
    } else if (isCapture) {
      play('capture');
    } else {
      play('move');
    }
  }, [play]);

  const playCheckmate = useCallback(() => {
    play('checkmate');
  }, [play]);

  const setEnabled = useCallback((enabled) => {
    enabledRef.current = enabled;
  }, []);

  // Preload all sounds on mount
  const preloadSounds = useCallback(() => {
    Object.entries(SOUNDS).forEach(([name, url]) => {
      loadSound(name, url);
    });
  }, [loadSound]);

  return {
    play,
    playMove,
    playCheckmate,
    setEnabled,
    preloadSounds,
  };
}

export default useSound;
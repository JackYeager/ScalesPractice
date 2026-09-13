import React, { useState, useEffect, useRef, useCallback } from 'react';

interface MetronomeProps {
  initialBpm?: number;
}

export const Metronome: React.FC<MetronomeProps> = ({ initialBpm = 100 }) => {
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBeating, setIsBeating] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(bpm);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const beatTimeoutRef = useRef<number | null>(null);

  // Keep bpmRef synchronized
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Keep isPlayingRef synchronized
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Soft beep audio synthesis using Web Audio API
  const playSoftBeep = useCallback((audioCtx: AudioContext, time: number) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // 800 Hz sine wave for a mellow, pleasing soft beep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);

    // Smooth envelope: fast attack (2ms) and soft exponential decay (60ms) to eliminate popping
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }, []);

  // Lookahead scheduler
  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;
    const audioCtx = audioContextRef.current;
    const lookahead = 0.1; // schedule 100ms ahead

    while (nextNoteTimeRef.current < audioCtx.currentTime + lookahead) {
      const noteTime = nextNoteTimeRef.current;
      playSoftBeep(audioCtx, noteTime);

      // Trigger visual beat indicator
      const delayMs = Math.max(0, (noteTime - audioCtx.currentTime) * 1000);
      window.setTimeout(() => {
        if (!isPlayingRef.current) return;
        setIsBeating(true);
        if (beatTimeoutRef.current) {
          window.clearTimeout(beatTimeoutRef.current);
        }
        beatTimeoutRef.current = window.setTimeout(() => {
          setIsBeating(false);
        }, 100);
      }, delayMs);

      // Advance next note time according to current BPM
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }
  }, [playSoftBeep]);

  // Start metronome
  const startMetronome = async () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;

    // Run scheduler every 25ms
    timerIdRef.current = window.setInterval(scheduler, 25);
  };

  // Stop metronome
  const stopMetronome = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsBeating(false);

    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    if (beatTimeoutRef.current !== null) {
      window.clearTimeout(beatTimeoutRef.current);
      beatTimeoutRef.current = null;
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current !== null) {
        window.clearInterval(timerIdRef.current);
      }
      if (beatTimeoutRef.current !== null) {
        window.clearTimeout(beatTimeoutRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBpm(value);
  };

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.min(250, Math.max(30, prev + delta)));
  };

  // Tempo markings helper
  const getTempoLabel = (val: number) => {
    if (val < 60) return 'Largo';
    if (val < 76) return 'Adagio';
    if (val < 108) return 'Andante';
    if (val < 120) return 'Moderato';
    if (val < 168) return 'Allegro';
    if (val < 200) return 'Presto';
    return 'Prestissimo';
  };

  return (
    <div className="card metronome-card" style={{ padding: '0.85rem 1.25rem' }}>
      <div className="metronome-container">
        {/* Left: BPM Info and Visual Pulse */}
        <div className="metronome-info-group">
          <div className="metronome-title-row">
            <span className="metronome-label">Metronome</span>
            <div className={`metronome-pulse-indicator ${isBeating ? 'active' : ''}`} />
          </div>
          <div className="metronome-bpm-display">
            <span className="metronome-bpm-number">{bpm}</span>
            <div className="metronome-bpm-sub">
              <span className="metronome-bpm-unit">BPM</span>
              <span className="metronome-tempo-name">{getTempoLabel(bpm)}</span>
            </div>
          </div>
        </div>

        {/* Center: Slider & Quick Adjust Controls */}
        <div className="metronome-slider-group">
          <div className="metronome-slider-controls">
            <button
              type="button"
              className="metronome-adjust-btn"
              onClick={() => adjustBpm(-1)}
              aria-label="Decrease BPM by 1"
              title="Decrease 1 BPM"
            >
              -
            </button>

            <div className="metronome-range-wrapper">
              <input
                type="range"
                min="30"
                max="250"
                value={bpm}
                onChange={handleSliderChange}
                className="metronome-slider"
                id="metronome-bpm-slider"
                aria-label="BPM slider"
              />
              <div className="metronome-slider-ticks">
                {[30, 60, 100, 140, 180, 220, 250].map((tick) => {
                  const percent = ((tick - 30) / (250 - 30)) * 100;
                  return (
                    <span
                      key={tick}
                      style={{
                        position: 'absolute',
                        left: `${percent}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {tick}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="metronome-adjust-btn"
              onClick={() => adjustBpm(1)}
              aria-label="Increase BPM by 1"
              title="Increase 1 BPM"
            >
              +
            </button>
          </div>
        </div>

        {/* Right: Play / Pause Button */}
        <div className="metronome-action-group">
          <button
            type="button"
            className={`btn metronome-play-btn ${isPlaying ? 'is-playing' : ''}`}
            onClick={togglePlay}
            id="btn-metronome-toggle"
            aria-label={isPlaying ? 'Pause metronome' : 'Play metronome'}
          >
            {isPlaying ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

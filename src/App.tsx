import { useState, useEffect } from 'react';
import { Scale, Note } from '@tonaljs/tonal';
import { Fretboard } from './components/Fretboard';
import { ScaleDetails } from './components/ScaleDetails';

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const SCALE_TYPES = [
  { name: 'Major (Ionian)', value: 'major' },
  { name: 'Natural Minor (Aeolian)', value: 'minor' },
  { name: 'Harmonic Minor', value: 'harmonic minor' },
  { name: 'Melodic Minor', value: 'melodic minor' },
  { name: 'Dorian Mode', value: 'dorian' },
  { name: 'Phrygian Mode', value: 'phrygian' },
  { name: 'Lydian Mode', value: 'lydian' },
  { name: 'Mixolydian Mode', value: 'mixolydian' },
  { name: 'Locrian Mode', value: 'locrian' },
  { name: 'Major Pentatonic', value: 'major pentatonic' },
  { name: 'Minor Pentatonic', value: 'minor pentatonic' },
  { name: 'Blues Scale', value: 'blues' },
  { name: 'Whole Tone', value: 'whole tone' },
  { name: 'Half-Whole Diminished', value: 'half-whole diminished' },
];

function App() {
  const [root, setRoot] = useState('E');
  const [scaleType, setScaleType] = useState('minor pentatonic');

  // Tonal.js Scale object state
  const [currentScale, setCurrentScale] = useState<any>(null);

  // User preferences states
  const [showIntervals, setShowIntervals] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  // Trigger scale calculation whenever root or scaleType changes
  useEffect(() => {
    const scaleName = `${root} ${scaleType}`;
    const calculatedScale = Scale.get(scaleName);
    setCurrentScale(calculatedScale);
    console.log(Scale.get(scaleName).notes);
  }, [root, scaleType]);

  // Generate a random scale (Root + Type)
  const handleRandomScale = () => {
    const randomRoot = ROOTS[Math.floor(Math.random() * ROOTS.length)];
    const randomType = SCALE_TYPES[Math.floor(Math.random() * SCALE_TYPES.length)].value;
    setRoot(randomRoot);
    setScaleType(randomType);
  };

  // Play audio tone on fret note click
  const handleNoteClick = (noteName: string) => {
    try {
      let noteWithOctave = noteName;
      if (!/[0-9]/.test(noteName)) {
        noteWithOctave = `${noteName}3`;
      }

      const midi = Note.midi(noteWithOctave);
      if (!midi) return;

      const frequency = Math.pow(2, (midi - 69) / 12) * 440;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('AudioContext blocked:', e);
    }
  };

  return (
    <>
      <header style={{ marginBottom: '0.75rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 700 }}>Scale Practice Tool</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>💡 Click notes to play audio tone</span>
      </header>

      <main style={{ gap: '1rem' }}>
        {/* 1. Scale Information at the Top */}
        {currentScale && <ScaleDetails scale={currentScale} />}

        {/* 2. Guitar Fretboard in the Middle */}
        {currentScale && (
          <Fretboard
            scale={currentScale}
            showIntervals={showIntervals}
            showAllNotes={showAllNotes}
            onNoteClick={handleNoteClick}
          />
        )}

        {/* 3. Controls Card at the Bottom */}
        <section className="card controls-section" style={{ padding: '0.85rem 1.25rem' }}>
          <div className="selection-group">
            <div className="control-item">
              <label htmlFor="root-select" style={{ fontSize: '0.75rem' }}>Root Key</label>
              <select
                id="root-select"
                value={root}
                onChange={(e) => setRoot(e.target.value)}
                style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', fontSize: '0.9rem' }}
              >
                {ROOTS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-item">
              <label htmlFor="scale-select" style={{ fontSize: '0.75rem' }}>Scale Formula</label>
              <select
                id="scale-select"
                value={scaleType}
                onChange={(e) => setScaleType(e.target.value)}
                style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', fontSize: '0.9rem' }}
              >
                {SCALE_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-item" style={{ justifyContent: 'flex-end', height: '100%', paddingTop: '1.1rem' }}>
              <button
                type="button"
                className="btn"
                onClick={handleRandomScale}
                id="btn-random-scale"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Random Scale
              </button>
            </div>
          </div>

          <div className="toggles-group" style={{ gap: '1.25rem' }}>
            <label className="toggle-item" htmlFor="toggle-intervals">
              <input
                type="checkbox"
                id="toggle-intervals"
                checked={showIntervals}
                onChange={(e) => setShowIntervals(e.target.checked)}
              />
              <div className="toggle-switch" style={{ width: '2.5rem', height: '1.35rem' }}></div>
              <span className="toggle-label" style={{ fontSize: '0.85rem' }}>Show Intervals</span>
            </label>

            <label className="toggle-item" htmlFor="toggle-all-notes">
              <input
                type="checkbox"
                id="toggle-all-notes"
                checked={showAllNotes}
                onChange={(e) => setShowAllNotes(e.target.checked)}
              />
              <div className="toggle-switch" style={{ width: '2.5rem', height: '1.35rem' }}></div>
              <span className="toggle-label" style={{ fontSize: '0.85rem' }}>Show All Notes</span>
            </label>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;

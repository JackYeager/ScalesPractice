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

// Scale of the Day Helpers
const getESTDateString = () => {
  try {
    return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  } catch (e) {
    const d = new Date();
    // Fallback timezone offset shift to EST (approx UTC-5)
    const est = new Date(d.getTime() + (d.getTimezoneOffset() - 300) * 60000);
    return `${est.getMonth() + 1}/${est.getDate()}/${est.getFullYear()}`;
  }
};

const getStringHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

// Exclude minor pentatonic scale for the daily challenge
const SCALE_TYPES_FOR_DAY = SCALE_TYPES.filter(st => (st.value !== 'minor pentatonic') && (st.value !== 'major pentatonic'));

const getScaleOfTheDay = () => {
  const dateStr = getESTDateString();
  const seed = getStringHash(dateStr);
  const rootVal = ROOTS[seed % ROOTS.length];
  const typeVal = SCALE_TYPES_FOR_DAY[(seed >> 4) % SCALE_TYPES_FOR_DAY.length].value;
  return { root: rootVal, type: typeVal };
};

function App() {
  // Default on first launch to Scale of the Day
  const initialSotd = getScaleOfTheDay();
  const [root, setRoot] = useState(initialSotd.root);
  const [scaleType, setScaleType] = useState(initialSotd.type);

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
  }, [root, scaleType]);

  // Determine if the current scale matches the Scale of the Day
  const sotdToday = getScaleOfTheDay();
  const isSotd = root === sotdToday.root && scaleType === sotdToday.type;

  // Generate a random scale (Root + Type)
  const handleRandomScale = () => {
    const randomRoot = ROOTS[Math.floor(Math.random() * ROOTS.length)];
    const randomType = SCALE_TYPES[Math.floor(Math.random() * SCALE_TYPES.length)].value;
    setRoot(randomRoot);
    setScaleType(randomType);
  };

  // Set selected scale to Scale of the Day
  const handleLoadScaleOfTheDay = () => {
    const today = getScaleOfTheDay();
    setRoot(today.root);
    setScaleType(today.type);
  };


  return (
    <>
      <header style={{ marginBottom: '0.75rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 700 }}>Scale Practice</h1>
      </header>

      <main style={{ gap: '1rem' }}>
        {/* 1. Scale Information at the Top */}
        {currentScale && <ScaleDetails scale={currentScale} isScaleOfTheDay={isSotd} />}

        {/* 2. Guitar Fretboard in the Middle */}
        {currentScale && (
          <Fretboard
            scale={currentScale}
            showIntervals={showIntervals}
            showAllNotes={showAllNotes}
          //onNoteClick={handleNoteClick}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLoadScaleOfTheDay}
                  id="btn-scale-of-the-day"
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Scale of the Day
                </button>
              </div>
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

import React from 'react';
import { Note } from '@tonaljs/tonal';

// Define the guitar strings (standard tuning: E4, B3, G3, D3, A2, E2)
// High E string is at index 0 (top of the fretboard visually)
const STRINGS = [
  { name: 'E', openNote: 'E4', thickness: '1px' },
  { name: 'B', openNote: 'B3', thickness: '1.5px' },
  { name: 'G', openNote: 'G3', thickness: '2px' },
  { name: 'D', openNote: 'D3', thickness: '2.5px' },
  { name: 'A', openNote: 'A2', thickness: '3px' },
  { name: 'E', openNote: 'E2', thickness: '3.5px' },
];

const TOTAL_FRETS = 15;

// Fret positions using the rule of 18 (proportional spacing)
// x_n = 1 - (1 / 2^(n/12))
// We map n = 0 to 15 onto the width of the fretboard (5% to 100%)
const getFretPositions = () => {
  const positions: number[] = [5.0]; // nut is at 5%
  const maxVal = 1 - Math.pow(2, -TOTAL_FRETS / 12);

  for (let i = 1; i <= TOTAL_FRETS; i++) {
    const val = 1 - Math.pow(2, -i / 12);
    const percentage = 5.0 + 95.0 * (val / maxVal);
    positions.push(percentage);
  }
  return positions;
};

const FRET_POSITIONS = getFretPositions();

// Fret center positions for rendering note bubbles
const getFretCenters = () => {
  const centers: number[] = [2.0]; // Fret 0 (open string) is at 2%
  for (let i = 1; i <= TOTAL_FRETS; i++) {
    centers.push((FRET_POSITIONS[i - 1] + FRET_POSITIONS[i]) / 2);
  }
  return centers;
};

const FRET_CENTERS = getFretCenters();

// Standard chromatic scale spelling (sharps by default for non-scale notes)
const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface FretboardProps {
  scale: any; // Tonal.js Scale object
  showIntervals: boolean;
  showAllNotes: boolean;
  onNoteClick?: (noteName: string) => void;
}

export const Fretboard: React.FC<FretboardProps> = ({
  scale,
  showIntervals,
  showAllNotes,
  onNoteClick,
}) => {
  // Build maps for quick note lookup inside the current scale
  const scaleChromas = new Map<number, { note: string; interval: string }>();

  if (scale && !scale.empty && scale.notes) {
    scale.notes.forEach((note: string, idx: number) => {
      const chroma = Note.chroma(note);
      if (chroma !== undefined && chroma !== null) {
        scaleChromas.set(chroma, {
          note,
          interval: scale.intervals[idx] || '',
        });
      }
    });
  }

  // Check if a fret markers (dots) belongs to a fret index
  const hasMarker = (fretIndex: number) => {
    return [3, 5, 7, 9, 15].includes(fretIndex);
  };

  const hasDoubleMarker = (fretIndex: number) => {
    return fretIndex === 12;
  };

  // Helper to format intervals for display (e.g. 1P -> R, 3m -> b3)
  const formatIntervalDisplay = (interval: string) => {
    const map: { [key: string]: string } = {
      '1P': 'R', '1d': 'd1', '1A': '#1',
      '2m': 'b2', '2M': '2', '2A': '#2',
      '3m': 'b3', '3M': '3', '3A': '#3',
      '4P': '4', '4d': 'b4', '4A': '#4',
      '5P': '5', '5d': 'b5', '5A': '#5',
      '6m': 'b6', '6M': '6', '6A': '#6',
      '7m': 'b7', '7M': '7', '7A': '#7',
    };

    // Replace higher octaves
    const clean = interval.replace('9', '2').replace('11', '4').replace('13', '6');
    return map[clean] || interval;
  };

  // Render a note bubble for a specific string and fret
  const renderNoteCell = (stringInfo: typeof STRINGS[0], stringIdx: number, fret: number) => {
    const openChroma = Note.chroma(Note.pitchClass(stringInfo.openNote));
    if (openChroma === undefined || openChroma === null) return null;

    const noteChroma = (openChroma + fret) % 12;

    // Check if the note is in the current scale
    const scaleMatch = scaleChromas.get(noteChroma);
    const isActive = !!scaleMatch;

    // Determine note name spelling
    // If it's in the scale, use the scale spelling (e.g. Db). Else use sharp chromatic spelling.
    const noteName = isActive ? scaleMatch!.note : CHROMATIC_SHARPS[noteChroma];

    // Determine root note
    const isRoot = isActive && Note.chroma(scale.tonic) === noteChroma;

    // Determine interval display name
    const intervalDisplay = isActive ? formatIntervalDisplay(scaleMatch!.interval) : '';

    // Handle bubble visibility logic based on preferences
    // If showAllNotes is true, we display all notes but dim inactive ones
    // If showAllNotes is false, we only display active notes (scale notes)
    const shouldHide = !isActive && !showAllNotes;

    const displayLabel = showIntervals && isActive ? intervalDisplay : noteName;

    const leftPos = fret === 0 ? 0 : FRET_POSITIONS[fret - 1];
    const widthPos = fret === 0 ? 5 : FRET_POSITIONS[fret] - FRET_POSITIONS[fret - 1];

    return (
      <div
        key={`fret-${stringIdx}-${fret}`}
        className={`fret-cell fret-cell-${fret}`}
        style={{
          left: `${leftPos}%`,
          width: `${widthPos}%`,
        }}
        onClick={() => onNoteClick && onNoteClick(noteName)}
        title={`${noteName}${isActive ? ` (${scaleMatch!.interval})` : ''}`}
      >
        <div
          className={`note-bubble ${isActive ? 'is-active' : ''} ${isRoot ? 'is-root-note' : ''} ${shouldHide ? 'is-hidden' : ''
            }`}
          id={`note-${stringIdx}-${fret}`}
        >
          {shouldHide ? '' : displayLabel}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Interactive Fretboard</h3>

      <div className="fretboard-container">
        {/* Fretboard Labels Row (top of fretboard) */}
        <div className="fret-number-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
          {FRET_CENTERS.map((pos, idx) => (
            <div
              key={`label-top-${idx}`}
              className="fret-number-cell"
              style={{ left: `${pos}%` }}
            >
              {idx === 0 ? 'Open' : idx}
            </div>
          ))}
        </div>

        {/* Fretboard Graphic Wrapper */}
        <div className="fretboard">
          {/* Fretboard Nut */}
          <div className="nut" style={{ left: `${FRET_POSITIONS[0]}%` }}></div>

          {/* Fret Wires */}
          <div className="frets-bg">
            {FRET_POSITIONS.slice(0, -1).map((pos, idx) => (
              <div
                key={`fretwire-${idx}`}
                className="fret-wire"
                style={{ left: `${pos}%` }}
              ></div>
            ))}
          </div>

          {/* Fret Marker Dots */}
          <div className="fretboard-markers">
            {FRET_CENTERS.map((pos, idx) => {
              if (hasMarker(idx)) {
                return (
                  <div
                    key={`marker-${idx}`}
                    className="fret-marker-dot"
                    style={{ left: `${pos}%` }}
                  ></div>
                );
              }
              if (hasDoubleMarker(idx)) {
                return (
                  <React.Fragment key={`marker-${idx}`}>
                    <div
                      className="fret-marker-dot-double-top"
                      style={{ left: `${pos}%` }}
                    ></div>
                    <div
                      className="fret-marker-dot-double-bottom"
                      style={{ left: `${pos}%` }}
                    ></div>
                  </React.Fragment>
                );
              }
              return null;
            })}
          </div>

          {/* Guitar Strings & Note Interactive Overlay */}
          {STRINGS.map((stringInfo, stringIdx) => (
            <div key={`string-row-${stringIdx}`} className="string-row">
              {/* String Wire graphic behind note interactive layer */}
              <div
                className="string-wire"
                style={{
                  '--thickness': stringInfo.thickness,
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: 0,
                  right: 0,
                  pointerEvents: 'none',
                  opacity: 0.75,
                } as React.CSSProperties}
              ></div>

              {/* Fret cells for notes */}
              {Array.from({ length: TOTAL_FRETS + 1 }).map((_, fretIdx) =>
                renderNoteCell(stringInfo, stringIdx, fretIdx)
              )}
            </div>
          ))}
        </div>

        {/* Fretboard Labels Row (bottom of fretboard) */}
        <div className="fret-number-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
          {FRET_CENTERS.map((pos, idx) => (
            <div
              key={`label-bottom-${idx}`}
              className="fret-number-cell"
              style={{ left: `${pos}%` }}
            >
              {idx === 0 ? 'Nut' : idx}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

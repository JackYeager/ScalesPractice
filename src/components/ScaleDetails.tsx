import React from 'react';
import { Note, Chord } from '@tonaljs/tonal';

interface ScaleDetailsProps {
  scale: any; // Tonal.js Scale object
}

export const ScaleDetails: React.FC<ScaleDetailsProps> = ({ scale }) => {
  if (!scale || scale.empty) {
    return (
      <div className="card" style={{ padding: '0.75rem' }}>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
          Select or generate a scale to begin.
        </p>
      </div>
    );
  }

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
    const clean = interval.replace('9', '2').replace('11', '4').replace('13', '6');
    return map[clean] || interval;
  };

  // Generate diatonic chords for each note of the scale
  const getDiatonicChords = () => {
    if (!scale || !scale.notes || scale.notes.length === 0) return [];
    
    const notes = scale.notes;
    const K = notes.length;
    
    return notes.map((root: string, idx: number) => {
      // Stacking thirds: root, third (idx + 2), fifth (idx + 4), seventh (idx + 6)
      const triad = [
        root,
        notes[(idx + 2) % K],
        notes[(idx + 4) % K],
      ];
      
      const seventh = [
        root,
        notes[(idx + 2) % K],
        notes[(idx + 4) % K],
        notes[(idx + 6) % K],
      ];
      
      // Chord.detect returns possible chord names; we grab the first/best one
      const detectedTriad = Chord.detect(triad)[0] || '';
      const detectedSeventh = Chord.detect(seventh)[0] || '';
      
      // Clean "CM" -> "C" (Major shorthand cleanup)
      const cleanTriad = detectedTriad.replace(/M$/, '');
      
      return {
        root,
        triad: cleanTriad,
        seventh: detectedSeventh,
      };
    });
  };

  const chords = getDiatonicChords();

  return (
    <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active Scale
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{scale.name}</h2>
        </div>
        <div className="notes-container" style={{ marginTop: 0, gap: '0.5rem' }}>
          {scale.notes.map((note: string, idx: number) => {
            const isRoot = Note.chroma(note) === Note.chroma(scale.tonic);
            const interval = scale.intervals[idx] || '';
            
            return (
              <div
                key={`note-badge-${note}`}
                className={`note-badge is-scale-note ${isRoot ? 'is-root' : ''}`}
                style={{ padding: '0.35rem 0.75rem', minWidth: '2.75rem', borderRadius: '6px' }}
              >
                <span className="note-name" style={{ fontSize: '0.95rem' }}>{note}</span>
                <span className="note-interval" style={{ fontSize: '0.65rem', marginTop: '0.1rem' }}>
                  {isRoot ? 'R' : formatIntervalDisplay(interval)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {chords.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
            Accompanying Diatonic Chords
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {chords.map((chord: any, idx: number) => (
              <div 
                key={`chord-${idx}`} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: 'rgba(48, 56, 65, 0.03)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '0.25rem 0.5rem', 
                  minWidth: '3.5rem', 
                  textAlign: 'center',
                  flexGrow: 1,
                  flexBasis: '60px'
                }}
              >
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Degree {idx + 1}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-orange)', margin: '0.05rem 0' }}>{chord.triad || '?'}</span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{chord.seventh || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

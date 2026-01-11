"use client";

import { useState } from 'react';
import HandTracker from '../HandTracker';
import { TranscriptPanel } from '../ui/components/TranscriptPanel';
import { CameraPanel } from '../ui/components/CameraPanel';

export default function Home() {
  // Store the history of translated sentences
  const [transcript, setTranscript] = useState<{ text: string; emotion: string; timestamp: number }[]>([]);

  // Callback when HandTracker finishes a sentence
  const handleSentenceComplete = (text: string, emotion: string) => {
    setTranscript(prev => [
      ...prev, 
      { text, emotion, timestamp: Date.now() }
    ]);
  };

  const clearTranscript = () => setTranscript([]);

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* HEADER */}
      <header style={{ 
        padding: '20px 40px', 
        borderBottom: '1px solid #334155', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: 12, height: 12, background: '#00FF7F', borderRadius: '50%', boxShadow: '0 0 10px #00FF7F' }} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', letterSpacing: '-0.5px' }}>VitalSign AI</h1>
        </div>
        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
          System Operational
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', // Split: Camera (Auto) | Transcript (Fixed)
        gap: '20px', 
        padding: '20px',
        height: 'calc(100vh - 80px)' 
      }}>
        
        {/* LEFT: CAMERA FEED */}
        <div style={{ 
          background: '#1e293b', 
          borderRadius: '16px', 
          border: '1px solid #334155', 
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <CameraPanel>
            {/* We pass compact=true so HandTracker fits inside this panel nicely */}
            <HandTracker 
              onSentenceComplete={handleSentenceComplete} 
              compact={true} 
            />
          </CameraPanel>
        </div>

        {/* RIGHT: TRANSCRIPT HISTORY */}
        <div style={{ 
          background: '#1e293b', 
          borderRadius: '16px', 
          border: '1px solid #334155', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <TranscriptPanel history={transcript} onClear={clearTranscript} />
        </div>

      </div>
    </main>
  );
}
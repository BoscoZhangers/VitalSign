"use client";

import React, { useEffect, useRef } from 'react';

interface TranscriptItem {
  text: string;
  emotion: string;
  timestamp: number;
}

interface TranscriptPanelProps {
  history: TranscriptItem[];
  onClear: () => void;
  voice: "female" | "male";
  onVoiceChange: (v: "female" | "male") => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isProcessing: boolean; // <--- NEW PROP
}

export function TranscriptPanel({ 
  history, 
  onClear, 
  voice, 
  onVoiceChange,
  volume,
  onVolumeChange,
  isProcessing // <--- Destructure new prop
}: TranscriptPanelProps) {
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when history changes OR when processing starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing]);

  return (
    <>
      <style jsx>{`
        /* CUSTOM RANGE SLIDER */
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--vs-accent);
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: rgba(128,128,128,0.3);
          border-radius: 2px;
        }

        /* THINKING DOTS ANIMATION */
        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--vs-accent);
          color: var(--vs-accent);
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0.5s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--vs-accent);
          color: var(--vs-accent);
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--vs-accent);
          color: var(--vs-accent);
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 1s;
        }
        @keyframes dot-flashing {
          0% { background-color: var(--vs-accent); }
          50%, 100% { background-color: rgba(47, 154, 143, 0.2); }
        }
      `}</style>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        background: 'rgba(0,0,0,0.02)',
        position: 'relative'
      }}>
        
        {/* 1. TOP BAR */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid var(--vs-border)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--vs-surface)',
          borderTopRightRadius: '20px',
          borderTopLeftRadius: '20px'
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--vs-text)' }}>
            Transcript History
          </h2>
          <button 
            onClick={onClear}
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--vs-border)', 
              color: 'var(--vs-muted)', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        {/* 2. SCROLLABLE LIST */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          scrollBehavior: 'smooth'
        }}>
          {history.length === 0 && !isProcessing ? (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--vs-muted)', 
              opacity: 0.7,
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>💬</span>
              <span style={{ fontSize: '15px' }}>Ready to translate...</span>
            </div>
          ) : (
            history.map((item, i) => (
              <div key={i} style={{ 
                background: 'var(--vs-surface)',
                border: '1px solid var(--vs-border)',
                borderRadius: '16px',
                padding: '20px',
                paddingTop: '42px',
                width: '100%',
                position: 'relative',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ 
                  position: 'absolute', top: '14px', left: '18px',
                  fontSize: '12px', color: 'var(--vs-muted)', fontWeight: '600', opacity: 0.8
                }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(47, 154, 143, 0.1)',
                  border: '1px solid rgba(47, 154, 143, 0.2)',
                  borderRadius: '20px', padding: '4px 12px',
                  fontSize: '11px', fontWeight: '700', color: 'var(--vs-accent)',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {item.emotion || 'NEUTRAL'}
                </div>
                <div style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--vs-text)' }}>
                  {item.text}
                </div>
              </div>
            ))
          )}

          {/* THINKING BUBBLE (Only visible when isProcessing is true) */}
          {isProcessing && (
             <div style={{ 
                alignSelf: 'flex-start',
                background: 'var(--vs-surface)',
                border: '1px solid var(--vs-border)',
                borderRadius: '16px',
                borderBottomLeftRadius: '4px', // Speech bubble look
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: 'fit-content',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
             }}>
               <span style={{ fontSize: '12px', color: 'var(--vs-muted)', marginRight: '8px', fontWeight: '600' }}>AI is thinking</span>
               <div className="dot-flashing" style={{ marginLeft: '12px' }}></div>
             </div>
          )}
          
          <div ref={bottomRef} />
        </div>

        {/* 3. AUDIO PREFERENCES */}
        <div style={{ 
          padding: '24px', 
          borderTop: '1px solid var(--vs-border)', 
          background: 'var(--vs-surface)',
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '20px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--vs-muted)', letterSpacing: '1.2px', fontWeight: '700', margin: 0 }}>
              Audio Output
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--vs-text)', fontWeight: '600' }}>
              {volume}%
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', background: 'var(--vs-bg)', borderRadius: '10px', padding: '4px', border: '1px solid var(--vs-border)' }}>
              {(['female', 'male'] as const).map((v) => (
                <button key={v} onClick={() => onVoiceChange(v)} style={{
                    background: voice === v ? 'var(--vs-surface)' : 'transparent',
                    color: voice === v ? 'var(--vs-text)' : 'var(--vs-muted)',
                    border: 'none', padding: '6px 16px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize',
                    boxShadow: voice === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}>{v}</button>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '16px', opacity: 0.5 }}>🔈</span>
              <input type="range" min="0" max="100" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: '16px', opacity: 0.8 }}>🔊</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
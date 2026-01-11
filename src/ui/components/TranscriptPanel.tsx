import { useEffect, useRef } from "react";

interface TranscriptItem {
  text: string;
  emotion: string;
  timestamp: number;
}

interface TranscriptPanelProps {
  history: TranscriptItem[];
  onClear: () => void;
}

export function TranscriptPanel({ history, onClear }: TranscriptPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid #334155', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Transcript</h2>
        <button 
          onClick={onClear}
          style={{ 
            background: 'transparent', 
            border: '1px solid #475569', 
            color: '#94a3b8', 
            padding: '6px 12px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear
        </button>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>
            <p>No speech detected yet.</p>
            <p style={{ fontSize: '12px' }}>Sign to the camera to begin translation.</p>
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} style={{ 
              background: '#0f172a', 
              padding: '15px', 
              borderRadius: '12px', 
              borderLeft: '4px solid #3b82f6' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  color: '#64748b', 
                  fontWeight: 'bold' 
                }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  background: '#1e293b', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  color: item.emotion === 'Happy' ? '#4ade80' : item.emotion === 'Sad' ? '#60a5fa' : '#94a3b8' 
                }}>
                  {item.emotion || "Neutral"}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.5', fontSize: '15px' }}>
                {item.text}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* FOOTER ACTIONS */}
      <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
        <button style={{ 
          width: '100%', 
          padding: '12px', 
          background: '#3b82f6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          fontWeight: '600', 
          cursor: 'pointer' 
        }}>
          🔊 Read Aloud
        </button>
      </div>
    </div>
  );
}
import type { ReactNode } from "react";

export function CameraPanel({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Top Status Bar overlay */}
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        right: 20, 
        display: 'flex', 
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', 
          padding: '6px 12px', 
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#00FF7F',
          border: '1px solid rgba(0,255,127,0.2)'
        }}>
          ● LIVE FEED
        </div>
      </div>

      {/* The HandTracker Component goes here */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}
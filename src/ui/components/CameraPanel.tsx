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
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(12px)', 
          padding: '8px 14px', 
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: '600',
          color: 'var(--vs-accent)',
          border: '1px solid rgb(var(--vs-accent-rgb) / 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(var(--vs-accent-rgb), 0.15)',
          letterSpacing: '0.5px'
        }}>
          ● LIVE FEED
        </div>
      </div>

      {/* The HandTracker Component goes here */}
      <div style={{ marginTop: '-80px', width: '1250px', height: '650px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    borderRadius: '24px',  // Adjust this number for more/less roundness
                    overflow: 'hidden',    // This is CRITICAL to clip the video corners
                    border: '1px solid var(--vs-border)'
      }}>
        {children}
      </div>
    </div>
  );
}
"use client";

import Link from 'next/link';
// Removed ShinyText import as we are replacing it with standard colored text
// import ShinyText from '@/src/ui/components/ShinyText'; 

const gestures = [
  { name: "HELLO", icon: "👋", desc: "Wave your hand side-to-side (at least 2 swipes)." },
  { name: "THANK YOU", icon: "🙏", desc: "Hold palm open, then move hand down vertically." },
  { name: "GOODBYE", icon: "🫡", desc: "Salute! Flat hand, fingers together, near your head." },
  { name: "HELP", icon: "🆘", desc: "Palm open with your Thumb tucked in." },
  { name: "YES", icon: "👍", desc: "Thumbs Up." },
  { name: "NO", icon: "👎", desc: "Thumbs Down." },
  { name: "LOVE", icon: "🤟", desc: "Index + Pinky + Thumb extended (ILY sign)." },
  { name: "CALL", icon: "🤙", desc: "Thumb + Pinky extended, held sideways." },
  { name: "ME", icon: "👈", desc: "Point at yourself with your thumb." },
  { name: "YOU", icon: "🫵", desc: "Point at the screen with your index finger." },
  { name: "I", icon: "ℹ️", desc: "Pinky finger extended up." },
];

export default function TutorialPage() {
  const handleStartClick = () => {
    window.location.href = '/';
  };

  return (
    <>
      <style>{`
        .gesture-card {
          background: var(--vs-surface);
          border: 1px solid var(--vs-border);
          border-radius: 16px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          position: relative;
        }

        .gesture-card:hover {
          transform: scale(1.05) translateY(-5px);
          border-color: var(--vs-accent);
          box-shadow: 0 10px 30px -10px rgba(47, 154, 143, 0.2); /* Adjusted shadow color for light mode safety */
          z-index: 10;
          background: var(--vs-surface); /* Ensures card stays solid */
        }

        main::-webkit-scrollbar { width: 10px; }
        main::-webkit-scrollbar-track { background: var(--vs-bg); }
        main::-webkit-scrollbar-thumb { background: var(--vs-border); border-radius: 5px; }
        main::-webkit-scrollbar-thumb:hover { background: var(--vs-accent); }

        .start-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .start-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(47, 154, 143, 0.5);
        }
      `}</style>

      <main style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--vs-bg)',
        color: 'var(--vs-text)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        paddingTop: '80px' // Keeps the Navbar clearance
      }}>
        {/* CONTENT AREA (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', textAlign: 'center' }}>
            
            {/* UPDATED HEADER: Uses vs-accent to be visible in Light Mode */}
            <h2 style={{ 
              fontSize: '48px', 
              marginBottom: '10px', 
              color: 'var(--vs-accent)', // <--- Matches the gesture cells
              fontWeight: '800',
              letterSpacing: '-1px'
            }}>
              Gesture Library
            </h2>
            
            <p style={{ color: 'var(--vs-muted)', fontSize: '18px' }}>
              Master the signals to communicate with VitalSign AI.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1000px',
            margin: '0 auto',
            paddingBottom: '120px'
          }}>
            {gestures.map((g) => (
              <div key={g.name} className="gesture-card">
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>{g.icon}</div>
                <h3 style={{
                  color: 'var(--vs-accent)', // This is the color we matched above
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {g.name}
                </h3>
                <p style={{ color: 'var(--vs-muted)', lineHeight: '1.5' }}>
                  {g.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Floating Footer */}
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '0',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 999
        }}>
          <button
            className="start-btn"
            onClick={handleStartClick}
            style={{
              pointerEvents: 'auto',
              background: 'var(--vs-accent)',
              color: '#000', // Keeps text black for contrast on teal button
              padding: '14px 40px',
              borderRadius: '50px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 4px 20px rgba(47, 154, 143, 0.3)',
              cursor: 'pointer',
            }}
          >
            Start Translating →
          </button>
        </div>
      </main>
    </>
  );
}
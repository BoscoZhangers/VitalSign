"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PixelBlast from '../../ui/components/PixelBlast';
import ShinyText from '../../ui/components/ShinyText';

export default function HomePage() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push('/');
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      background: 'var(--vs-bg)',
      overflow: 'hidden'
    }}>
      {/* PixelBlast Background */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw', 
        height: '100vh', 
        margin: 0,
        padding: 0,
        zIndex: 0
      }}>
        <PixelBlast
          style={{
            width: '100%',
            height: '100%'
          }}
          variant="circle"
          pixelSize={6}
          color="#DC143C"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.15}
          rippleIntensityScale={0.2}
          speed={0.6}
          edgeFade={0.25}
          transparent
        />
      </div>

      {/* Title - Vital Sign */}
      <h1 style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '120px',
        fontWeight: '600',
        textAlign: 'center',
        margin: 0,
        padding: 0,
        zIndex: 2,
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textShadow: `0 0 30px rgba(var(--vs-accent-rgb), 0.4), 0 0 60px rgba(var(--vs-accent-rgb), 0.2), 0 0 90px rgba(var(--vs-accent-rgb), 0.1)`,
        pointerEvents: 'none'
      }}>
        <ShinyText
          text="Vital Sign"
          speed={2}
          delay={0}
          color="var(--vs-text)"
          shineColor="#7DD3FC"
          spread={120}
          direction="left"
          yoyo={false}
          pauseOnHover={false}
        />
      </h1>

      {/* START button/heartbeat line */}
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          top: 'calc(50% + 100px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isHovered ? '180px' : 'auto',
          height: isHovered ? '60px' : 'auto',
          zIndex: 2,
          cursor: 'pointer',
          transition: 'width 0.3s ease, height 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!isHovered ? (
          <span style={{
            fontSize: '24px',
            fontWeight: '400',
            color: 'var(--vs-text)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            transition: 'opacity 0.3s ease'
          }}>
            START
          </span>
        ) : (
          <div style={{
            width: '180px',
            height: '60px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <svg
              width="360"
              height="60"
              viewBox="0 0 360 60"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                animation: 'ecgScroll 3s linear infinite'
              }}
            >
              <path
                d="M 0 30 L 60 30 L 65 8 L 70 30 L 75 30 L 120 30 L 125 8 L 130 30 L 135 30 L 180 30 L 185 8 L 190 30 L 195 30 L 240 30 L 245 8 L 250 30 L 255 30 L 300 30 L 305 8 L 310 30 L 360 30"
                stroke="#FF0000"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

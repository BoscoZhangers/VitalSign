"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  };

  useEffect(() => {
    const isLight = document.body.classList.contains('light-mode');
    setIsDark(!isLight);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tutorial', href: '/tutorial' },
    { name: 'Connect', href: '/connect' },
    { name: 'Learn More', href: '/learnmore' },
  ];

  return (
    <>
      <style jsx>{`
        .nav-link {
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          background-color: rgba(47, 154, 143, 0.2) !important;
          box-shadow: 0 0 15px rgba(47, 154, 143, 0.4);
          color: white !important;
          transform: translateY(-1px);
        }
        .theme-btn:hover {
          background-color: var(--vs-surface-2);
          transform: rotate(15deg);
        }
      `}</style>

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 32px',
        borderBottom: '1px solid var(--vs-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--vs-surface)',
        backdropFilter: 'blur(10px)',
        height: '70px',
        width: '100%',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'background 0.3s ease, border 0.3s ease'
      }}>
        
        {/* BRANDING SECTION (No weird shape, just flex row) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          // Optional: Pull slightly left if you want it closer to the edge
          // marginLeft: '-10px' 
        }}>
          {/* 1. Icon */}
          <img
            src="/VitalSignIcon.png"
            alt="Logo"
            style={{ 
              width: '45px', 
              height: '45px', 
              borderRadius: '8px',
            }}
          />

          {/* 2. Text Title */}
          <img 
            src="image.png" 
            alt="VitalSign Title"
            style={{ 
              marginTop: '2px',
              height: '28px',       // Scaled to fit nicely next to the icon
              objectFit: 'contain'
            }} 
          />
        </div>

        {/* RIGHT SIDE: Navigation + Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                  style={{
                    color: isActive ? 'var(--vs-accent)' : 'var(--vs-muted)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid var(--vs-accent)' : '1px solid transparent',
                    backgroundColor: isActive ? 'rgba(47, 154, 143, 0.1)' : 'transparent',
                    fontFamily: 'inherit' 
                  }}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div style={{ width: '1px', height: '24px', background: 'var(--vs-border)' }} />

          <button
            onClick={toggleTheme}
            className="theme-btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--vs-border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              color: 'var(--vs-text)'
            }}
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>
    </>
  );
}
import React from 'react';

export const Confetti: React.FC = () => {
  // Generate 50 particles with random properties
  const particles = Array.from({ length: 50 }).map((_, i) => {
    const angle = Math.random() * 360;
    // Random distance for explosion spread
    const distance = 100 + Math.random() * 150; 
    const color = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)];
    
    const style = {
      '--angle': `${angle}deg`,
      '--distance': `${distance}px`,
      '--color': color,
      '--delay': `${Math.random() * 0.1}s`, // slight stagger
      '--duration': `${0.6 + Math.random() * 0.4}s`,
      top: '50%',
      left: '50%',
    } as React.CSSProperties;

    return <div key={i} className="confetti-particle" style={style} />;
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles}
    </div>
  );
};
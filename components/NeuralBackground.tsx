
import React, { useEffect, useRef } from 'react';

// Retro Starfield Background
export const NeuralBackground: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;

    // Reuse star objects to reduce Garbage Collection (Memory Optimization)
    const numStars = 200;
    const stars: { x: number; y: number; z: number }[] = new Array(numStars).fill(0).map(() => ({x:0, y:0, z:0}));
    const speed = 2;

    const initStars = (w: number, h: number) => {
      for (let i = 0; i < numStars; i++) {
        stars[i].x = Math.random() * w - w / 2;
        stars[i].y = Math.random() * h - h / 2;
        stars[i].z = Math.random() * w;
      }
    };

    const handleResize = () => {
        // Handle High DPI Screens
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Scale context to match DPI
        ctx.scale(dpr, dpr);
        
        // Re-initialize stars for new dimensions
        initStars(width, height);
    };

    const animate = () => {
      ctx.fillStyle = '#050505'; // Retro Dark Background
      ctx.fillRect(0, 0, width, height);
      
      // Draw Grid Line (Horizon)
      ctx.strokeStyle = '#1a8000'; // Dim Green
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      const gridSpacing = 40;
      for (let i = 0; i < height; i += gridSpacing) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
      }
      for (let i = 0; i < width; i += gridSpacing) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
      }
      ctx.globalAlpha = 0.1;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = '#ffffff';
      
      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.z -= speed;

        if (star.z <= 0) {
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
          star.z = width;
        }

        const x = (star.x / star.z) * (width / 2) + (width / 2);
        const y = (star.y / star.z) * (height / 2) + (height / 2);
        
        // Pixel size based on depth
        const size = Math.max(0.5, (1 - star.z / width) * 3);

        if (x >= 0 && x < width && y >= 0 && y < height) {
           // Green/White stars
           ctx.fillStyle = (i % 5 === 0) ? '#33ff00' : '#ffffff'; // Simple deterministic color mix
           ctx.fillRect(x, y, size, size); // Square pixels for retro look
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none opacity-60"
      style={{ width: '100%', height: '100%' }}
    />
  );
});

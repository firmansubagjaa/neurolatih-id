import React, { useEffect, useRef } from 'react';

// Retro Starfield Background
export const NeuralBackground: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let animationFrameId: number;

    const stars: { x: number; y: number; z: number }[] = [];
    const numStars = 200;
    const speed = 2;

    const init = () => {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = '#050505'; // Retro Dark Background
      ctx.fillRect(0, 0, width, height);
      
      // Draw Grid Line (Horizon)
      ctx.strokeStyle = '#1a8000'; // Dim Green
      ctx.beginPath();
      for (let i = 0; i < height; i += 40) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
      }
      for (let i = 0; i < width; i += 40) {
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
           ctx.fillStyle = Math.random() > 0.8 ? '#33ff00' : '#ffffff';
           ctx.fillRect(x, y, size, size); // Square pixels
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', handleResize);
    init();
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
    />
  );
});
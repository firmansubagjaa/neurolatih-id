
import React, { useEffect, useRef } from 'react';

export const NeuralBackground: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let width = 0; let height = 0; let animationFrameId: number;
    const numStars = 150;
    const stars: { x: number; y: number; z: number }[] = new Array(numStars).fill(0).map(() => ({x:0, y:0, z:0}));
    const speed = 2;

    const initStars = (w: number, h: number) => {
      for (let i = 0; i < numStars; i++) { stars[i].x = Math.random() * w - w / 2; stars[i].y = Math.random() * h - h / 2; stars[i].z = Math.random() * w; }
    };
    const handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = width * dpr; canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        initStars(width, height);
    };

    const animate = () => {
      ctx.fillStyle = '#050510'; // Retro Dark Background
      ctx.fillRect(0, 0, width, height);
      
      // Grid Floor
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Only draw bottom half grid for "floor" effect
      const horizon = height / 2;
      for (let i = 0; i < width; i += 40) { ctx.moveTo(i, horizon); ctx.lineTo(i - (width/2 - i)*2, height); }
      for (let i = horizon; i < height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < numStars; i++) {
        const star = stars[i]; star.z -= speed;
        if (star.z <= 0) { star.x = Math.random() * width - width / 2; star.y = Math.random() * height - height / 2; star.z = width; }
        const x = (star.x / star.z) * (width / 2) + (width / 2);
        const y = (star.y / star.z) * (height / 2) + (height / 2);
        const size = Math.max(0.5, (1 - star.z / width) * 2);
        if (x >= 0 && x < width && y >= 0 && y < height) {
           ctx.fillStyle = (i % 3 === 0) ? '#00ff41' : '#ffffff';
           ctx.fillRect(x, y, size, size);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    animate();
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" style={{ width: '100%', height: '100%' }} />;
});

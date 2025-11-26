
import React from 'react';
import { NeuroStats } from '../services/statsService';

interface NeuralChartProps {
  stats: NeuroStats;
  size?: number; // Base size for coordinate calculation, actual display size handled by CSS
  className?: string;
}

export const NeuralChart: React.FC<NeuralChartProps> = ({ stats, size = 200, className = '' }) => {
  const center = size / 2;
  const radius = (size / 2) - 10; // Padding
  const attributes = ['memory', 'logic', 'speed', 'focus', 'verbal'];
  const totalSides = attributes.length;
  const angleStep = (Math.PI * 2) / totalSides;

  const polarToCartesian = (r: number, angle: number) => {
    // Start from top (subtract PI/2)
    const x = center + r * Math.cos(angle - Math.PI / 2);
    const y = center + r * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Generate Grid Points (Pentagons)
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map(level => {
    return Array.from({ length: totalSides }).map((_, i) => {
      const { x, y } = polarToCartesian(radius * level, i * angleStep);
      return `${x},${y}`;
    }).join(' ');
  });

  // Generate Data Points
  const dataPoints = attributes.map((attr, i) => {
    const value = (stats as any)[attr] || 0;
    // Minimum 5% to show a small dot at least
    const r = radius * (Math.max(5, value) / 100); 
    const { x, y } = polarToCartesian(r, i * angleStep);
    return `${x},${y}`;
  }).join(' ');

  // Generate Axis Lines
  const axisLines = Array.from({ length: totalSides }).map((_, i) => {
    const { x, y } = polarToCartesian(radius, i * angleStep);
    return { x1: center, y1: center, x2: x, y2: y };
  });

  // Labels
  const labels = [
    { name: 'MEM', ...polarToCartesian(radius + 20, 0 * angleStep) },
    { name: 'LOG', ...polarToCartesian(radius + 20, 1 * angleStep) },
    { name: 'SPD', ...polarToCartesian(radius + 20, 2 * angleStep) },
    { name: 'FOC', ...polarToCartesian(radius + 20, 3 * angleStep) },
    { name: 'VRB', ...polarToCartesian(radius + 20, 4 * angleStep) },
  ];

  return (
    <div className={`relative flex items-center justify-center animate-scale-in w-full h-full ${className}`}>
      <svg 
        viewBox={`0 0 ${size} ${size + 40}`} 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full overflow-visible"
      >
        <defs>
            <filter id="glow-chart">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        {/* Axis Lines */}
        {axisLines.map((line, i) => (
            <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#334155" strokeWidth="1" />
        ))}

        {/* Grid Polygons */}
        {gridPolygons.map((points, i) => (
            <polygon 
                key={i} 
                points={points} 
                fill="none" 
                stroke={i === 3 ? "#4ade80" : "#1e293b"} 
                strokeWidth={i === 3 ? 2 : 1}
                strokeDasharray={i === 3 ? "none" : "4 2"}
                className={i === 3 ? "opacity-50" : ""}
            />
        ))}

        {/* Data Polygon */}
        <polygon 
            points={dataPoints} 
            fill="rgba(34, 211, 238, 0.2)" 
            stroke="#22d3ee" 
            strokeWidth="2"
            filter="url(#glow-chart)"
            className="transition-all duration-1000 ease-out"
        />
        
        {/* Data Vertices */}
        {attributes.map((attr, i) => {
            const value = (stats as any)[attr] || 0;
            const r = radius * (Math.max(5, value) / 100);
            const { x, y } = polarToCartesian(r, i * angleStep);
            return <circle key={i} cx={x} cy={y} r="3" fill="#fff" className="animate-pulse" />;
        })}

        {/* Labels */}
        {labels.map((label, i) => (
            <text 
                key={i} 
                x={label.x} 
                y={label.y} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                fill={i === 0 ? "#f472b6" : i === 1 ? "#facc15" : i === 2 ? "#22d3ee" : i === 3 ? "#ef4444" : i === 4 ? "#4ade80" : "#fff"}
                className="font-pixel text-[10px] font-bold"
            >
                {label.name}
            </text>
        ))}
      </svg>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import '../styles/AnimationLibrary.css';

// Saved animation configs
const SAVED_ANIMATIONS = [
  {
    id: 'figure8-star3',
    name: 'Figure-8 Stars',
    description: 'Main page header animation',
    config: {
      shape: 'star3',
      arrangement: 'figure8',
      anchor: 'top-left',
      startingPoints: 6,
      totalShapes: 342,
      shapeSize: 50,
      arrangementRadius: 150,
      borderColor: 'rgba(60, 60, 60, 1)',
      fillColor: '#1c1c1c',
      rotateWithPosition: false,
      animatedRotation: true,
      rotationSpeed: 0.5,
      animationSpeed: 20,
    }
  },
  {
    id: 'circle-squares',
    name: 'Circle of Squares',
    description: 'Classic rotating squares',
    config: {
      shape: 'square',
      arrangement: 'circle',
      anchor: 'top-left',
      startingPoints: 6,
      totalShapes: 300,
      shapeSize: 40,
      arrangementRadius: 120,
      borderColor: '#ffffff',
      fillColor: 'transparent',
      rotateWithPosition: true,
      animatedRotation: false,
      rotationSpeed: 2,
      animationSpeed: 50,
    }
  },
  {
    id: 'spiral-diamonds',
    name: 'Spiral Diamonds',
    description: 'Diamonds in spiral arrangement',
    config: {
      shape: 'diamond',
      arrangement: 'spiral',
      anchor: 'center',
      startingPoints: 4,
      totalShapes: 200,
      shapeSize: 30,
      arrangementRadius: 100,
      borderColor: '#888888',
      fillColor: '#333333',
      rotateWithPosition: true,
      animatedRotation: true,
      rotationSpeed: 1,
      animationSpeed: 30,
    }
  },
  {
    id: 'ellipse-stars',
    name: 'Ellipse 5-Stars',
    description: 'Stars arranged in ellipse',
    config: {
      shape: 'star5',
      arrangement: 'ellipse',
      anchor: 'tangent',
      startingPoints: 8,
      totalShapes: 250,
      shapeSize: 35,
      arrangementRadius: 130,
      borderColor: '#666666',
      fillColor: '#222222',
      rotateWithPosition: true,
      animatedRotation: true,
      rotationSpeed: 0.8,
      animationSpeed: 25,
    }
  },
];

// Star path generator
const createStarPath = (size, points, innerRatio = 0.4) => {
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2;
  const innerR = outerR * innerRatio;
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * 180 / points - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
};

// Get shape SVG element
const getShapeElement = (shape, size, borderColor, fillColor) => {
  const half = size / 2;
  
  switch (shape) {
    case 'circle':
      return <ellipse cx={half} cy={half} rx={half} ry={half} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
    case 'square':
    case 'rectangle':
      return <rect x="0" y="0" width={size} height={size} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
    case 'diamond':
      return <polygon points={`${half},0 ${size},${half} ${half},${size} 0,${half}`} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
    case 'star3':
      return <polygon points={createStarPath(size, 3)} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
    case 'star4':
      return <polygon points={createStarPath(size, 4)} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
    case 'star5':
      return <polygon points={createStarPath(size, 5)} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
    default:
      return <rect x="0" y="0" width={size} height={size} stroke={borderColor} fill={fillColor} strokeWidth="1" />;
  }
};

// Calculate position based on arrangement
const getPosition = (index, total, radius, arrangement) => {
  const progress = index / total;
  const angle = progress * Math.PI * 2;
  
  switch (arrangement) {
    case 'figure8':
      return {
        x: Math.sin(angle) * radius,
        y: Math.sin(angle * 2) * radius * 0.5
      };
    case 'spiral':
      const spiralRadius = radius * (0.3 + progress * 0.7);
      return {
        x: Math.cos(angle * 3) * spiralRadius,
        y: Math.sin(angle * 3) * spiralRadius
      };
    case 'ellipse':
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.6
      };
    case 'square':
      const side = radius * 2;
      const perimeter = side * 4;
      const pos = progress * perimeter;
      if (pos < side) return { x: pos - radius, y: -radius };
      if (pos < side * 2) return { x: radius, y: pos - side - radius };
      if (pos < side * 3) return { x: radius - (pos - side * 2), y: radius };
      return { x: -radius, y: radius - (pos - side * 3) };
    case 'circle':
    default:
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
  }
};

function AnimationPreview({ config, size = 200 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animationRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 350; // Scale down to fit preview
    
    const drawFrame = () => {
      ctx.clearRect(0, 0, size, size);
      
      const visibleCount = Math.min(
        Math.floor((frameRef.current / 2) % config.totalShapes) + 1,
        config.totalShapes
      );
      
      for (let i = 0; i < visibleCount; i++) {
        const pos = getPosition(i, config.totalShapes, config.arrangementRadius * scale, config.arrangement);
        const x = centerX + pos.x;
        const y = centerY + pos.y;
        const shapeSize = config.shapeSize * scale;
        
        ctx.save();
        ctx.translate(x, y);
        
        if (config.rotateWithPosition) {
          const angle = (i / config.totalShapes) * Math.PI * 2;
          ctx.rotate(angle);
        }
        if (config.animatedRotation) {
          ctx.rotate((frameRef.current * config.rotationSpeed * 0.01));
        }
        
        ctx.strokeStyle = config.borderColor;
        ctx.fillStyle = config.fillColor || 'transparent';
        ctx.lineWidth = 1;
        
        // Draw shape
        ctx.beginPath();
        const half = shapeSize / 2;
        
        switch (config.shape) {
          case 'circle':
            ctx.arc(0, 0, half, 0, Math.PI * 2);
            break;
          case 'square':
          case 'rectangle':
            ctx.rect(-half, -half, shapeSize, shapeSize);
            break;
          case 'diamond':
            ctx.moveTo(0, -half);
            ctx.lineTo(half, 0);
            ctx.lineTo(0, half);
            ctx.lineTo(-half, 0);
            ctx.closePath();
            break;
          case 'star3':
          case 'star4':
          case 'star5':
            const points = config.shape === 'star3' ? 3 : config.shape === 'star4' ? 4 : 5;
            const outerR = half;
            const innerR = half * 0.4;
            for (let j = 0; j < points * 2; j++) {
              const angle = (j * Math.PI / points) - Math.PI / 2;
              const r = j % 2 === 0 ? outerR : innerR;
              if (j === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
              else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
            ctx.closePath();
            break;
          default:
            ctx.rect(-half, -half, shapeSize, shapeSize);
        }
        
        if (config.fillColor && config.fillColor !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
      }
      
      frameRef.current++;
      animationRef.current = requestAnimationFrame(drawFrame);
    };
    
    drawFrame();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, size]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      style={{ background: '#1c1c1c', borderRadius: '8px' }}
    />
  );
}

function AnimationCard({ animation, onCopy }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    const configStr = JSON.stringify(animation.config, null, 2);
    navigator.clipboard.writeText(configStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy(animation);
  };
  
  return (
    <div className="animation-card" onClick={handleCopy}>
      <div className="animation-preview">
        <AnimationPreview config={animation.config} size={200} />
      </div>
      <div className="animation-info">
        <h3>{animation.name}</h3>
        <p>{animation.description}</p>
        <span className="copy-hint">{copied ? '✓ Copied!' : 'Click to copy config'}</span>
      </div>
    </div>
  );
}

function AnimationLibrary() {
  const [copiedConfig, setCopiedConfig] = useState(null);
  
  return (
    <div className="animation-library">
      <h1>Animation Library</h1>
      <p className="library-subtitle">Click any animation to copy its config</p>
      
      <div className="animation-grid">
        {SAVED_ANIMATIONS.map(animation => (
          <AnimationCard 
            key={animation.id} 
            animation={animation}
            onCopy={setCopiedConfig}
          />
        ))}
      </div>
      
      {copiedConfig && (
        <div className="config-preview">
          <h3>Last Copied: {copiedConfig.name}</h3>
          <pre>{JSON.stringify(copiedConfig.config, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default AnimationLibrary;

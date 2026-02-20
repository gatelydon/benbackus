import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, RotateCcw, Maximize, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';
import '../styles/AnimationLab.css';

const SHAPES = [
  { id: 'circle', name: 'Circle', fixedAspect: true },
  { id: 'ellipse', name: 'Ellipse', fixedAspect: false },
  { id: 'square', name: 'Square', fixedAspect: true },
  { id: 'rectangle', name: 'Rectangle', fixedAspect: false },
  { id: 'parallelogram', name: 'Parallelogram', fixedAspect: false },
  { id: 'diamond', name: 'Diamond', fixedAspect: false },
  { id: 'pentagon', name: 'Pentagon', fixedAspect: false },
  { id: 'star3', name: '3-Star', fixedAspect: false },
  { id: 'star4', name: '4-Star', fixedAspect: false },
  { id: 'star5', name: '5-Star', fixedAspect: false },
];

const ARRANGEMENTS = [
  { id: 'circle', name: 'Circle' },
  { id: 'ellipse', name: 'Ellipse' },
  { id: 'square', name: 'Square' },
  { id: 'figure8', name: 'Figure-8' },
  { id: 'spiral', name: 'Spiral' },
  // Mathematical curves
  { id: 'lissajous', name: 'Lissajous (3:2)' },
  { id: 'lissajous34', name: 'Lissajous (3:4)' },
  { id: 'rose3', name: 'Rose (3 petals)' },
  { id: 'rose5', name: 'Rose (5 petals)' },
  { id: 'rose8', name: 'Rose (8 petals)' },
  { id: 'cardioid', name: 'Cardioid' },
  { id: 'astroid', name: 'Astroid' },
  { id: 'lemniscate', name: 'Lemniscate (∞)' },
  // Organic/natural
  { id: 'phyllotaxis', name: 'Phyllotaxis (Sunflower)' },
  { id: 'doublehelix', name: 'Double Helix' },
  { id: 'fermat', name: 'Fermat Spiral' },
  { id: 'wave', name: 'Wave' },
  // Geometric
  { id: 'grid', name: 'Grid' },
  { id: 'honeycomb', name: 'Honeycomb' },
  { id: 'concentric', name: 'Concentric Rings' },
  { id: 'starburst', name: 'Starburst' },
  { id: 'triangle', name: 'Triangle' },
  { id: 'pentagonpath', name: 'Pentagon Path' },
  { id: 'hexagon', name: 'Hexagon Path' },
  // Fun
  { id: 'heart', name: 'Heart' },
  { id: 'random', name: 'Random Scatter' },
  { id: 'butterfly', name: 'Butterfly Curve' },
];

const ANCHORS = [
  { id: 'top-left', name: 'Top-Left' },
  { id: 'top-right', name: 'Top-Right' },
  { id: 'center', name: 'Center' },
  { id: 'tangent', name: 'Follow Circle' },
];

const ANIMATION_STYLES = [
  // Rotation
  { id: 'spin', name: 'Continuous Spin', category: 'rotation' },
  { id: 'oscillate', name: 'Oscillate', category: 'rotation' },
  { id: 'pulse-spin', name: 'Pulse Spin', category: 'rotation' },
  // Movement
  { id: 'orbit', name: 'Circle Orbit', category: 'movement' },
  { id: 'triangle-path', name: 'Triangle Path', category: 'movement' },
  { id: 'square-path', name: 'Square Path', category: 'movement' },
  { id: 'figure8', name: 'Figure-8', category: 'movement' },
  { id: 'jitter', name: 'Jitter', category: 'movement' },
  // Scale
  { id: 'breathe', name: 'Breathe', category: 'scale' },
  { id: 'heartbeat', name: 'Heartbeat', category: 'scale' },
  { id: 'pop', name: 'Pop', category: 'scale' },
  // Morph
  { id: 'shape-cycle', name: 'Shape Cycle', category: 'morph' },
  { id: 'star-evolve', name: 'Star Evolution', category: 'morph' },
  // Combined
  { id: 'orbit-spin', name: 'Orbit + Spin', category: 'combined' },
  { id: 'breathe-oscillate', name: 'Breathe + Rock', category: 'combined' },
  // Phase
  { id: 'wave', name: 'Wave', category: 'phase' },
  { id: 'none', name: 'Static', category: 'none' },
];

const DEFAULT_CONFIG = {
  shape: 'star3',
  arrangement: 'rose8',
  animationStyle: 'spin',
  anchor: 'top-left',
  startingPoints: 6,
  totalShapes: 342,
  shapeSize: 50,
  arrangementRadius: 150,
  randomDimensions: false,
  dimensionVariance: 0.5,
  borderColor: '#ffffff',
  fillColor: 'transparent',
  useGradient: false,
  gradientStart: '#ffffff',
  gradientEnd: '#888888',
  rotateWithPosition: true,
  animatedRotation: true,
  rotationSpeed: 2,
  animationSpeed: 50,
  keepAllVisible: true,
};

// SVG path generators - now anchored to top-left (0,0)
const getShapePath = (shape, w, h) => {
  switch (shape) {
    case 'circle':
      return { type: 'ellipse', cx: w/2, cy: h/2, rx: w/2, ry: h/2 };
    case 'ellipse':
      return { type: 'ellipse', cx: w/2, cy: h/2, rx: w/2, ry: h/2 };
    case 'square':
    case 'rectangle':
      return { type: 'rect', x: 0, y: 0, width: w, height: h };
    case 'parallelogram': {
      const skew = w * 0.25;
      return { type: 'polygon', points: `${skew},0 ${w},0 ${w-skew},${h} 0,${h}` };
    }
    case 'diamond':
      return { type: 'polygon', points: `${w/2},0 ${w},${h/2} ${w/2},${h} 0,${h/2}` };
    case 'pentagon': {
      const cx = w/2, cy = h/2, r = Math.min(w, h)/2;
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return { type: 'polygon', points: pts.join(' ') };
    }
    case 'star3':
      return createStar(w, h, 3, 0.4);
    case 'star4':
      return createStar(w, h, 4, 0.4);
    case 'star5':
      return createStar(w, h, 5, 0.4);
    default:
      return { type: 'rect', x: 0, y: 0, width: w, height: h };
  }
};

const createStar = (w, h, points, innerRatio) => {
  const cx = w/2, cy = h/2;
  const outerR = Math.min(w, h)/2;
  const innerR = outerR * innerRatio;
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * 180 / points - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return { type: 'polygon', points: pts.join(' ') };
};

// Mini shape preview for buttons
const ShapePreview = ({ shapeId, size = 20, stroke = '#888', fill = 'none' }) => {
  const path = getShapePath(shapeId, size, size);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {path.type === 'ellipse' && (
        <ellipse cx={path.cx} cy={path.cy} rx={path.rx * 0.85} ry={path.ry * 0.85} 
          stroke={stroke} fill={fill} strokeWidth="1.5" />
      )}
      {path.type === 'rect' && (
        <rect x={size*0.1} y={size*0.1} width={size*0.8} height={size*0.8} 
          stroke={stroke} fill={fill} strokeWidth="1.5" />
      )}
      {path.type === 'polygon' && (
        <polygon points={path.points} stroke={stroke} fill={fill} strokeWidth="1.5" 
          transform={`scale(0.85) translate(${size*0.09}, ${size*0.09})`} />
      )}
    </svg>
  );
};

// Mini arrangement preview for buttons
const ArrangementPreview = ({ arrangementId, size = 20, stroke = '#888' }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  
  const getPath = () => {
    const points = [];
    const steps = 32;
    
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      let x, y;
      
      switch (arrangementId) {
        case 'circle':
          x = cx + Math.cos(t) * r;
          y = cy + Math.sin(t) * r;
          break;
        case 'ellipse':
          x = cx + Math.cos(t) * r * 1.3;
          y = cy + Math.sin(t) * r * 0.6;
          break;
        case 'square': {
          const progress = i / steps;
          const side = Math.floor(progress * 4) % 4;
          const sp = (progress * 4) % 1;
          const h = r;
          if (side === 0) { x = cx - h + sp * 2 * h; y = cy - h; }
          else if (side === 1) { x = cx + h; y = cy - h + sp * 2 * h; }
          else if (side === 2) { x = cx + h - sp * 2 * h; y = cy + h; }
          else { x = cx - h; y = cy + h - sp * 2 * h; }
          break;
        }
        case 'figure8':
          x = cx + Math.sin(t) * r;
          y = cy + Math.sin(t * 2) * r * 0.5;
          break;
        case 'spiral': {
          const sr = r * 0.3 + r * 0.7 * (i / steps);
          x = cx + Math.cos(t * 3) * sr;
          y = cy + Math.sin(t * 3) * sr;
          break;
        }
        case 'lissajous':
          x = cx + Math.sin(3 * t) * r;
          y = cy + Math.sin(2 * t) * r;
          break;
        case 'lissajous34':
          x = cx + Math.sin(3 * t) * r;
          y = cy + Math.sin(4 * t) * r;
          break;
        case 'rose3': {
          const rr = r * Math.cos(3 * t);
          x = cx + rr * Math.cos(t);
          y = cy + rr * Math.sin(t);
          break;
        }
        case 'rose5': {
          const rr = r * Math.cos(5 * t);
          x = cx + rr * Math.cos(t);
          y = cy + rr * Math.sin(t);
          break;
        }
        case 'rose8': {
          const rr = r * Math.cos(4 * t);
          x = cx + rr * Math.cos(t);
          y = cy + rr * Math.sin(t);
          break;
        }
        case 'cardioid': {
          const rr = r * 0.45 * (1 - Math.cos(t));
          x = cx + rr * Math.cos(t);
          y = cy + rr * Math.sin(t);
          break;
        }
        case 'astroid':
          x = cx + r * Math.pow(Math.cos(t), 3);
          y = cy + r * Math.pow(Math.sin(t), 3);
          break;
        case 'lemniscate': {
          const cos2 = Math.cos(2 * t);
          const rr = r * 0.9 * Math.sqrt(Math.abs(cos2));
          x = cx + rr * Math.cos(t) * Math.sign(cos2);
          y = cy + rr * Math.sin(t);
          break;
        }
        case 'heart': {
          const scale = r / 16;
          x = cx + scale * 16 * Math.pow(Math.sin(t), 3);
          y = cy - scale * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
          break;
        }
        case 'butterfly': {
          const exp = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
          const scale = r / 4;
          x = cx + Math.sin(t) * exp * scale;
          y = cy - Math.cos(t) * exp * scale;
          break;
        }
        case 'wave':
          x = cx + ((i / steps) - 0.5) * r * 2.5;
          y = cy + Math.sin((i / steps) * Math.PI * 4) * r * 0.5;
          break;
        case 'triangle': {
          const progress = i / steps;
          const side = Math.floor(progress * 3) % 3;
          const sp = (progress * 3) % 1;
          const verts = [
            [cx, cy - r], [cx + r * 0.866, cy + r * 0.5], [cx - r * 0.866, cy + r * 0.5]
          ];
          const start = verts[side];
          const end = verts[(side + 1) % 3];
          x = start[0] + (end[0] - start[0]) * sp;
          y = start[1] + (end[1] - start[1]) * sp;
          break;
        }
        case 'pentagonpath':
        case 'hexagon': {
          const sides = arrangementId === 'pentagonpath' ? 5 : 6;
          const progress = i / steps;
          const side = Math.floor(progress * sides) % sides;
          const sp = (progress * sides) % 1;
          const a1 = (side / sides) * Math.PI * 2 - Math.PI / 2;
          const a2 = ((side + 1) / sides) * Math.PI * 2 - Math.PI / 2;
          x = cx + Math.cos(a1) * r + (Math.cos(a2) - Math.cos(a1)) * r * sp;
          y = cy + Math.sin(a1) * r + (Math.sin(a2) - Math.sin(a1)) * r * sp;
          break;
        }
        default:
          // For grid, honeycomb, phyllotaxis, etc - just show dots
          x = cx + Math.cos(t) * r * 0.8;
          y = cy + Math.sin(t) * r * 0.8;
      }
      
      if (!isNaN(x) && !isNaN(y)) {
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
    }
    
    return points.join(' ');
  };

  // Special patterns that need custom rendering
  if (arrangementId === 'grid') {
    const dots = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        dots.push({ x: cx - r + col * r, y: cy - r + row * r });
      }
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.2} fill={stroke} />)}
      </svg>
    );
  }
  
  if (arrangementId === 'honeycomb') {
    const dots = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const offset = row % 2 === 0 ? 0 : r * 0.5;
        dots.push({ x: cx - r + col * r + offset, y: cy - r * 0.8 + row * r * 0.7 });
      }
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.2} fill={stroke} />)}
      </svg>
    );
  }
  
  if (arrangementId === 'phyllotaxis') {
    const dots = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 12; i++) {
      const pr = r * 0.9 * Math.sqrt(i / 12);
      const theta = i * goldenAngle;
      dots.push({ x: cx + pr * Math.cos(theta), y: cy + pr * Math.sin(theta) });
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1} fill={stroke} />)}
      </svg>
    );
  }
  
  if (arrangementId === 'doublehelix') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={`M${cx-r*0.4} ${cy-r} Q${cx+r*0.6} ${cy-r*0.3} ${cx-r*0.4} ${cy+r*0.3} Q${cx+r*0.6} ${cy+r} ${cx-r*0.4} ${cy+r}`} 
          stroke={stroke} fill="none" strokeWidth="1" />
        <path d={`M${cx+r*0.4} ${cy-r} Q${cx-r*0.6} ${cy-r*0.3} ${cx+r*0.4} ${cy+r*0.3} Q${cx-r*0.6} ${cy+r} ${cx+r*0.4} ${cy+r}`} 
          stroke={stroke} fill="none" strokeWidth="1" />
      </svg>
    );
  }
  
  if (arrangementId === 'fermat') {
    const dots = [];
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI * 0.5;
      const pr = r * Math.sqrt(i / 16);
      dots.push({ x: cx + pr * Math.cos(angle), y: cy + pr * Math.sin(angle) });
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={0.8} fill={stroke} />)}
      </svg>
    );
  }
  
  if (arrangementId === 'concentric') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r * 0.3} stroke={stroke} fill="none" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r * 0.6} stroke={stroke} fill="none" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r * 0.9} stroke={stroke} fill="none" strokeWidth="1" />
      </svg>
    );
  }
  
  if (arrangementId === 'starburst') {
    const lines = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      lines.push({ x1: cx, y1: cy, x2: cx + Math.cos(angle) * r, y2: cy + Math.sin(angle) * r });
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={stroke} strokeWidth="1" />)}
      </svg>
    );
  }
  
  if (arrangementId === 'random') {
    // Seeded random for consistency
    const dots = [
      { x: cx - r * 0.6, y: cy - r * 0.3 },
      { x: cx + r * 0.4, y: cy - r * 0.7 },
      { x: cx + r * 0.7, y: cy + r * 0.2 },
      { x: cx - r * 0.2, y: cy + r * 0.6 },
      { x: cx + r * 0.1, y: cy - r * 0.1 },
      { x: cx - r * 0.5, y: cy + r * 0.1 },
      { x: cx + r * 0.5, y: cy + r * 0.7 },
    ];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1} fill={stroke} />)}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polyline 
        points={getPath()} 
        stroke={stroke} 
        fill="none" 
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Animation style preview icons
const AnimationStylePreview = ({ styleId, size = 28, stroke = '#888' }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  
  switch (styleId) {
    case 'spin':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} stroke={stroke} fill="none" strokeWidth="1" strokeDasharray="4 2" />
          <path d={`M${cx + r - 2} ${cy - 3} L${cx + r + 2} ${cy} L${cx + r - 2} ${cy + 3}`} fill={stroke} />
        </svg>
      );
    case 'oscillate':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={`M${cx - r} ${cy} Q${cx} ${cy - r * 0.8} ${cx + r} ${cy}`} stroke={stroke} fill="none" strokeWidth="1.5" />
          <path d={`M${cx - r + 2} ${cy - 3} L${cx - r - 1} ${cy} L${cx - r + 2} ${cy + 3}`} fill={stroke} />
          <path d={`M${cx + r - 2} ${cy - 3} L${cx + r + 1} ${cy} L${cx + r - 2} ${cy + 3}`} fill={stroke} />
        </svg>
      );
    case 'pulse-spin':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r * 0.5} stroke={stroke} fill="none" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r} stroke={stroke} fill="none" strokeWidth="1" strokeDasharray="2 3" />
        </svg>
      );
    case 'orbit':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} stroke={stroke} fill="none" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx={cx + r} cy={cy} r={3} fill={stroke} />
        </svg>
      );
    case 'triangle-path':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={`${cx},${cy - r} ${cx + r * 0.866},${cy + r * 0.5} ${cx - r * 0.866},${cy + r * 0.5}`} 
            stroke={stroke} fill="none" strokeWidth="1" />
          <circle cx={cx} cy={cy - r} r={2.5} fill={stroke} />
        </svg>
      );
    case 'square-path':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} stroke={stroke} fill="none" strokeWidth="1" />
          <circle cx={cx - r} cy={cy - r} r={2.5} fill={stroke} />
        </svg>
      );
    case 'figure8':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={`M${cx} ${cy} C${cx - r} ${cy - r * 0.8} ${cx - r} ${cy + r * 0.8} ${cx} ${cy} C${cx + r} ${cy - r * 0.8} ${cx + r} ${cy + r * 0.8} ${cx} ${cy}`} 
            stroke={stroke} fill="none" strokeWidth="1" />
        </svg>
      );
    case 'jitter':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx - 2} cy={cy - 1} r={2} fill={stroke} opacity="0.4" />
          <circle cx={cx + 1} cy={cy + 2} r={2} fill={stroke} opacity="0.4" />
          <circle cx={cx} cy={cy} r={3} fill={stroke} />
          <circle cx={cx + 3} cy={cy - 2} r={2} fill={stroke} opacity="0.4" />
        </svg>
      );
    case 'breathe':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r * 0.4} stroke={stroke} fill="none" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r * 0.7} stroke={stroke} fill="none" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx={cx} cy={cy} r={r} stroke={stroke} fill="none" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    case 'heartbeat':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={`M${cx - r} ${cy} L${cx - r * 0.5} ${cy} L${cx - r * 0.3} ${cy - r * 0.6} L${cx} ${cy + r * 0.4} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r * 0.5} ${cy} L${cx + r} ${cy}`} 
            stroke={stroke} fill="none" strokeWidth="1.5" />
        </svg>
      );
    case 'pop':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r * 0.5} fill={stroke} />
          <line x1={cx - r} y1={cy - r} x2={cx - r * 0.6} y2={cy - r * 0.6} stroke={stroke} strokeWidth="1.5" />
          <line x1={cx + r} y1={cy - r} x2={cx + r * 0.6} y2={cy - r * 0.6} stroke={stroke} strokeWidth="1.5" />
          <line x1={cx - r} y1={cy + r} x2={cx - r * 0.6} y2={cy + r * 0.6} stroke={stroke} strokeWidth="1.5" />
          <line x1={cx + r} y1={cy + r} x2={cx + r * 0.6} y2={cy + r * 0.6} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'shape-cycle':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={`${cx - r * 0.8},${cy + r * 0.3} ${cx - r * 0.3},${cy - r * 0.6} ${cx + r * 0.4},${cy + r * 0.3}`} 
            stroke={stroke} fill="none" strokeWidth="1" />
          <rect x={cx - r * 0.15} y={cy - r * 0.15} width={r * 0.8} height={r * 0.8} 
            stroke={stroke} fill="none" strokeWidth="1" transform={`rotate(15 ${cx} ${cy})`} />
        </svg>
      );
    case 'star-evolve':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={`${cx},${cy - r * 0.9} ${cx + r * 0.3},${cy - r * 0.1} ${cx + r * 0.9},${cy + r * 0.3} ${cx + r * 0.2},${cy + r * 0.6} ${cx - r * 0.2},${cy + r * 0.6} ${cx - r * 0.9},${cy + r * 0.3} ${cx - r * 0.3},${cy - r * 0.1}`} 
            stroke={stroke} fill="none" strokeWidth="1" />
        </svg>
      );
    case 'orbit-spin':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} stroke={stroke} fill="none" strokeWidth="1" strokeDasharray="3 2" />
          <g transform={`translate(${cx + r}, ${cy})`}>
            <rect x={-3} y={-3} width={6} height={6} stroke={stroke} fill="none" strokeWidth="1" transform="rotate(30)" />
          </g>
        </svg>
      );
    case 'breathe-oscillate':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.5} stroke={stroke} fill="none" strokeWidth="1" />
          <ellipse cx={cx} cy={cy} rx={r * 0.6} ry={r * 0.3} stroke={stroke} fill="none" strokeWidth="1" />
        </svg>
      );
    case 'wave':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={`M${cx - r} ${cy + r * 0.3} Q${cx - r * 0.5} ${cy - r * 0.5} ${cx} ${cy} Q${cx + r * 0.5} ${cy + r * 0.5} ${cx + r} ${cy - r * 0.3}`} 
            stroke={stroke} fill="none" strokeWidth="1.5" />
          <circle cx={cx - r * 0.7} cy={cy + r * 0.15} r={2} fill={stroke} />
          <circle cx={cx} cy={cy} r={2.5} fill={stroke} />
          <circle cx={cx + r * 0.7} cy={cy - r * 0.15} r={2} fill={stroke} />
        </svg>
      );
    case 'none':
    default:
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={cx - r * 0.4} y={cy - r * 0.4} width={r * 0.8} height={r * 0.8} stroke={stroke} fill="none" strokeWidth="1.5" />
        </svg>
      );
  }
};

// Wheel picker component (iOS-style scroll selector)
const WheelPicker = ({ items, value, onChange, renderItem, itemHeight = 40 }) => {
  const containerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef(null);
  
  const selectedIndex = items.findIndex(item => item.id === value);
  const visibleItems = 5; // Show 5 items at a time
  const containerHeight = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);
  
  // Scroll to selected item on mount and when value changes externally
  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      const scrollTop = selectedIndex * itemHeight;
      containerRef.current.scrollTop = scrollTop;
    }
  }, [value, selectedIndex, itemHeight, isScrolling]);
  
  const handleScroll = (e) => {
    setIsScrolling(true);
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      const scrollTop = e.target.scrollTop;
      const newIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      
      if (items[clampedIndex] && items[clampedIndex].id !== value) {
        onChange(items[clampedIndex].id);
      }
      
      // Snap to position
      e.target.scrollTop = clampedIndex * itemHeight;
      setIsScrolling(false);
    }, 100);
  };
  
  return (
    <div className="wheel-picker" style={{ height: containerHeight }}>
      <div className="wheel-picker-highlight" style={{ 
        top: paddingItems * itemHeight,
        height: itemHeight 
      }} />
      <div 
        className="wheel-picker-scroll"
        ref={containerRef}
        onScroll={handleScroll}
        style={{ 
          paddingTop: paddingItems * itemHeight,
          paddingBottom: paddingItems * itemHeight
        }}
      >
        {items.map((item, index) => {
          const isSelected = item.id === value;
          const distance = Math.abs(index - selectedIndex);
          const opacity = isSelected ? 1 : Math.max(0.3, 1 - distance * 0.25);
          const scale = isSelected ? 1 : Math.max(0.7, 1 - distance * 0.1);
          
          return (
            <div 
              key={item.id}
              className={`wheel-picker-item ${isSelected ? 'selected' : ''}`}
              style={{ 
                height: itemHeight,
                opacity,
                transform: `scale(${scale})`
              }}
              onClick={() => {
                onChange(item.id);
                if (containerRef.current) {
                  containerRef.current.scrollTop = index * itemHeight;
                }
              }}
            >
              {renderItem(item, isSelected)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STORAGE_KEY = 'animationLabConfig';

// Load config from localStorage or use default
const loadConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e);
  }
  return DEFAULT_CONFIG;
};

const AnimationLab = () => {
  const [config, setConfig] = useState(loadConfig);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHeight, setSidebarHeight] = useState(45); // percentage on mobile
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastPinchDist, setLastPinchDist] = useState(null);
  const canvasRef = useRef(null);
  const shapesRef = useRef([]);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save config to localStorage:', e);
    }
  }, [config]);

  // Full animation: draw all shapes, then hide all shapes (double the frames)
  const maxFrames = config.totalShapes * 2;

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate position based on arrangement
  const getPosition = useCallback((index, total, arrangement, radius, centerX, centerY) => {
    const progress = index / total;
    const angle = progress * Math.PI * 2;
    
    switch (arrangement) {
      case 'circle':
        return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
      case 'ellipse':
        return { x: centerX + Math.cos(angle) * radius * 1.5, y: centerY + Math.sin(angle) * radius * 0.7 };
      case 'square': {
        const side = Math.floor(progress * 4);
        const sideProgress = (progress * 4) % 1;
        const halfSize = radius;
        switch (side) {
          case 0: return { x: centerX - halfSize + sideProgress * 2 * halfSize, y: centerY - halfSize };
          case 1: return { x: centerX + halfSize, y: centerY - halfSize + sideProgress * 2 * halfSize };
          case 2: return { x: centerX + halfSize - sideProgress * 2 * halfSize, y: centerY + halfSize };
          default: return { x: centerX - halfSize, y: centerY + halfSize - sideProgress * 2 * halfSize };
        }
      }
      case 'figure8':
        return { x: centerX + Math.sin(angle) * radius, y: centerY + Math.sin(angle * 2) * radius * 0.5 };
      case 'spiral': {
        const spiralRadius = radius * 0.3 + (radius * 0.7 * progress);
        return { x: centerX + Math.cos(angle * 3) * spiralRadius, y: centerY + Math.sin(angle * 3) * spiralRadius };
      }
      
      // Mathematical curves
      case 'lissajous':
        return { x: centerX + Math.sin(3 * angle) * radius, y: centerY + Math.sin(2 * angle) * radius };
      case 'lissajous34':
        return { x: centerX + Math.sin(3 * angle) * radius, y: centerY + Math.sin(4 * angle) * radius };
      case 'rose3': {
        const r = radius * Math.cos(3 * angle);
        return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
      }
      case 'rose5': {
        const r = radius * Math.cos(5 * angle);
        return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
      }
      case 'rose8': {
        const r = radius * Math.cos(4 * angle);
        return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
      }
      case 'cardioid': {
        const r = radius * 0.5 * (1 - Math.cos(angle));
        return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
      }
      case 'astroid':
        return { 
          x: centerX + radius * Math.pow(Math.cos(angle), 3), 
          y: centerY + radius * Math.pow(Math.sin(angle), 3) 
        };
      case 'lemniscate': {
        const scale = radius * 1.2;
        const cos2 = Math.cos(2 * angle);
        if (cos2 < 0) {
          const r = scale * Math.sqrt(Math.abs(cos2));
          return { x: centerX + r * Math.cos(angle), y: centerY - r * Math.sin(angle) };
        }
        const r = scale * Math.sqrt(cos2);
        return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
      }
      
      // Organic/natural
      case 'phyllotaxis': {
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const r = radius * Math.sqrt(index) / Math.sqrt(total) * 1.2;
        const theta = index * goldenAngle;
        return { x: centerX + r * Math.cos(theta), y: centerY + r * Math.sin(theta) };
      }
      case 'doublehelix': {
        const helixAngle = progress * Math.PI * 6;
        const yOffset = (progress - 0.5) * radius * 2;
        const strand = index % 2;
        const phaseShift = strand * Math.PI;
        return { 
          x: centerX + Math.cos(helixAngle + phaseShift) * radius * 0.5, 
          y: centerY + yOffset 
        };
      }
      case 'fermat': {
        const fermatAngle = progress * Math.PI * 8;
        const r = radius * Math.sqrt(progress);
        return { x: centerX + r * Math.cos(fermatAngle), y: centerY + r * Math.sin(fermatAngle) };
      }
      case 'wave': {
        const waveX = (progress - 0.5) * radius * 3;
        const waveY = Math.sin(progress * Math.PI * 4) * radius * 0.5;
        return { x: centerX + waveX, y: centerY + waveY };
      }
      
      // Geometric
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(total));
        const rows = Math.ceil(total / cols);
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellWidth = (radius * 2) / (cols - 1 || 1);
        const cellHeight = (radius * 2) / (rows - 1 || 1);
        return { 
          x: centerX - radius + col * cellWidth, 
          y: centerY - radius + row * cellHeight 
        };
      }
      case 'honeycomb': {
        const cols = Math.ceil(Math.sqrt(total * 1.5));
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellWidth = (radius * 2) / cols;
        const cellHeight = cellWidth * 0.866;
        const xOffset = (row % 2) * (cellWidth / 2);
        return { 
          x: centerX - radius + col * cellWidth + xOffset, 
          y: centerY - radius + row * cellHeight 
        };
      }
      case 'concentric': {
        const rings = 5;
        const ring = Math.floor(progress * rings);
        const ringProgress = (progress * rings) % 1;
        const ringRadius = radius * (ring + 1) / rings;
        const ringAngle = ringProgress * Math.PI * 2;
        return { x: centerX + Math.cos(ringAngle) * ringRadius, y: centerY + Math.sin(ringAngle) * ringRadius };
      }
      case 'starburst': {
        const rays = 12;
        const ray = index % rays;
        const rayProgress = Math.floor(index / rays) / Math.ceil(total / rays);
        const rayAngle = (ray / rays) * Math.PI * 2;
        const r = radius * rayProgress;
        return { x: centerX + Math.cos(rayAngle) * r, y: centerY + Math.sin(rayAngle) * r };
      }
      case 'triangle': {
        const side = Math.floor(progress * 3);
        const sideProgress = (progress * 3) % 1;
        const r = radius;
        const vertices = [
          { x: centerX, y: centerY - r },
          { x: centerX + r * 0.866, y: centerY + r * 0.5 },
          { x: centerX - r * 0.866, y: centerY + r * 0.5 },
        ];
        const start = vertices[side];
        const end = vertices[(side + 1) % 3];
        return { 
          x: start.x + (end.x - start.x) * sideProgress, 
          y: start.y + (end.y - start.y) * sideProgress 
        };
      }
      case 'pentagonpath': {
        const sides = 5;
        const side = Math.floor(progress * sides);
        const sideProgress = (progress * sides) % 1;
        const vertices = [];
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
          vertices.push({ x: centerX + Math.cos(a) * radius, y: centerY + Math.sin(a) * radius });
        }
        const start = vertices[side];
        const end = vertices[(side + 1) % sides];
        return { 
          x: start.x + (end.x - start.x) * sideProgress, 
          y: start.y + (end.y - start.y) * sideProgress 
        };
      }
      case 'hexagon': {
        const sides = 6;
        const side = Math.floor(progress * sides);
        const sideProgress = (progress * sides) % 1;
        const vertices = [];
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
          vertices.push({ x: centerX + Math.cos(a) * radius, y: centerY + Math.sin(a) * radius });
        }
        const start = vertices[side];
        const end = vertices[(side + 1) % sides];
        return { 
          x: start.x + (end.x - start.x) * sideProgress, 
          y: start.y + (end.y - start.y) * sideProgress 
        };
      }
      
      // Fun
      case 'heart': {
        const t = angle;
        const scale = radius / 16;
        return { 
          x: centerX + scale * 16 * Math.pow(Math.sin(t), 3), 
          y: centerY - scale * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t))
        };
      }
      case 'random': {
        const seed = index * 9301 + 49297;
        const rand1 = ((seed % 233280) / 233280);
        const rand2 = (((seed * 7) % 233280) / 233280);
        return { 
          x: centerX + (rand1 - 0.5) * radius * 2, 
          y: centerY + (rand2 - 0.5) * radius * 2 
        };
      }
      case 'butterfly': {
        const t = angle * 2;
        const exp = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
        const scale = radius / 4;
        return { 
          x: centerX + Math.sin(t) * exp * scale, 
          y: centerY - Math.cos(t) * exp * scale 
        };
      }
      
      default:
        return { x: centerX, y: centerY };
    }
  }, []);

  // Pre-generate all shape data when config changes (memoized)
  const shapeData = useMemo(() => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const shapeInfo = SHAPES.find(s => s.id === config.shape);
    const canRandomize = shapeInfo && !shapeInfo.fixedAspect && config.randomDimensions;

    const data = [];
    for (let i = 0; i < config.totalShapes; i++) {
      const progress = i / config.totalShapes;
      const angle = progress * Math.PI * 2; // radians
      
      const pos = getPosition(
        i, config.totalShapes, config.arrangement, 
        config.arrangementRadius, centerX, centerY
      );

      // Calculate dimensions - random variance anchored to base size
      let width = config.shapeSize;
      let height = config.shapeSize;
      
      if (canRandomize) {
        width = config.shapeSize * (1 + Math.random() * config.dimensionVariance);
        height = config.shapeSize * (1 + Math.random() * config.dimensionVariance);
      }

      // Calculate rotation based on anchor type
      let rotation = 0;
      if (config.anchor === 'tangent') {
        // Follow the circle - rotate to be tangent to the path
        rotation = (angle * 180 / Math.PI) + 90; // perpendicular to radius
      } else if (config.rotateWithPosition) {
        rotation = (i / config.totalShapes) * 360;
      }

      // Calculate position offset based on anchor
      let offsetX = 0;
      let offsetY = 0;
      switch (config.anchor) {
        case 'top-left':
          // Position is where top-left corner goes (no offset needed)
          offsetX = 0;
          offsetY = 0;
          break;
        case 'top-right':
          // Position is where top-right corner goes
          offsetX = -width;
          offsetY = 0;
          break;
        case 'center':
          // Position is center of shape
          offsetX = -width / 2;
          offsetY = -height / 2;
          break;
        case 'tangent':
          // Center on the path, rotated to follow it
          offsetX = -width / 2;
          offsetY = -height / 2;
          break;
        default:
          break;
      }

      data.push({
        index: i,
        pos: { x: pos.x + offsetX, y: pos.y + offsetY },
        width,
        height,
        rotation,
        anchor: config.anchor,
      });
    }

    return data;
  }, [config, canvasSize, getPosition]);

  // Calculate draw order based on starting points
  const drawOrder = useMemo(() => {
    const order = [];
    for (let i = 0; i < config.totalShapes; i++) {
      const armIndex = i % config.startingPoints;
      const shapeInArm = Math.floor(i / config.startingPoints);
      const actualIndex = Math.floor(armIndex * (config.totalShapes / config.startingPoints) + shapeInArm);
      if (actualIndex < config.totalShapes) {
        order.push(actualIndex);
      }
    }
    return order;
  }, [config.totalShapes, config.startingPoints]);

  // Render all shapes once when config/canvas changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear existing
    shapesRef.current.forEach(el => el.remove());
    shapesRef.current = [];

    // Create all shapes (hidden initially)
    shapeData.forEach((data, i) => {
      const { pos, width, height, rotation, anchor } = data;
      const path = getShapePath(config.shape, width, height);

      // Determine transform-origin based on anchor
      let transformOrigin = 'top left';
      if (anchor === 'top-right') {
        transformOrigin = 'top right';
      } else if (anchor === 'center' || anchor === 'tangent') {
        transformOrigin = 'center';
      }

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        transform: rotate(${rotation}deg);
        transform-origin: ${transformOrigin};
        pointer-events: none;
        overflow: visible;
        opacity: 0;
      `;
      svg.dataset.shapeIndex = i;
      svg.dataset.baseRotation = rotation;

      // Add gradient if needed
      if (config.useGradient) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', `grad-${i}`);
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', config.gradientStart);
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', config.gradientEnd);
        
        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defs.appendChild(grad);
        svg.appendChild(defs);
      }

      let shapeEl;
      const fill = config.useGradient ? `url(#grad-${i})` : config.fillColor;
      
      if (path.type === 'ellipse') {
        shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        shapeEl.setAttribute('cx', path.cx);
        shapeEl.setAttribute('cy', path.cy);
        shapeEl.setAttribute('rx', Math.max(0, path.rx - 0.5));
        shapeEl.setAttribute('ry', Math.max(0, path.ry - 0.5));
      } else if (path.type === 'rect') {
        shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shapeEl.setAttribute('x', 0.5);
        shapeEl.setAttribute('y', 0.5);
        shapeEl.setAttribute('width', Math.max(0, path.width - 1));
        shapeEl.setAttribute('height', Math.max(0, path.height - 1));
      } else if (path.type === 'polygon') {
        shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shapeEl.setAttribute('points', path.points);
      }

      shapeEl.setAttribute('stroke', config.borderColor);
      shapeEl.setAttribute('fill', fill);
      shapeEl.setAttribute('stroke-width', '1');
      
      svg.appendChild(shapeEl);
      canvas.appendChild(svg);
      shapesRef.current.push(svg);
    });
  }, [shapeData, config.shape, config.borderColor, config.fillColor, config.useGradient, config.gradientStart, config.gradientEnd]);

  // Calculate animation transform based on style
  const getAnimationTransform = useCallback((styleId, frame, idx, totalShapes, baseRotation, speed) => {
    const t = frame * speed * 0.05; // time factor
    const phase = (idx / totalShapes) * Math.PI * 2; // phase offset based on shape index
    
    switch (styleId) {
      case 'spin':
        return { rotate: baseRotation + frame * speed, scale: 1, x: 0, y: 0 };
      
      case 'oscillate': {
        const angle = Math.sin(t + phase) * 45; // oscillate ±45 degrees
        return { rotate: baseRotation + angle, scale: 1, x: 0, y: 0 };
      }
      
      case 'pulse-spin': {
        const speedMod = 1 + Math.sin(t * 0.5) * 0.5; // speed varies 0.5x to 1.5x
        return { rotate: baseRotation + frame * speed * speedMod, scale: 1, x: 0, y: 0 };
      }
      
      case 'orbit': {
        const orbitR = 5;
        const x = Math.cos(t + phase) * orbitR;
        const y = Math.sin(t + phase) * orbitR;
        return { rotate: baseRotation, scale: 1, x, y };
      }
      
      case 'triangle-path': {
        const triPhase = ((t + phase) % (Math.PI * 2)) / (Math.PI * 2);
        const triR = 5;
        let x, y;
        if (triPhase < 0.333) {
          const p = triPhase / 0.333;
          x = triR * (1 - p) + triR * -0.5 * p;
          y = -triR * 0.866 * p;
        } else if (triPhase < 0.666) {
          const p = (triPhase - 0.333) / 0.333;
          x = triR * -0.5 * (1 - p) + triR * -0.5 * p;
          y = -triR * 0.866 * (1 - p) + triR * 0.866 * p;
        } else {
          const p = (triPhase - 0.666) / 0.334;
          x = triR * -0.5 * (1 - p) + triR * p;
          y = triR * 0.866 * (1 - p);
        }
        return { rotate: baseRotation, scale: 1, x, y };
      }
      
      case 'square-path': {
        const sqPhase = ((t + phase) % (Math.PI * 2)) / (Math.PI * 2);
        const sqR = 5;
        let x, y;
        if (sqPhase < 0.25) { x = sqR; y = -sqR + sqPhase * 4 * 2 * sqR; }
        else if (sqPhase < 0.5) { x = sqR - (sqPhase - 0.25) * 4 * 2 * sqR; y = sqR; }
        else if (sqPhase < 0.75) { x = -sqR; y = sqR - (sqPhase - 0.5) * 4 * 2 * sqR; }
        else { x = -sqR + (sqPhase - 0.75) * 4 * 2 * sqR; y = -sqR; }
        return { rotate: baseRotation, scale: 1, x, y };
      }
      
      case 'figure8': {
        const f8R = 6;
        const x = Math.sin(t + phase) * f8R;
        const y = Math.sin((t + phase) * 2) * f8R * 0.5;
        return { rotate: baseRotation, scale: 1, x, y };
      }
      
      case 'jitter': {
        const jx = (Math.sin(t * 7 + phase * 3) + Math.sin(t * 11 + phase * 5)) * 2;
        const jy = (Math.cos(t * 9 + phase * 4) + Math.cos(t * 13 + phase * 2)) * 2;
        return { rotate: baseRotation, scale: 1, x: jx, y: jy };
      }
      
      case 'breathe': {
        const scale = 1 + Math.sin(t + phase) * 0.2; // scale 0.8 to 1.2
        return { rotate: baseRotation, scale, x: 0, y: 0 };
      }
      
      case 'heartbeat': {
        const beatPhase = (t + phase) % (Math.PI * 2);
        let scale;
        if (beatPhase < Math.PI * 0.3) {
          scale = 1 + Math.sin(beatPhase / 0.3 * Math.PI) * 0.3; // quick expand
        } else {
          scale = 1 + Math.sin(Math.PI) * 0.3 * (1 - (beatPhase - Math.PI * 0.3) / (Math.PI * 1.7)); // slow contract
        }
        return { rotate: baseRotation, scale: Math.max(0.7, scale), x: 0, y: 0 };
      }
      
      case 'pop': {
        const popPhase = (t * 2 + phase) % (Math.PI * 2);
        const scale = popPhase < 0.5 ? 1 + popPhase * 0.6 : 1.3 - (popPhase - 0.5) * 0.6 / (Math.PI * 2 - 0.5);
        return { rotate: baseRotation, scale: Math.max(0.8, Math.min(1.3, scale)), x: 0, y: 0 };
      }
      
      case 'shape-cycle':
      case 'star-evolve':
        // These would need shape morphing which requires more complex SVG manipulation
        // For now, just do a rotation + scale combo
        return { rotate: baseRotation + frame * speed * 0.5, scale: 1 + Math.sin(t) * 0.1, x: 0, y: 0 };
      
      case 'orbit-spin': {
        const orbitR = 5;
        const x = Math.cos(t + phase) * orbitR;
        const y = Math.sin(t + phase) * orbitR;
        return { rotate: baseRotation + frame * speed, scale: 1, x, y };
      }
      
      case 'breathe-oscillate': {
        const scale = 1 + Math.sin(t + phase) * 0.15;
        const angle = Math.sin(t * 0.7 + phase) * 30;
        return { rotate: baseRotation + angle, scale, x: 0, y: 0 };
      }
      
      case 'wave': {
        // Wave effect - animation ripples based on index
        const waveT = t - idx * 0.05;
        const scale = 1 + Math.sin(waveT) * 0.2;
        const y = Math.sin(waveT) * 3;
        return { rotate: baseRotation, scale, x: 0, y };
      }
      
      case 'none':
      default:
        return { rotate: baseRotation, scale: 1, x: 0, y: 0 };
    }
  }, []);

  // Update visibility and animation based on current frame
  useEffect(() => {
    const totalShapes = config.totalShapes;
    
    shapesRef.current.forEach((svg) => {
      const idx = parseInt(svg.dataset.shapeIndex);
      const baseRotation = parseFloat(svg.dataset.baseRotation || 0);
      
      if (config.keepAllVisible) {
        svg.style.opacity = '1';
        
        // Apply animation style
        const anim = getAnimationTransform(
          config.animationStyle, currentFrame, idx, totalShapes, baseRotation, config.rotationSpeed
        );
        svg.style.transform = `translate(${anim.x}px, ${anim.y}px) rotate(${anim.rotate}deg) scale(${anim.scale})`;
      } else {
        // Normal draw/hide cycle
        let visibleSet;
        if (currentFrame <= totalShapes) {
          visibleSet = new Set(drawOrder.slice(0, currentFrame));
        } else {
          const hideCount = currentFrame - totalShapes;
          visibleSet = new Set(drawOrder.slice(hideCount, totalShapes));
        }
        
        const isVisible = visibleSet.has(idx);
        svg.style.opacity = isVisible ? '1' : '0';
        
        if (isVisible) {
          const anim = getAnimationTransform(
            config.animationStyle, currentFrame, idx, totalShapes, baseRotation, config.rotationSpeed
          );
          svg.style.transform = `translate(${anim.x}px, ${anim.y}px) rotate(${anim.rotate}deg) scale(${anim.scale})`;
        }
      }
    });
  }, [currentFrame, drawOrder, config.totalShapes, config.animationStyle, config.rotationSpeed, config.keepAllVisible, getAnimationTransform]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1 > maxFrames ? 0 : prev + 1));
      }, config.animationSpeed);
    } else {
      clearInterval(animationRef.current);
    }
    return () => clearInterval(animationRef.current);
  }, [isPlaying, maxFrames, config.animationSpeed]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const exportConfig = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json);
    alert('Config copied to clipboard!');
  };

  const importConfig = () => {
    const json = prompt('Paste config JSON:');
    if (json) {
      try {
        const parsed = JSON.parse(json);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        alert('Invalid JSON');
      }
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setCurrentFrame(0);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Pan handlers for canvas
  const handlePanStart = (clientX, clientY) => {
    setIsPanning(true);
    setLastTouch({ x: clientX, y: clientY });
  };

  const handlePanMove = (clientX, clientY) => {
    if (!isPanning) return;
    const dx = clientX - lastTouch.x;
    const dy = clientY - lastTouch.y;
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastTouch({ x: clientX, y: clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Mouse events for canvas panning
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      handlePanStart(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e) => {
    handlePanMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handlePanEnd();
  };

  // Get distance between two touch points
  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch events for canvas panning and pinch zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
      setLastPinchDist(null);
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      setLastPinchDist(getTouchDistance(e.touches));
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && !lastPinchDist) {
      handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches);
      if (lastPinchDist) {
        const scale = dist / lastPinchDist;
        setZoom(prev => Math.max(0.25, Math.min(4, prev * scale)));
      }
      setLastPinchDist(dist);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setLastPinchDist(null);
    }
    if (e.touches.length === 0) {
      handlePanEnd();
    }
  };

  // Scroll wheel for zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.25, Math.min(4, prev * delta)));
  };

  // Resize divider handlers (mobile)
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setLastTouch({ x: 0, y: clientY });
  };

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const offsetFromBottom = containerRect.bottom - clientY;
    const newHeight = (offsetFromBottom / containerHeight) * 100;
    setSidebarHeight(Math.max(10, Math.min(80, newHeight)));
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Global mouse/touch handlers for resize
  useEffect(() => {
    if (isResizing) {
      const handleMove = (e) => handleResizeMove(e);
      const handleEnd = () => handleResizeEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const selectedShape = SHAPES.find(s => s.id === config.shape);
  const canRandomize = selectedShape && !selectedShape.fixedAspect;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="animation-lab" ref={containerRef}>
      <div 
        className={`lab-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={isMobile && !sidebarCollapsed ? { height: `${sidebarHeight}%` } : undefined}
      >
        {/* Resize handle for mobile */}
        <div 
          className="lab-resize-handle"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        >
          <div className="resize-grip" />
        </div>
        
        <div className="lab-header">
          <h2>Animation Lab</h2>
          <div className="lab-header-actions">
            <button 
              className="lab-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Link to="/" className="lab-home-link"><ArrowLeft size={14} /> Home</Link>
          </div>
        </div>

        <div className="lab-section">
          <h3>Shape, Arrangement & Animation</h3>
          <div className="wheel-pickers-row">
            <div className="wheel-picker-col">
              <div className="wheel-picker-label">Shape</div>
              <WheelPicker
                items={SHAPES}
                value={config.shape}
                onChange={(id) => handleConfigChange('shape', id)}
                itemHeight={36}
                renderItem={(item, isSelected) => (
                  <div className="wheel-item-content">
                    <ShapePreview 
                      shapeId={item.id} 
                      size={24} 
                      stroke={isSelected ? '#fff' : '#666'}
                    />
                  </div>
                )}
              />
            </div>
            <div className="wheel-picker-col">
              <div className="wheel-picker-label">Arrangement</div>
              <WheelPicker
                items={ARRANGEMENTS}
                value={config.arrangement}
                onChange={(id) => handleConfigChange('arrangement', id)}
                itemHeight={36}
                renderItem={(item, isSelected) => (
                  <div className="wheel-item-content">
                    <ArrangementPreview 
                      arrangementId={item.id} 
                      size={24} 
                      stroke={isSelected ? '#fff' : '#666'}
                    />
                  </div>
                )}
              />
            </div>
            <div className="wheel-picker-col wheel-picker-col-wide">
              <div className="wheel-picker-label">Animation</div>
              <WheelPicker
                items={ANIMATION_STYLES}
                value={config.animationStyle}
                onChange={(id) => handleConfigChange('animationStyle', id)}
                itemHeight={36}
                renderItem={(item, isSelected) => (
                  <div className="wheel-item-content">
                    <AnimationStylePreview 
                      styleId={item.id} 
                      size={28} 
                      stroke={isSelected ? '#fff' : '#666'}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        <div className="lab-section">
          <h3>Shape Options</h3>
          <label className="lab-checkbox">
            <input
              type="checkbox"
              checked={config.randomDimensions}
              disabled={!canRandomize}
              onChange={(e) => handleConfigChange('randomDimensions', e.target.checked)}
            />
            Random dimensions
          </label>

          {config.randomDimensions && canRandomize && (
            <div className="lab-slider">
              <label>Variance: {config.dimensionVariance.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.dimensionVariance}
                onChange={(e) => handleConfigChange('dimensionVariance', parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="lab-slider">
            <label>Size: {config.shapeSize}px</label>
            <input
              type="range"
              min="10"
              max="100"
              value={config.shapeSize}
              onChange={(e) => handleConfigChange('shapeSize', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="lab-section">
          <h3>Arrangement Options</h3>
          <div className="lab-row">
            <label>Anchor:</label>
            <select
              value={config.anchor}
              onChange={(e) => handleConfigChange('anchor', e.target.value)}
              className="lab-select-small"
            >
              {ANCHORS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="lab-slider">
            <label>Radius: {config.arrangementRadius}px</label>
            <input
              type="range"
              min="50"
              max="300"
              value={config.arrangementRadius}
              onChange={(e) => handleConfigChange('arrangementRadius', parseInt(e.target.value))}
            />
          </div>

          <div className="lab-slider">
            <label>Starting Points: {config.startingPoints}</label>
            <input
              type="range"
              min="1"
              max="12"
              value={config.startingPoints}
              onChange={(e) => handleConfigChange('startingPoints', parseInt(e.target.value))}
            />
          </div>

          <div className="lab-slider">
            <label>Total Shapes: {config.totalShapes}</label>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={config.totalShapes}
              onChange={(e) => handleConfigChange('totalShapes', parseInt(e.target.value))}
            />
          </div>

          <label className="lab-checkbox">
            <input
              type="checkbox"
              checked={config.rotateWithPosition}
              onChange={(e) => handleConfigChange('rotateWithPosition', e.target.checked)}
            />
            Rotate with position
          </label>
        </div>

        <div className="lab-section">
          <h3>Colors</h3>
          
          <div className="lab-color">
            <label>Border:</label>
            <input
              type="color"
              value={config.borderColor}
              onChange={(e) => handleConfigChange('borderColor', e.target.value)}
            />
          </div>

          <div className="lab-color">
            <label>Fill:</label>
            <input
              type="color"
              value={config.fillColor === 'transparent' ? '#1c1c1c' : config.fillColor}
              onChange={(e) => handleConfigChange('fillColor', e.target.value)}
            />
            <button
              className="lab-btn-small"
              onClick={() => handleConfigChange('fillColor', 'transparent')}
            >
              Clear
            </button>
          </div>

          <label className="lab-checkbox">
            <input
              type="checkbox"
              checked={config.useGradient}
              onChange={(e) => handleConfigChange('useGradient', e.target.checked)}
            />
            Use gradient
          </label>

          {config.useGradient && (
            <div className="lab-gradient">
              <div className="lab-color">
                <label>Start:</label>
                <input
                  type="color"
                  value={config.gradientStart}
                  onChange={(e) => handleConfigChange('gradientStart', e.target.value)}
                />
              </div>
              <div className="lab-color">
                <label>End:</label>
                <input
                  type="color"
                  value={config.gradientEnd}
                  onChange={(e) => handleConfigChange('gradientEnd', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lab-section">
          <h3>Animation</h3>
          
          <label className="lab-checkbox">
            <input
              type="checkbox"
              checked={config.keepAllVisible}
              onChange={(e) => handleConfigChange('keepAllVisible', e.target.checked)}
            />
            Keep all visible (no draw/hide)
          </label>

          <div className="lab-slider">
            <label>Speed: {config.animationSpeed}ms</label>
            <input
              type="range"
              min="10"
              max="200"
              value={config.animationSpeed}
              onChange={(e) => handleConfigChange('animationSpeed', parseInt(e.target.value))}
            />
          </div>

          <label className="lab-checkbox">
            <input
              type="checkbox"
              checked={config.animatedRotation}
              onChange={(e) => handleConfigChange('animatedRotation', e.target.checked)}
            />
            Spin shapes
          </label>

          {config.animatedRotation && (
            <div className="lab-slider">
              <label>Spin speed: {config.rotationSpeed}°</label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={config.rotationSpeed}
                onChange={(e) => handleConfigChange('rotationSpeed', parseFloat(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="lab-section lab-actions">
          <button className="lab-btn" onClick={exportConfig}>Export Config</button>
          <button className="lab-btn" onClick={importConfig}>Import Config</button>
          <button className="lab-btn lab-btn-danger" onClick={resetConfig}>Reset</button>
        </div>
      </div>

      <div className="lab-main">
        <div 
          className="lab-canvas-wrapper"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div 
            className="lab-canvas" 
            ref={canvasRef}
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}
          />
        </div>
        
        <div className="lab-controls">
          <button className="lab-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <div className="lab-timeline">
            <input
              type="range"
              min="0"
              max={maxFrames}
              value={currentFrame}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrame(parseInt(e.target.value));
              }}
            />
            <span className="lab-frame-count">{currentFrame} / {maxFrames}</span>
          </div>

          <button className="lab-reset-btn" onClick={() => setCurrentFrame(0)} title="Reset animation">
            <RotateCcw size={16} />
          </button>
          {(panOffset.x !== 0 || panOffset.y !== 0 || zoom !== 1) && (
            <button 
              className="lab-reset-btn" 
              onClick={() => { setPanOffset({ x: 0, y: 0 }); setZoom(1); }}
              title="Reset view"
            >
              <Maximize size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimationLab;

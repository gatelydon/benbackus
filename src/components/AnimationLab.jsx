import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
];

const ANCHORS = [
  { id: 'top-left', name: 'Top-Left' },
  { id: 'top-right', name: 'Top-Right' },
  { id: 'center', name: 'Center' },
  { id: 'tangent', name: 'Follow Circle' },
];

const DEFAULT_CONFIG = {
  shape: 'square',
  arrangement: 'circle',
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
  animationSpeed: 50,
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

const AnimationLab = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasRef = useRef(null);
  const shapesRef = useRef([]);
  const animationRef = useRef(null);

  // Full animation: draw all shapes, then hide all shapes (double the frames)
  const maxFrames = config.totalShapes * 2;

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
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
      case 'figure8': {
        return { x: centerX + Math.sin(angle) * radius, y: centerY + Math.sin(angle * 2) * radius * 0.5 };
      }
      case 'spiral': {
        const spiralRadius = radius * 0.3 + (radius * 0.7 * progress);
        return { x: centerX + Math.cos(angle * 3) * spiralRadius, y: centerY + Math.sin(angle * 3) * spiralRadius };
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

  // Update visibility based on current frame
  // First half: draw shapes in order
  // Second half: hide shapes in same order (shuffle out)
  useEffect(() => {
    const totalShapes = config.totalShapes;
    let visibleSet;
    
    if (currentFrame <= totalShapes) {
      // Draw phase: show shapes 0 to currentFrame
      visibleSet = new Set(drawOrder.slice(0, currentFrame));
    } else {
      // Hide phase: hide shapes in the order they were drawn
      const hideCount = currentFrame - totalShapes;
      // Show all shapes except the first hideCount that were drawn
      visibleSet = new Set(drawOrder.slice(hideCount, totalShapes));
    }
    
    shapesRef.current.forEach((svg) => {
      const idx = parseInt(svg.dataset.shapeIndex);
      svg.style.opacity = visibleSet.has(idx) ? '1' : '0';
    });
  }, [currentFrame, drawOrder, config.totalShapes]);

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

  // Scroll wheel control on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      // Scroll down = advance, scroll up = reverse
      // Use deltaY normalized to steps (divide by ~50 for reasonable speed)
      const steps = Math.sign(e.deltaY) * Math.max(1, Math.floor(Math.abs(e.deltaY) / 30));
      setCurrentFrame(prev => {
        let next = prev + steps;
        // Wrap around
        if (next > maxFrames) next = next - maxFrames;
        if (next < 0) next = maxFrames + next;
        return Math.max(0, Math.min(maxFrames, next));
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [maxFrames]);

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
  };

  const selectedShape = SHAPES.find(s => s.id === config.shape);
  const canRandomize = selectedShape && !selectedShape.fixedAspect;

  return (
    <div className="animation-lab">
      <div className="lab-sidebar">
        <h2>Animation Lab</h2>

        <div className="lab-section">
          <h3>Shape: {selectedShape?.name}</h3>
          <div className="shape-buttons">
            {SHAPES.map(s => (
              <button
                key={s.id}
                className={`shape-btn ${config.shape === s.id ? 'active' : ''}`}
                onClick={() => handleConfigChange('shape', s.id)}
                title={s.name}
              >
                <ShapePreview 
                  shapeId={s.id} 
                  size={24} 
                  stroke={config.shape === s.id ? '#fff' : '#666'}
                />
              </button>
            ))}
          </div>

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
          <h3>Arrangement</h3>
          <select
            value={config.arrangement}
            onChange={(e) => handleConfigChange('arrangement', e.target.value)}
          >
            {ARRANGEMENTS.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

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
        </div>

        <div className="lab-section lab-actions">
          <button className="lab-btn" onClick={exportConfig}>Export Config</button>
          <button className="lab-btn" onClick={importConfig}>Import Config</button>
          <button className="lab-btn lab-btn-danger" onClick={resetConfig}>Reset</button>
        </div>
      </div>

      <div className="lab-main">
        <div className="lab-canvas" ref={canvasRef} />
        
        <div className="lab-controls">
          <button className="lab-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸' : '▶'}
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

          <button className="lab-reset-btn" onClick={() => setCurrentFrame(0)}>⟲</button>
        </div>
      </div>
    </div>
  );
};

export default AnimationLab;

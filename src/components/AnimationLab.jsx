import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const DEFAULT_CONFIG = {
  shape: 'square',
  arrangement: 'circle',
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
  animationSpeed: 50, // ms per shape
};

const AnimationLab = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [maxFrames, setMaxFrames] = useState(DEFAULT_CONFIG.totalShapes);
  const canvasRef = useRef(null);
  const shapesRef = useRef([]);
  const animationRef = useRef(null);

  // Update maxFrames when totalShapes changes
  useEffect(() => {
    setMaxFrames(config.totalShapes);
    if (currentFrame > config.totalShapes) {
      setCurrentFrame(config.totalShapes);
    }
  }, [config.totalShapes, currentFrame]);

  // Generate clip-path for different shapes
  const getClipPath = useCallback((shape, variance = 0) => {
    const v = variance; // -1 to 1 range for variation
    switch (shape) {
      case 'circle':
        return 'ellipse(50% 50% at 50% 50%)';
      case 'ellipse':
        const rx = 50 + v * 20;
        const ry = 50 - v * 20;
        return `ellipse(${rx}% ${ry}% at 50% 50%)`;
      case 'square':
        return 'none';
      case 'rectangle':
        return 'none'; // handled by width/height
      case 'parallelogram':
        const skew = 20 + v * 10;
        return `polygon(${skew}% 0%, 100% 0%, ${100-skew}% 100%, 0% 100%)`;
      case 'diamond':
        return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      case 'pentagon':
        return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
      case 'star3':
        return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'star4':
        return 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)';
      case 'star5':
        return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      default:
        return 'none';
    }
  }, []);

  // Calculate position based on arrangement
  const getPosition = useCallback((index, total, arrangement, radius, centerX, centerY) => {
    const progress = index / total;
    const angle = progress * Math.PI * 2;
    
    switch (arrangement) {
      case 'circle':
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      case 'ellipse':
        return {
          x: centerX + Math.cos(angle) * radius * 1.5,
          y: centerY + Math.sin(angle) * radius * 0.7,
        };
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
        const t = angle;
        return {
          x: centerX + Math.sin(t) * radius,
          y: centerY + Math.sin(t * 2) * radius * 0.5,
        };
      }
      case 'spiral': {
        const spiralRadius = radius * 0.3 + (radius * 0.7 * progress);
        return {
          x: centerX + Math.cos(angle * 3) * spiralRadius,
          y: centerY + Math.sin(angle * 3) * spiralRadius,
        };
      }
      default:
        return { x: centerX, y: centerY };
    }
  }, []);

  // Clear and redraw shapes
  const renderShapes = useCallback((frameCount) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear existing shapes
    shapesRef.current.forEach(el => el.remove());
    shapesRef.current = [];

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate which shapes to show based on starting points
    // With N starting points, we draw shapes in a pattern that creates N "arms"
    const shapesToDraw = [];
    for (let i = 0; i < frameCount; i++) {
      // Interleave drawing across starting points
      const armIndex = i % config.startingPoints;
      const shapeInArm = Math.floor(i / config.startingPoints);
      const actualIndex = armIndex * (config.totalShapes / config.startingPoints) + shapeInArm;
      if (actualIndex < config.totalShapes) {
        shapesToDraw.push(actualIndex);
      }
    }

    shapesToDraw.forEach((index) => {
      const pos = getPosition(
        index,
        config.totalShapes,
        config.arrangement,
        config.arrangementRadius,
        centerX,
        centerY
      );

      const shape = document.createElement('div');
      shape.className = 'lab-shape';

      // Calculate dimensions
      let width = config.shapeSize;
      let height = config.shapeSize;
      
      const shapeInfo = SHAPES.find(s => s.id === config.shape);
      if (config.randomDimensions && shapeInfo && !shapeInfo.fixedAspect) {
        const variance = config.dimensionVariance;
        width = config.shapeSize * (1 + (Math.random() - 0.5) * 2 * variance);
        height = config.shapeSize * (1 + (Math.random() - 0.5) * 2 * variance);
      }

      // Calculate rotation based on position in circle
      const rotation = config.rotateWithPosition 
        ? (index / config.totalShapes) * 360 
        : 0;

      // Build background
      let background = config.fillColor;
      if (config.useGradient) {
        background = `linear-gradient(${rotation}deg, ${config.gradientStart}, ${config.gradientEnd})`;
      }

      const clipPath = getClipPath(
        config.shape,
        config.randomDimensions ? (Math.random() - 0.5) * 2 * config.dimensionVariance : 0
      );

      shape.style.cssText = `
        position: absolute;
        left: ${pos.x - width / 2}px;
        top: ${pos.y - height / 2}px;
        width: ${width}px;
        height: ${height}px;
        border: 1px solid ${config.borderColor};
        background: ${background};
        transform: rotate(${rotation}deg);
        clip-path: ${clipPath};
        pointer-events: none;
      `;

      canvas.appendChild(shape);
      shapesRef.current.push(shape);
    });
  }, [config, getPosition, getClipPath]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          const next = prev + 1;
          if (next > maxFrames) {
            return 0; // Loop
          }
          return next;
        });
      }, config.animationSpeed);
    } else {
      clearInterval(animationRef.current);
    }

    return () => clearInterval(animationRef.current);
  }, [isPlaying, maxFrames, config.animationSpeed]);

  // Render on frame change
  useEffect(() => {
    renderShapes(currentFrame);
  }, [currentFrame, renderShapes]);

  // Re-render when config changes (but keep current frame)
  useEffect(() => {
    renderShapes(currentFrame);
  }, [config, currentFrame, renderShapes]);

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
          <h3>Shape</h3>
          <select
            value={config.shape}
            onChange={(e) => handleConfigChange('shape', e.target.value)}
          >
            {SHAPES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

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
          <button
            className="lab-play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
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

          <button
            className="lab-reset-btn"
            onClick={() => setCurrentFrame(0)}
          >
            ⟲
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimationLab;

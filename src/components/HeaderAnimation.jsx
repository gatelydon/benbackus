import { useEffect, useRef } from 'react';

// Ben's star3 figure-8 config
const CONFIG = {
  shape: 'star3',
  arrangement: 'figure8',
  anchor: 'top-left',
  startingPoints: 6,
  totalShapes: 342,
  shapeSize: 50,
  arrangementRadius: 150,
  borderColor: 'rgba(60, 60, 60, 1)', // Match site style (washed out gray)
  fillColor: '#1c1c1c',
  rotateWithPosition: false,
  animatedRotation: true,
  rotationSpeed: 0.5,
  animationSpeed: 20,
};

// Star3 SVG path
const createStar3Path = (size) => {
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2;
  const innerR = outerR * 0.4;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
};

function HeaderAnimation() {
  const containerRef = useRef(null);
  const shapesRef = useRef([]);
  const frameRef = useRef(0);
  const animationRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create an absolute wrapper for all shapes (stays in place when scrolling)
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    `;
    document.body.appendChild(wrapper);
    wrapperRef.current = wrapper;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = windowWidth < 768;

    // Pre-generate all shape data
    const shapeData = [];
    
    // On mobile, position higher (35% down) and use smaller radius
    const mobileRadius = Math.min(CONFIG.arrangementRadius, windowWidth * 0.35);
    const centerX = isMobile ? windowWidth / 2 : 200 + CONFIG.arrangementRadius;
    const centerY = isMobile ? windowHeight * 0.35 : windowHeight / 2;
    const radius = isMobile ? mobileRadius : CONFIG.arrangementRadius;
    
    for (let i = 0; i < CONFIG.totalShapes; i++) {
      const progress = i / CONFIG.totalShapes;
      const angle = progress * Math.PI * 2;

      // Figure-8 arrangement
      const x = centerX + Math.sin(angle) * radius;
      const y = centerY + Math.sin(angle * 2) * radius * 0.5;

      shapeData.push({
        index: i,
        x: x - CONFIG.shapeSize / 2,
        y: y - CONFIG.shapeSize / 2,
        baseRotation: CONFIG.rotateWithPosition ? (i / CONFIG.totalShapes) * 360 : 0,
      });
    }

    // Create SVG elements for all shapes (hidden initially)
    const starPath = createStar3Path(CONFIG.shapeSize);
    
    shapeData.forEach((data) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', CONFIG.shapeSize);
      svg.setAttribute('height', CONFIG.shapeSize);
      svg.setAttribute('viewBox', `0 0 ${CONFIG.shapeSize} ${CONFIG.shapeSize}`);
      svg.style.cssText = `
        position: absolute;
        left: ${data.x}px;
        top: ${data.y}px;
        transform: rotate(${data.baseRotation}deg);
        transform-origin: center center;
        pointer-events: none;
        opacity: 0;
      `;
      svg.dataset.index = data.index;
      svg.dataset.baseRotation = data.baseRotation;

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', starPath);
      polygon.setAttribute('stroke', CONFIG.borderColor);
      polygon.setAttribute('fill', CONFIG.fillColor);
      polygon.setAttribute('stroke-width', '1');

      svg.appendChild(polygon);
      wrapper.appendChild(svg);
      shapesRef.current.push(svg);
    });

    // Also create mirrored shapes for desktop
    if (!isMobile) {
      shapeData.forEach((data) => {
        const mirrorX = windowWidth - 200 - CONFIG.arrangementRadius - Math.sin((data.index / CONFIG.totalShapes) * Math.PI * 2) * CONFIG.arrangementRadius;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', CONFIG.shapeSize);
        svg.setAttribute('height', CONFIG.shapeSize);
        svg.setAttribute('viewBox', `0 0 ${CONFIG.shapeSize} ${CONFIG.shapeSize}`);
        svg.style.cssText = `
          position: absolute;
          left: ${mirrorX - CONFIG.shapeSize / 2}px;
          top: ${data.y}px;
          transform: rotate(${-data.baseRotation}deg);
          transform-origin: center center;
          pointer-events: none;
          opacity: 0;
        `;
        svg.dataset.index = data.index;
        svg.dataset.baseRotation = -data.baseRotation;
        svg.dataset.mirror = 'true';

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', starPath);
        polygon.setAttribute('stroke', CONFIG.borderColor);
        polygon.setAttribute('fill', CONFIG.fillColor);
        polygon.setAttribute('stroke-width', '1');

        svg.appendChild(polygon);
        wrapper.appendChild(svg);
        shapesRef.current.push(svg);
      });
    }

    // Calculate draw order based on starting points
    const drawOrder = [];
    for (let i = 0; i < CONFIG.totalShapes; i++) {
      const armIndex = i % CONFIG.startingPoints;
      const shapeInArm = Math.floor(i / CONFIG.startingPoints);
      const actualIndex = Math.floor(armIndex * (CONFIG.totalShapes / CONFIG.startingPoints) + shapeInArm);
      if (actualIndex < CONFIG.totalShapes) {
        drawOrder.push(actualIndex);
      }
    }

    const maxFrames = CONFIG.totalShapes * 2; // Draw + hide

    // Animation loop
    const animate = () => {
      frameRef.current = (frameRef.current + 1) % maxFrames;
      const frame = frameRef.current;

      let visibleSet;
      if (frame <= CONFIG.totalShapes) {
        visibleSet = new Set(drawOrder.slice(0, frame));
      } else {
        const hideCount = frame - CONFIG.totalShapes;
        visibleSet = new Set(drawOrder.slice(hideCount, CONFIG.totalShapes));
      }

      shapesRef.current.forEach((svg) => {
        const idx = parseInt(svg.dataset.index);
        const isVisible = visibleSet.has(idx);
        svg.style.opacity = isVisible ? '1' : '0';

        if (CONFIG.animatedRotation && isVisible) {
          const baseRotation = parseFloat(svg.dataset.baseRotation || 0);
          const animatedAngle = baseRotation + (frame * CONFIG.rotationSpeed);
          svg.style.transform = `rotate(${animatedAngle}deg)`;
        }
      });

      animationRef.current = setTimeout(animate, CONFIG.animationSpeed);
    };

    animate();

    return () => {
      clearTimeout(animationRef.current);
      shapesRef.current.forEach(svg => svg.remove());
      shapesRef.current = [];
      if (wrapperRef.current) {
        wrapperRef.current.remove();
        wrapperRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}

export default HeaderAnimation;

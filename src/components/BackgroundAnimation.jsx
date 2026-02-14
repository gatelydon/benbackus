import { useEffect, useRef, useCallback } from 'react';
import { generateSquaresInCircle, generateStudyDiamond } from '../utils/svgGenerator';

function BackgroundAnimation() {
  const squaresRef = useRef([]);
  const studyShapesRef = useRef([]);
  const lastScrollIndexRef = useRef(0);

  const INTERVAL = 300;
  const STUDY_SHAPES = 300; // Match other sections, 7 starting points for interleaved draw
  
  // Checkpoints - end at CHECKPOINT_NINE so Self-Study shows full animation
  const CHECKPOINT_ONE = INTERVAL;      // End of circle draw (About)
  const CHECKPOINT_TWO = INTERVAL * 2;  // End of circle hide / start mobius
  const CHECKPOINT_THREE = INTERVAL * 3; // End of mobius draw (Coding)
  const CHECKPOINT_FOUR = INTERVAL * 4;  // End of mobius hide / start fractal
  const CHECKPOINT_FIVE = INTERVAL * 5;  // End of fractal draw (Art)
  const CHECKPOINT_SIX = INTERVAL * 6;   // End of fractal hide / start matrix
  const CHECKPOINT_SEVEN = INTERVAL * 7; // End of matrix draw (Writing)
  const CHECKPOINT_EIGHT = INTERVAL * 8; // End of matrix hide / start study diamonds
  const CHECKPOINT_NINE = CHECKPOINT_EIGHT + STUDY_SHAPES; // End of study diamond draw
  const FINISH_LINE = CHECKPOINT_NINE;

  // Helper to set opacity on both left and right shapes (right may be null on mobile)
  const setShapeOpacity = (shape, opacity) => {
    if (shape && shape.left) {
      shape.left.style.opacity = opacity;
      if (shape.right) {
        shape.right.style.opacity = opacity;
      }
    }
  };

  const drawShape = useCallback((index, squares) => {
    let offsetIndex, newSquare;
    
    if (index < CHECKPOINT_ONE) {
      // Drawing circle
      offsetIndex = index;
      if (offsetIndex >= squares.length) {
        newSquare = generateSquaresInCircle(offsetIndex, false, false, true, true, false, false);
        return [...squares, newSquare];
      } else {
        setShapeOpacity(squares[offsetIndex], 1);
      }
    } else if (index >= CHECKPOINT_ONE && index < CHECKPOINT_TWO) {
      // Hiding circle
      offsetIndex = index - CHECKPOINT_ONE;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index >= CHECKPOINT_TWO && index < CHECKPOINT_THREE) {
      // Drawing mobius (squares)
      offsetIndex = index - CHECKPOINT_ONE;
      if (offsetIndex >= squares.length) {
        newSquare = generateSquaresInCircle(offsetIndex - INTERVAL, false, false, false, true, false, false);
        return [...squares, newSquare];
      } else {
        setShapeOpacity(squares[offsetIndex], 1);
      }
    } else if (index >= CHECKPOINT_THREE && index < CHECKPOINT_FOUR) {
      // Hiding mobius
      offsetIndex = index - CHECKPOINT_TWO;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index >= CHECKPOINT_FOUR && index < CHECKPOINT_FIVE) {
      // Drawing fractal (rotating squares)
      offsetIndex = index - CHECKPOINT_TWO;
      if (offsetIndex >= squares.length) {
        newSquare = generateSquaresInCircle(offsetIndex - INTERVAL * 2, true, false, false, false, false, false);
        return [...squares, newSquare];
      } else {
        setShapeOpacity(squares[offsetIndex], 1);
      }
    } else if (index >= CHECKPOINT_FIVE && index < CHECKPOINT_SIX) {
      // Hiding fractal
      offsetIndex = index - CHECKPOINT_THREE;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index >= CHECKPOINT_SIX && index < CHECKPOINT_SEVEN) {
      // Drawing matrix (expanding squares)
      offsetIndex = index - CHECKPOINT_THREE;
      if (offsetIndex >= squares.length) {
        newSquare = generateSquaresInCircle(offsetIndex - INTERVAL * 3, false, true, false, false, false, false);
        return [...squares, newSquare];
      } else {
        setShapeOpacity(squares[offsetIndex], 1);
      }
    } else if (index >= CHECKPOINT_SEVEN && index < CHECKPOINT_EIGHT) {
      // Hiding matrix
      offsetIndex = index - CHECKPOINT_FOUR;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index >= CHECKPOINT_EIGHT && index < CHECKPOINT_NINE) {
      // Drawing study diamonds (Ben's config: white, 7 starting points, no random)
      const frameIndex = index - CHECKPOINT_EIGHT;
      const result = generateStudyDiamond(frameIndex, 7, STUDY_SHAPES);
      if (result) {
        studyShapesRef.current.push(result);
      }
    }
    
    return squares;
  }, []);

  const hideShape = useCallback((index, squares) => {
    if (index <= CHECKPOINT_ONE) {
      // Reverse circle drawing
      setShapeOpacity(squares[index - 1], 0);
    } else if (index > CHECKPOINT_ONE && index < CHECKPOINT_TWO) {
      // Reverse circle hiding
      const offsetIndex = index - CHECKPOINT_ONE - 1;
      setShapeOpacity(squares[offsetIndex], 1);
    } else if (index >= CHECKPOINT_TWO && index <= CHECKPOINT_THREE) {
      // Reverse mobius drawing
      const offsetIndex = index - CHECKPOINT_ONE - 1;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index > CHECKPOINT_THREE && index < CHECKPOINT_FOUR) {
      // Reverse mobius hiding
      const offsetIndex = index - CHECKPOINT_TWO - 1;
      setShapeOpacity(squares[offsetIndex], 1);
    } else if (index >= CHECKPOINT_FOUR && index <= CHECKPOINT_FIVE) {
      // Reverse fractal drawing
      const offsetIndex = index - CHECKPOINT_TWO - 1;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index > CHECKPOINT_FIVE && index < CHECKPOINT_SIX) {
      // Reverse fractal hiding
      const offsetIndex = index - CHECKPOINT_THREE - 1;
      setShapeOpacity(squares[offsetIndex], 1);
    } else if (index >= CHECKPOINT_SIX && index <= CHECKPOINT_SEVEN) {
      // Reverse matrix drawing
      const offsetIndex = index - CHECKPOINT_THREE - 1;
      setShapeOpacity(squares[offsetIndex], 0);
    } else if (index > CHECKPOINT_SEVEN && index < CHECKPOINT_EIGHT) {
      // Reverse matrix hiding
      const offsetIndex = index - CHECKPOINT_FOUR - 1;
      setShapeOpacity(squares[offsetIndex], 1);
    } else if (index >= CHECKPOINT_EIGHT && index <= CHECKPOINT_NINE) {
      // Reverse study diamond drawing - remove the last one
      const shape = studyShapesRef.current.pop();
      if (shape) {
        if (shape.left) shape.left.remove();
        if (shape.right) shape.right.remove();
      }
    }
    
    return squares;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Get section positions
      const aboutSection = document.getElementById('about');
      const codingSection = document.getElementById('coding');
      const artSection = document.getElementById('art');
      const writingSection = document.getElementById('writing');
      const selfStudySection = document.getElementById('study');
      
      if (!aboutSection || !codingSection || !artSection || !writingSection || !selfStudySection) {
        return;
      }
      
      const aboutTop = aboutSection.offsetTop - 60; // Account for navbar
      const codingTop = codingSection.offsetTop - 60;
      const artTop = artSection.offsetTop - 60;
      const writingTop = writingSection.offsetTop - 60;
      const selfStudyTop = selfStudySection.offsetTop - 60;
      const docEnd = document.documentElement.scrollHeight - viewportHeight;
      
      let targetIndex = 0;
      
      if (scrollY < aboutTop) {
        // Before About - no animation
        targetIndex = 0;
      } else if (scrollY < codingTop) {
        // In About section - draw circles, then hide them
        const sectionProgress = (scrollY - aboutTop) / (codingTop - aboutTop);
        targetIndex = Math.floor(sectionProgress * CHECKPOINT_TWO);
      } else if (scrollY < artTop) {
        // In Coding section - draw mobius squares, then hide them
        const sectionProgress = (scrollY - codingTop) / (artTop - codingTop);
        targetIndex = CHECKPOINT_TWO + Math.floor(sectionProgress * (CHECKPOINT_FOUR - CHECKPOINT_TWO));
      } else if (scrollY < writingTop) {
        // In Art section - draw fractal/spinning squares, then hide them
        const sectionProgress = (scrollY - artTop) / (writingTop - artTop);
        targetIndex = CHECKPOINT_FOUR + Math.floor(sectionProgress * (CHECKPOINT_SIX - CHECKPOINT_FOUR));
      } else if (scrollY < selfStudyTop) {
        // In Writing section - draw matrix/random squares, then hide them
        const sectionProgress = (scrollY - writingTop) / (selfStudyTop - writingTop);
        targetIndex = CHECKPOINT_SIX + Math.floor(sectionProgress * (CHECKPOINT_EIGHT - CHECKPOINT_SIX));
      } else {
        // In Self-Study section - draw study diamonds
        const sectionProgress = Math.min((scrollY - selfStudyTop) / (docEnd - selfStudyTop), 1);
        targetIndex = CHECKPOINT_EIGHT + Math.floor(sectionProgress * STUDY_SHAPES);
      }
      
      const currentIndex = lastScrollIndexRef.current;
      let squares = squaresRef.current;
      
      if (targetIndex > currentIndex) {
        // Scrolling down - advance animation
        for (let i = currentIndex; i < targetIndex; i++) {
          squares = drawShape(i, squares);
        }
      } else if (targetIndex < currentIndex) {
        // Scrolling up - reverse animation
        for (let i = currentIndex; i > targetIndex; i--) {
          squares = hideShape(i, squares);
        }
      }
      
      squaresRef.current = squares;
      lastScrollIndexRef.current = targetIndex;
    };

    // Initialize with nothing visible - animation starts on scroll
    squaresRef.current = [];
    studyShapesRef.current = [];
    lastScrollIndexRef.current = 0;

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clean up squares
      document.querySelectorAll('.square').forEach(el => el.remove());
    };
  }, [drawShape, hideShape]);

  return null;
}

export default BackgroundAnimation;

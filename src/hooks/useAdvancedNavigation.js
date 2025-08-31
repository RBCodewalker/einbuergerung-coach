import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAdvancedNavigation({ 
  currentIndex, 
  totalLength, 
  baseRoute, // e.g., '/lernen/alle' or '/lernen/geschichte-1'
  onNavigate 
}) {
  const navigate = useNavigate();
  
  // Touch and swipe states
  const [touchStart, setTouchStart] = useState(null);
  const [touchCurrent, setTouchCurrent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const [slidingOut, setSlidingOut] = useState(false);

  const SWIPE_THRESHOLD = 100;
  const MAX_SWIPE = 300;

  // Unified navigation with animations
  const navigateWithAnimation = useCallback((direction, targetIndex = null, startOffset = 0) => {
    const currentIdx = currentIndex + 1; // Convert to 1-based
    let nextIndex;
    
    if (targetIndex) {
      nextIndex = targetIndex;
    } else if (direction === 'next') {
      nextIndex = Math.min(totalLength, currentIdx + 1);
    } else {
      nextIndex = Math.max(1, currentIdx - 1);
    }
    
    if (nextIndex === currentIdx) return;
    
    setIsTransitioning(true);
    setTransitionDirection(direction);
    setSlidingOut(true);
    
    if (startOffset !== 0) {
      document.documentElement.style.setProperty('--swipe-start-offset', `${startOffset}px`);
    }
    
    setTouchStart(null);
    setTouchCurrent(null);
    setIsDragging(false);
    
    setTimeout(() => {
      navigate(`${baseRoute}/${nextIndex}`);
      setSlidingOut(false);
      setSwipeOffset(0);
      
      if (onNavigate) {
        onNavigate(nextIndex - 1); // Convert back to 0-based
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
        document.documentElement.style.removeProperty('--swipe-start-offset');
      }, 250);
    }, 250);
  }, [currentIndex, totalLength, baseRoute, navigate, onNavigate]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    navigateWithAnimation('next', null, 0);
  }, [navigateWithAnimation]);

  const handlePrev = useCallback(() => {
    navigateWithAnimation('prev', null, 0);
  }, [navigateWithAnimation]);

  const handleQuestionJump = useCallback((value) => {
    if (value && value >= 1 && value <= totalLength) {
      const currentIdx = currentIndex + 1;
      const direction = value > currentIdx ? 'next' : 'prev';
      navigateWithAnimation(direction, value, 0);
    }
  }, [currentIndex, totalLength, navigateWithAnimation]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (isTransitioning) return;
    
    const touchX = e.targetTouches[0].clientX;
    setTouchStart(touchX);
    setTouchCurrent(touchX);
    setIsDragging(true);
    setSwipeOffset(0);
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e) => {
    if (isTransitioning || !touchStart || !isDragging) return;
    
    const currentX = e.targetTouches[0].clientX;
    setTouchCurrent(currentX);
    
    let distance = currentX - touchStart;
    const currentIdx = currentIndex + 1;
    
    // Limit swipe direction based on available navigation
    if (distance > 0 && currentIdx <= 1) {
      distance = Math.max(0, distance * 0.3);
    }
    if (distance < 0 && currentIdx >= totalLength) {
      distance = Math.min(0, distance * 0.3);
    }
    
    const dampedDistance = Math.sign(distance) * Math.min(Math.abs(distance), MAX_SWIPE);
    setSwipeOffset(dampedDistance);
  }, [isTransitioning, touchStart, isDragging, currentIndex, totalLength]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchCurrent || isTransitioning || !isDragging) {
      resetSwipeState();
      return;
    }
    
    const distance = touchCurrent - touchStart;
    const currentIdx = currentIndex + 1;
    
    const shouldNavigateNext = distance < -SWIPE_THRESHOLD && currentIdx < totalLength;
    const shouldNavigatePrev = distance > SWIPE_THRESHOLD && currentIdx > 1;
    
    if (shouldNavigateNext) {
      navigateWithAnimation('next', null, swipeOffset);
    } else if (shouldNavigatePrev) {
      navigateWithAnimation('prev', null, swipeOffset);
    } else {
      resetSwipeState();
    }
  }, [touchStart, touchCurrent, isTransitioning, isDragging, currentIndex, totalLength, swipeOffset, navigateWithAnimation]);

  const resetSwipeState = useCallback(() => {
    setTouchStart(null);
    setTouchCurrent(null);
    setSwipeOffset(0);
    setIsDragging(false);
  }, []);

  const handleTouchCancel = useCallback(() => {
    resetSwipeState();
  }, [resetSwipeState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTransitioning) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isTransitioning]);

  return {
    // Navigation handlers
    handleNext,
    handlePrev,
    handleQuestionJump,
    
    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    
    // Animation states
    isTransitioning,
    transitionDirection,
    slidingOut,
    swipeOffset,
    isDragging,
    
    // Utility
    resetSwipeState
  };
}
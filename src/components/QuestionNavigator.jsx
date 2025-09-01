import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Stack, 
  Group, 
  Button, 
  ActionIcon, 
  Text, 
  Paper,
  Affix,
  useMantineColorScheme
} from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function QuestionNavigator({ 
  mode = 'learn', // 'learn' or 'quiz'
  questions,
  currentIndex,
  baseRoute, // e.g., '/lernen/alle', '/quiz', '/lernen/geschichte-1'
  children, // The question content to render
  centerActions = null, // Optional center actions (flags, review buttons, etc.)
  onNavigate = null, // Optional callback when navigation occurs
  navigationHints = true // Show navigation hints
}) {
  const navigate = useNavigate();
  const { questionIndex } = useParams();
  const { colorScheme } = useMantineColorScheme();
  
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

  // Determine if we're on a touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Unified navigation with animations
  const navigateWithAnimation = useCallback((direction, targetIndex = null, startOffset = 0) => {
    const currentIdx = parseInt(questionIndex, 10);
    let nextIndex;
    
    
    if (targetIndex) {
      nextIndex = targetIndex;
    } else if (direction === 'next') {
      if (mode === 'quiz' && currentIdx >= questions.length) {
        // In quiz mode, redirect to review when going past the last question
        navigate('/quiz/review');
        return;
      }
      nextIndex = Math.min(questions.length, currentIdx + 1);
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
      if (onNavigate) {
        // Let the custom handler handle navigation
        onNavigate(nextIndex - 1); // Convert to 0-based for callback
      } else {
        // Default navigation behavior
        const navigateUrl = `${baseRoute}/${nextIndex}`;
        navigate(navigateUrl);
      }
      setSlidingOut(false);
      setSwipeOffset(0);
      
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
        document.documentElement.style.removeProperty('--swipe-start-offset');
      }, 250);
    }, 250);
  }, [questionIndex, questions.length, baseRoute, navigate, onNavigate, mode]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    navigateWithAnimation('next', null, 0);
  }, [navigateWithAnimation]);

  const handlePrev = useCallback(() => {
    navigateWithAnimation('prev', null, 0);
  }, [navigateWithAnimation]);

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
    const currentIdx = parseInt(questionIndex, 10);
    
    // Limit swipe direction based on available navigation
    if (distance > 0 && currentIdx <= 1) {
      distance = Math.max(0, distance * 0.3);
    }
    if (distance < 0 && currentIdx >= questions.length) {
      distance = Math.min(0, distance * 0.3);
    }
    
    const dampedDistance = Math.sign(distance) * Math.min(Math.abs(distance), MAX_SWIPE);
    setSwipeOffset(dampedDistance);
  }, [isTransitioning, touchStart, isDragging, questionIndex, questions.length]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchCurrent || isTransitioning || !isDragging) {
      resetSwipeState();
      return;
    }
    
    const distance = touchCurrent - touchStart;
    const currentIdx = parseInt(questionIndex, 10);
    
    const shouldNavigateNext = distance < -SWIPE_THRESHOLD && currentIdx < questions.length;
    const shouldNavigatePrev = distance > SWIPE_THRESHOLD && currentIdx > 1;
    
    
    if (shouldNavigateNext) {
      navigateWithAnimation('next', null, swipeOffset);
    } else if (shouldNavigatePrev) {
      navigateWithAnimation('prev', null, swipeOffset);
    } else {
      resetSwipeState();
    }
  }, [touchStart, touchCurrent, isTransitioning, isDragging, questionIndex, questions.length, swipeOffset, navigateWithAnimation]);

  const handleTouchCancel = useCallback(() => {
    resetSwipeState();
  }, []);

  const resetSwipeState = useCallback(() => {
    setTouchStart(null);
    setTouchCurrent(null);
    setSwipeOffset(0);
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTransitioning) return;
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT') return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (mode === 'quiz' && e.key === ' ') {
        // Spacebar for next in quiz mode only
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isTransitioning, mode]);

  // Handle initial slide-in animation when component mounts
  useEffect(() => {
    if (isTransitioning && !slidingOut) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
      }, 250);
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, slidingOut]);

  const currentIdx = parseInt(questionIndex, 10);

  return (
    <>
      {/* Question Content Container with animations */}
      <div
        className="swipe-container"
        style={{
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'pan-y pinch-zoom', // Allow vertical scroll but capture horizontal
        }}
      >
        <Stack
          gap="lg"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          style={{
            transform: (() => {
              if (isDragging) return `translateX(${swipeOffset}px)`;
              if (isTransitioning && slidingOut) {
                // Let CSS animation handle the transform during slide-out
                return 'none';
              }
              if (isTransitioning && !slidingOut) {
                // Starting position for slide-in animation
                return 'none';
              }
              return 'translateX(0)';
            })(),
            transition: isDragging ? 'none' : (isTransitioning ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)'),
            animation: isTransitioning 
              ? slidingOut
                ? `slideOut${transitionDirection === 'next' ? 'Left' : 'Right'} 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`
                : `slideIn${transitionDirection === 'next' ? 'FromRight' : 'FromLeft'} 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`
              : 'none',
            willChange: 'transform, opacity',
          }}
        >
          {children}
        </Stack>
      </div>

      {/* Fixed Bottom Navigation */}
      <Affix position={{ bottom: 0, left: 0, right: 0 }}>
        <Paper 
          shadow="md" 
          p="md" 
          style={{
            borderRadius: 0,
            borderTop: '1px solid var(--mantine-color-gray-3)',
            backgroundColor: 'var(--mantine-color-body)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Group justify="space-between" align="center" gap="md">
            {/* Previous Button */}
            <Button 
              onClick={handlePrev} 
              variant="light"
              color="gray"
              size="lg"
              disabled={currentIdx === 1}
              leftSection={<ChevronLeft size={20} />}
              style={{ 
                minWidth: '120px',
                transform: transitionDirection === 'prev' && isTransitioning ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
              visibleFrom="sm"
            >
              Zurück
            </Button>
            <ActionIcon
              onClick={handlePrev}
              variant="light"
              color="gray"
              size="xl"
              disabled={currentIdx === 1}
              style={{ 
                transform: transitionDirection === 'prev' && isTransitioning ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
              hiddenFrom="sm"
            >
              <ChevronLeft size={24} />
            </ActionIcon>

            {/* Center Actions */}
            {centerActions || (
              <Text size="sm" c="dimmed" ta="center">
                Frage {currentIdx} von {questions.length}
              </Text>
            )}

            {/* Next Button */}
            <Button 
              onClick={handleNext} 
              variant="filled"
              color="blue"
              size="lg"
              disabled={currentIdx === questions.length}
              rightSection={<ChevronRight size={20} />}
              style={{ 
                minWidth: '120px',
                transform: transitionDirection === 'next' && isTransitioning ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
              visibleFrom="sm"
            >
              Weiter
            </Button>
            <ActionIcon
              onClick={handleNext}
              variant="filled"
              color="blue"
              size="xl"
              disabled={currentIdx === questions.length}
              style={{ 
                transform: transitionDirection === 'next' && isTransitioning ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
              hiddenFrom="sm"
            >
              <ChevronRight size={24} />
            </ActionIcon>
          </Group>

          {/* Navigation hints */}
          {navigationHints && !isTouchDevice && (
            <Text 
              size="xs" 
              c="dimmed" 
              ta="center" 
              mt="xs"
              visibleFrom="md"
              style={{ userSelect: 'none' }}
            >
              {mode === 'quiz' 
                ? '← → Navigationstasten • Leertaste für Weiter • F für Flag'
                : 'Verwende ← → Pfeiltasten oder Wischen zum Navigieren'
              }
            </Text>
          )}
          {navigationHints && isTouchDevice && (
            <Group 
              gap="xs" 
              justify="center" 
              align="center"
              mt="xs"
            >
              <img 
                src={`${process.env.PUBLIC_URL}/icons/swipe-left-right-icon.svg`}
                alt="Swipe gesture"
                style={{ 
                  width: '15px', 
                  height: '15px',
                  filter: colorScheme === 'dark' ? 'invert(1)' : 'none',
                }}
              />
              <Text size="xs" c="dimmed">Wischen zum Navigieren</Text>
            </Group>
          )}
        </Paper>
      </Affix>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideOutLeft {
          from { transform: translateX(var(--swipe-start-offset, 0)); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0.8; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(var(--swipe-start-offset, 0)); opacity: 1; }
          to { transform: translateX(100%); opacity: 0.8; }
        }
        @keyframes slideInFromRight {
          0% { transform: translateX(100%); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromLeft {
          0% { transform: translateX(-100%); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        /* Add subtle visual feedback for swipe progress */
        .swipe-container {
          position: relative;
        }
        
        .swipe-container::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, transparent, var(--mantine-color-blue-5), transparent);
          opacity: ${Math.abs(swipeOffset) / MAX_SWIPE * 0.5};
          transition: opacity 0.1s ease;
          z-index: 1;
          ${swipeOffset > 0 ? 'left: 0;' : 'right: 0;'}
        }
      `}</style>
    </>
  );
}
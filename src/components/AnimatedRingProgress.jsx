import { useEffect, useRef, useState } from 'react';
import { RingProgress, Center, Stack, Text } from '@mantine/core';
import { gsap } from 'gsap';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export function AnimatedRingProgress({ 
  size = 200, 
  thickness = 16, 
  sections, 
  label, 
  duration = 1.5,
  delay = 0 
}) {
  const [animatedSections, setAnimatedSections] = useState([]);
  const progressRef = useRef({ value: 0 });
  const animationTriggered = useRef(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!sections?.length || !hasIntersected || animationTriggered.current) return;
    
    animationTriggered.current = true;
    
    // Initialize with 0 value
    setAnimatedSections([{
      ...sections[0],
      value: 0
    }]);
    
    // Animate from 0 to target value
    const targetValue = sections[0].value;
    
    gsap.to(progressRef.current, {
      value: targetValue,
      duration,
      delay,
      ease: "power2.out",
      onUpdate: () => {
        setAnimatedSections([{
          ...sections[0],
          value: Math.round(progressRef.current.value)
        }]);
      }
    });
  }, [sections, duration, delay, hasIntersected]);

  // Initialize with 0 before animation
  useEffect(() => {
    if (sections?.length && !animationTriggered.current) {
      setAnimatedSections([{
        ...sections[0],
        value: 0
      }]);
    }
  }, [sections]);

  return (
    <div ref={targetRef}>
      <RingProgress
        size={size}
        thickness={thickness}
        sections={animatedSections}
        label={label}
      />
    </div>
  );
}
import { useEffect, useRef } from 'react';
import { Text } from '@mantine/core';
import { gsap } from 'gsap';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export function AnimatedNumber({ 
  value, 
  duration = 1, 
  delay = 0, 
  size = "xl", 
  fw = 700, 
  lh = 1, 
  c,
  suffix = '',
  ...textProps 
}) {
  const numberRef = useRef(null);
  const animatedValueRef = useRef({ current: 0 });
  const animationTriggered = useRef(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!numberRef.current || !hasIntersected || animationTriggered.current) return;
    
    animationTriggered.current = true;
    
    gsap.to(animatedValueRef.current, {
      current: value,
      duration,
      delay,
      ease: "power2.out",
      onUpdate: () => {
        if (numberRef.current) {
          const currentValue = Math.round(animatedValueRef.current.current);
          numberRef.current.textContent = currentValue + suffix;
        }
      }
    });
  }, [value, duration, delay, suffix, hasIntersected]);

  return (
    <div ref={targetRef}>
      <Text 
        ref={numberRef}
        size={size} 
        fw={fw} 
        lh={lh} 
        c={c}
        {...textProps}
      >
        0{suffix}
      </Text>
    </div>
  );
}
import { useEffect, useRef } from 'react';
import { Paper, ThemeIcon, Text } from '@mantine/core';
import { gsap } from 'gsap';
import { AnimatedNumber } from './AnimatedNumber';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export function AnimatedStatsCard({ 
  icon, 
  iconColor = "blue", 
  value, 
  label, 
  delay = 0,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  color,
  ...paperProps 
}) {
  const cardRef = useRef(null);
  const animationTriggered = useRef(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!cardRef.current || !hasIntersected || animationTriggered.current) return;
    
    animationTriggered.current = true;
    
    // Initial state
    gsap.set(cardRef.current, {
      scale: 0.8,
      opacity: 0,
      y: 20
    });

    // Animate in
    gsap.to(cardRef.current, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay,
      ease: "back.out(1.7)"
    });
  }, [delay, hasIntersected]);

  // Initialize with invisible state before animation
  useEffect(() => {
    if (cardRef.current && !animationTriggered.current) {
      gsap.set(cardRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 20
      });
    }
  }, []);

  return (
    <div ref={targetRef}>
      <Paper 
        ref={cardRef}
        withBorder 
        p="lg" 
        radius="lg" 
        shadow="sm" 
        style={{
          textAlign: "center",
          cursor: onClick ? "pointer" : "default",
          ...style
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...paperProps}
      >
      <ThemeIcon size="xl" variant="light" color={iconColor} mx="auto" mb="sm">
        {icon}
      </ThemeIcon>
      <AnimatedNumber
        value={value}
        delay={delay + 0.3}
        duration={1.2}
        c={color}
      />
      <Text size="sm" c="dimmed">
        {label} {value > 0 && onClick && "↗"}
      </Text>
      </Paper>
    </div>
  );
}
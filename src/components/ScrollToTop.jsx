import { useState, useEffect } from 'react';
import { ActionIcon, Affix, Transition } from '@mantine/core';
import { ChevronUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  
  // Check if we're on a quiz page (which has fixed bottom navigation)
  const isQuizPage = location.pathname.startsWith('/quiz/') && location.pathname !== '/quiz/review';

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 1000) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <Affix position={{ 
      bottom: isQuizPage ? 110 : 20,
      right: 20 
    }}>
      <Transition
        transition="slide-up"
        duration={200}
        mounted={isVisible}
      >
        {(transitionStyles) => (
          <ActionIcon
            onClick={scrollToTop}
            size="xl"
            variant="filled"
            color="blue"
            radius="xl"
            style={{
              ...transitionStyles,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000
            }}
            aria-label="Nach oben scrollen"
          >
            <ChevronUp size={25} />
          </ActionIcon>
        )}
      </Transition>
    </Affix>
  );
}
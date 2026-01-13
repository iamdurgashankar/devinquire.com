import { useState, useEffect } from 'react';

export const useTypingEffect = (text, speed = 100, delay = 1000) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeout;

    if (isTyping && currentIndex < text.length) {
      timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else if (currentIndex === text.length) {
      setIsTyping(false);
      timeout = setTimeout(() => {
        setDisplayText('');
        setCurrentIndex(0);
        setIsTyping(true);
      }, delay);
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, isTyping, text, speed, delay]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return { displayText, showCursor };
};

export default useTypingEffect;
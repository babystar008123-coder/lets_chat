'use client';
import { useState, useRef } from 'react';

interface SwipeableProps {
  children: React.ReactNode;
  onReply: () => void;
  onLongPress: () => void;
}

export default function SwipeableMessage({ children, onReply, onLongPress }: SwipeableProps) {
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
    }, 550);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (deltaX > 0 && deltaX < 75) {
      setOffsetX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (offsetX >= 45) {
      if (navigator.vibrate) navigator.vibrate(35);
      onReply();
    }
    setOffsetX(0);
  };

  return (
    <div className="relative flex items-center w-full select-none">
      <div
        className="absolute left-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#F02D65] text-white shadow-md transition-opacity duration-150"
        style={{
          opacity: offsetX > 20 ? offsetX / 60 : 0,
          transform: `scale(${Math.min(offsetX / 45, 1)})`,
        }}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
        </svg>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          onLongPress();
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
}

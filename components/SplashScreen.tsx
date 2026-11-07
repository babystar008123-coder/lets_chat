'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 400);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF2F5] transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center w-36 h-36">
        <div className="absolute left-2 w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF5177]/80 to-[#FF8CA3]/80 backdrop-blur-md shadow-lg flex items-center justify-center border border-white/40 animate-bounce">
          <div className="flex gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse"></span>
          </div>
          <span className="absolute bottom-4 w-3.5 h-1.5 border-b-2 border-white rounded-full"></span>
        </div>

        <div className="absolute right-2 w-20 h-20 rounded-full bg-gradient-to-tr from-[#F02D65]/90 to-[#FF6B8B]/90 backdrop-blur-md shadow-xl flex items-center justify-center border border-white/50">
          <div className="flex gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span className="w-2 h-2 rounded-full bg-white"></span>
          </div>
          <span className="absolute bottom-4 w-4 h-2 border-b-2 border-white rounded-full"></span>
        </div>
      </div>

      <h1 className="mt-6 text-xl font-bold tracking-wide text-[#E91E63]">
        LetsChat
      </h1>

      <div className="w-36 h-1.5 bg-[#FFD1DC] rounded-full overflow-hidden mt-4">
        <div className="h-full bg-[#E91E63] rounded-full animate-[progress_1.8s_ease-in-out_forwards]" />
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

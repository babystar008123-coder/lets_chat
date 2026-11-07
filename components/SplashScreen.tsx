"use client";
import React, { useEffect } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[99999999] flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F3] via-[#FFE4E8] to-[#FFD1DC] select-none">
      <div className="relative flex items-center justify-center">
        {/* Animated Ripple Circles */}
        <div className="absolute w-40 h-40 rounded-full bg-rose-400/20 animate-ping" />
        <div className="absolute w-32 h-32 rounded-full bg-rose-400/30 animate-pulse" />

        {/* Central Card */}
        <div className="relative w-24 h-24 rounded-3xl bg-white shadow-2xl shadow-rose-200/80 flex items-center justify-center border border-rose-100">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-rose-500/80 blur-xs absolute -left-1" />
            <div className="w-10 h-10 rounded-full bg-pink-500/80 blur-xs absolute -right-1" />
            <span className="relative text-3xl">💬</span>
          </div>
        </div>
      </div>

      {/* App Branding & Bouncing Loading Dots */}
      <div className="mt-8 flex flex-col items-center space-y-3">
        <h1 className="text-3xl font-black tracking-wider text-gray-800">
          Lets<span className="text-rose-500">Chat</span>
        </h1>
        <div className="flex items-center gap-2 pt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

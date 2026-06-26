import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const Preloader: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Increment from 0 to 100 over ~5 seconds (50ms * 100 steps = 5000ms)
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none"
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,113,227,0.12)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Glow backdrop behind text */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-apple-blue/20 to-purple-600/20 blur-3xl -z-10"
        />

        {/* Logo */}
        <motion.img 
          src="/logo.png" 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} 
          className="w-20 h-20 mb-2 rounded-full object-cover border-2 border-white/10 shadow-lg" 
          alt="AURA Logo"
        />

        {/* Big centered text "AURA" */}
        <motion.h1
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1
          }}
          className="text-6xl sm:text-7xl font-extrabold text-white tracking-widest relative font-sans"
          style={{
            textShadow: '0 0 40px rgba(0, 113, 227, 0.3)'
          }}
        >
          AURA
        </motion.h1>

        {/* Subtitle with explanation */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.0,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.6
          }}
          className="text-[10px] sm:text-xs text-apple-gray font-medium tracking-[0.3em] uppercase max-w-md px-4 leading-relaxed font-sans"
        >
          AI for Understanding, Revision and Assistance
        </motion.p>
      </div>

      {/* Counter 0–100 */}
      <div className="absolute bottom-14 flex flex-col items-center gap-2">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold tabular-nums font-sans"
          style={{
            background: 'linear-gradient(90deg, #0071e3, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {count}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[10px] text-white/20 tracking-widest uppercase font-sans"
        >
          Loading
        </motion.span>
      </div>
    </motion.div>
  );
};

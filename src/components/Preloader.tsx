import React from 'react';
import { motion } from 'framer-motion';

export const Preloader: React.FC = () => {
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

      {/* Modern thin loading bar indicator */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 h-[1px] bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ left: '-100%' }}
          animate={{ left: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut"
          }}
          className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-apple-blue/60 to-transparent"
        />
      </div>
    </motion.div>
  );
};

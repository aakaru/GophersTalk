import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface EntryScreenProps {
  onUsernameSet: (username: string) => void;
}

const EntryScreen: React.FC<EntryScreenProps> = ({ onUsernameSet }) => {
  const [inputUsername, setInputUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('username', inputUsername.trim());
      window.location.href = currentUrl.toString();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel p-8 max-w-md w-full text-center shadow-xl border-neon-green/30"
      >
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-4xl font-display mb-4 text-neon-green font-bold tracking-tight"
        >
          Gophers Talk
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8 text-neutral-300 text-lg"
        >
          Enter the real-time chat arena.
        </motion.p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.input
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            type="text"
            className="input-box text-center text-lg tracking-wide"
            placeholder="Choose your username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            autoFocus
            required
            maxLength={20}
          />
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3, type: 'spring', stiffness: 150 }}
            whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95, filter: 'brightness(1.2)' }}
            type="submit"
            className={`btn w-full py-3 text-lg font-semibold ${inputUsername.trim() ? 'neon-border' : 'opacity-60 cursor-not-allowed'}`}
            disabled={!inputUsername.trim()}
          >
            Enter Chat
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default EntryScreen; 
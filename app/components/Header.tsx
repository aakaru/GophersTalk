import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  username: string;
  onlineUsers: string[];
  isConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ username, onlineUsers, isConnected }) => {
  const [showUsers, setShowUsers] = useState(false);
  
  return (
    <header className="glass-panel p-4 flex justify-between items-center">
      <div className="flex items-center">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neon-green/20 mr-2 overflow-hidden text-xs font-medium">
          {username.charAt(0).toUpperCase()}
        </div>
        <h1 className="font-display text-neon-green">
          {username}
          <span className={`ml-2 h-2 w-2 rounded-full inline-block ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </h1>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setShowUsers(!showUsers)}
          className={`btn text-sm flex items-center ${showUsers ? 'neon-border' : ''}`}
        >
          <span className="mr-1">
            {onlineUsers.length} online
          </span>
          <span className={`transform transition-transform ${showUsers ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        <AnimatePresence>
          {showUsers && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 glass-panel w-40 p-2 z-10"
            >
              <h3 className="text-xs text-neon-green mb-2">Online Users</h3>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {onlineUsers.map((user, index) => (
                  <li key={index} className="text-sm flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    {user}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header; 
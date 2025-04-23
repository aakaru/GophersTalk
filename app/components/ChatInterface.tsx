import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Header from './Header';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'message' | 'system';
}

interface ChatInterfaceProps {
  username: string;
  messages: Message[];
  onlineUsers: string[];
  onSendMessage: (text: string) => void;
  isConnected: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  username,
  messages,
  onlineUsers,
  onSendMessage,
  isConnected
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (input.trim() && isConnected) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <Header username={username} onlineUsers={onlineUsers} isConnected={isConnected} />
      
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto p-4 pb-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MessageList messages={messages} currentUser={username} />
            <div ref={messagesEndRef} />
          </motion.div>
        </div>
      </div>
      
      <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
        />
        
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0.8, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 mt-2 text-center"
          >
            Disconnected. Attempting to reconnect...
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 
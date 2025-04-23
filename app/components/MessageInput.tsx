import React from 'react';
import { motion } from 'framer-motion';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled
}) => {
  return (
    <div className="flex items-center space-x-3">
      <input
        type="text"
        className="input-box flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyPress}
        placeholder="Type a message..."
        disabled={disabled}
        autoFocus
      />
      
      <motion.button
        whileTap={{ scale: 0.90, filter: 'brightness(1.2)' }}
        whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
        className={`btn ${value.trim() && !disabled ? 'neon-border' : 'opacity-50 cursor-not-allowed'}`}
        onClick={onSend}
        disabled={!value.trim() || disabled}
        transition={{ duration: 0.1 }}
      >
        <motion.span
          className="font-semibold"
        >
          Send
        </motion.span>
      </motion.button>
    </div>
  );
};

export default MessageInput; 
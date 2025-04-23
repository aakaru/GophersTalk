import React from 'react';
import { motion } from 'framer-motion';

interface MessageProps {
  message: {
    id: string;
    username: string;
    text: string;
    timestamp: number;
    type: 'message' | 'system';
  };
  isCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="glass-panel py-1 px-3 text-xs opacity-70 max-w-[80%] text-center">
          {message.text}
        </div>
      </div>
    );
  }

  const avatarClasses = "flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-glass to-darker/60 mr-2 overflow-hidden text-xs font-medium shadow-inner";
  const selfAvatarClasses = "flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-glass to-darker/60 ml-2 overflow-hidden text-xs font-medium shadow-inner";

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end`}>
      {!isCurrentUser && (
        <div className={avatarClasses}>
          {message.username.charAt(0).toUpperCase()}
        </div>
      )}
      
      <div className={isCurrentUser ? 'message-bubble-self' : 'message-bubble-other'}>
        {!isCurrentUser && (
          <div className="text-xs font-semibold text-neon-yellow mb-1">
            {message.username}
          </div>
        )}
        
        <div className="flex flex-col">
          <div className="break-words whitespace-pre-wrap">{message.text}</div>
          <div 
            title={new Date(message.timestamp).toLocaleString()}
            className="text-right text-xs opacity-60 mt-1 select-none"
          >
            {formattedTime}
          </div>
        </div>
      </div>
      
      {isCurrentUser && (
        <div className={selfAvatarClasses}>
          {message.username.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default Message; 
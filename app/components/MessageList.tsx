import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './Message';

interface MessageProps {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'message' | 'system';
}

interface MessageListProps {
  messages: MessageProps[];
  currentUser: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            style={{ originX: message.username === currentUser ? 1 : 0 }}
          >
            <Message
              message={message}
              isCurrentUser={message.username === currentUser}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageList; 
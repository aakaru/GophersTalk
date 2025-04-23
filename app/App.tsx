import React, { useEffect, useState, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import EntryScreen from './components/EntryScreen';
import { useWebSocket } from './hooks/useWebSocket';
import { useURLParams } from './hooks/useURLParams';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'message' | 'system';
}

const App: React.FC = () => {
  const { username } = useURLParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (username) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [username]);

  const handleIncomingMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);

      if (username && data.type === 'message' && data.username === username) {
          console.log('Ignoring own message broadcast:', data);
          return;
      }

      if (data.type === 'message' || data.type === 'system') {
        setMessages(prev => [...prev, {
          ...data,
          id: data.id || `${data.username}-${data.timestamp}-${Math.random()}`
        }]);
      } else if (data.type === 'users') {
        console.log('Received user list:', data.users);
        setOnlineUsers(data.users || []);
      } else {
        console.warn('Received unknown message type:', data.type, data);
      }
    } catch (err) {
      console.error('Failed to parse message:', event.data, err);
    }
  }, [username]);

  const handleConnectionClose = useCallback(() => {
     if (isReady) {
        setMessages(prev => [
          ...prev,
          {
            id: `system-conn-lost-${Date.now()}`,
            username: 'System',
            text: 'Connection lost. Attempting to reconnect...',
            timestamp: Date.now(),
            type: 'system'
          }
        ]);
     }
    setOnlineUsers([]);
  }, [isReady]);


  const {
    isConnected,
    connect,
    sendMessage
  } = useWebSocket({
    url: isReady && username ? `ws://localhost:8080/ws?username=${username}` : '',
    onMessage: handleIncomingMessage,
    onClose: handleConnectionClose,
    onOpen: () => {
        console.log(`WebSocket connected for ${username}`);
    },
    onError: (event) => {
        console.error(`WebSocket error for ${username}:`, event);
    }
  });

  useEffect(() => {
    if (isReady && username && !isConnected) {
      console.log(`Attempting WebSocket connection for ${username}...`);
      connect();
    }
  }, [isReady, username, connect, isConnected]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !isConnected || !username) return;

    const timestamp = Date.now();
    const messageData: Message = {
      id: `${username}-${timestamp}`,
      username,
      text,
      timestamp,
      type: 'message'
    };

    setMessages(prev => [...prev, messageData]);

    const { id, ...messageToSend } = messageData;
    sendMessage(JSON.stringify(messageToSend));
    console.log('Sent message:', messageToSend);
  };

  if (!isReady) {
    return <EntryScreen onUsernameSet={() => { }} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ChatInterface
        username={username!}
        messages={messages}
        onlineUsers={onlineUsers}
        onSendMessage={handleSendMessage}
        isConnected={isConnected}
      />
    </div>
  );
};

export default App; 
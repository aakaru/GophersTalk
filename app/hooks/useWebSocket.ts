import { useCallback, useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
}

export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5
}: WebSocketOptions): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000);
      }
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!url || wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
       console.log('WebSocket connection attempt skipped (already connecting/open or no URL)');
       return;
    }

    cleanup();
    reconnectAttemptsRef.current = 0; // Reset attempts on explicit connect

    console.log('Attempting to connect WebSocket...', url);
    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = (event) => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null; // Ensure ref is nullified on close
        onClose?.(event);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`WebSocket attempting reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect(); // Try connecting again
          }, reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1)); // Exponential backoff
        } else {
          console.log('WebSocket max reconnect attempts reached.');
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        onError?.(event);
        // Error often precedes close, the close handler will attempt reconnect
      };

      wsRef.current.onmessage = (event) => {
        onMessage?.(event);
      };
    } catch (err) {
      console.error('WebSocket instantiation error:', err);
    }
  }, [url, cleanup, onOpen, onClose, onError, onMessage, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket explicitly...');
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect on explicit disconnect
    cleanup();
    setIsConnected(false); // Ensure state reflects disconnected status
  }, [cleanup, maxReconnectAttempts]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        console.log('Cleaning up WebSocket hook...');
        reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnect on unmount
        cleanup();
    };
  }, [cleanup, maxReconnectAttempts]);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage
  };
}; 
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

function useWebSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const tokenValidatedRef = useRef(false);

  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 3,
  } = options;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      
      // NEW: Validate token exists
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required');
        setIsConnected(false);
        return;
      }
      
      const wsUrl = `${WS_BASE_URL}${url}?token=${token}`;
      
      console.log(`WebSocket connecting (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = (event) => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        tokenValidatedRef.current = true;
        onOpen?.(event);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('Connection error');
        onError?.(event);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        onClose?.(event);

        // NEW: Check if it's an auth error (code 1008 = policy violation)
        if (event.code === 1008 || event.code === 4001) {
          console.error('❌ Authentication failed - token invalid');
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Don't attempt reconnection on auth failure
          return;
        }

        // Attempt to reconnect (with limit)
        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`⏳ Reconnecting in ${reconnectInterval/1000}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          setError('Unable to connect. Please refresh the page.');
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect');
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      console.error('❌ WebSocket is not connected');
      setError('Not connected to server');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    send,
    disconnect,
    reconnect: connect,
  };
}

export default useWebSocket;
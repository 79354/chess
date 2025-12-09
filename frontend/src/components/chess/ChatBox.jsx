import React, { useState, useRef, useEffect } from 'react';
import { Send, Users } from 'lucide-react';

function ChatBox({ gameId, isPlayerChat = false, currentUser, websocketSend, onMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Register message handler
  useEffect(() => {
    if (onMessage) {
      const handleIncomingMessage = (data) => {
        if (data.type === 'chat_message') {
          const newMessage = {
            id: data.message.id || Date.now(),
            user: data.message.user,
            message: data.message.text,
            timestamp: new Date(data.message.timestamp || Date.now()),
            isSystem: data.message.is_system || false,
            isOwn: data.message.user === currentUser?.username,
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      };
      
      onMessage(handleIncomingMessage);
    }
  }, [onMessage, currentUser]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !websocketSend) return;

    const messageData = {
      type: 'chat',
      payload: {
        game_id: gameId,
        text: inputMessage.trim(),
        user: currentUser?.username || 'Anonymous',
        timestamp: new Date().toISOString(),
        is_player_chat: isPlayerChat,
      },
    };

    // Send via WebSocket
    websocketSend(messageData);

    // Optimistic update - add own message immediately
    const newMessage = {
      id: Date.now(),
      user: currentUser?.username || 'You',
      message: inputMessage,
      timestamp: new Date(),
      isSystem: false,
      isOwn: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-semibold flex items-center">
          <Users className="w-4 h-4 mr-2" />
          {isPlayerChat ? 'Player Chat' : 'Spectator Chat'}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-2">Say hello to your opponent!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`
                ${msg.isSystem ? 'text-center' : ''}
                ${msg.isOwn ? 'ml-auto' : ''}
              `}
            >
              {msg.isSystem ? (
                <p className="text-white/40 text-xs italic">{msg.message}</p>
              ) : (
                <div className={`max-w-[80%] ${msg.isOwn ? 'ml-auto' : ''}`}>
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className={`text-sm font-semibold ${msg.isOwn ? 'text-purple-400' : 'text-blue-400'}`}>
                      {msg.user}
                    </span>
                    <span className="text-white/40 text-xs">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`
                      rounded-lg p-3 text-sm break-words
                      ${msg.isOwn
                        ? 'bg-purple-600/30 border border-purple-500/30 text-white'
                        : 'bg-white/10 border border-white/10 text-white/90'
                      }
                    `}
                  >
                    {msg.message}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
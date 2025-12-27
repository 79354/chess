import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Users, Smile, X } from 'lucide-react';

function ChatBox({ gameId, isPlayerChat = false, currentUser, websocketSend, onMessage, className = '' }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Common chess emojis
  const quickEmojis = ['♔', '♕', '♖', '♗', '♘', '♙', '😊', '😎', '🤔', '😅', '👍', '👏', '🔥', '💪', '🎯', '⚡'];

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
            id: data.message.id || `${Date.now()}-${Math.random()}`,
            user: data.message.user,
            message: data.message.text,
            timestamp: new Date(data.message.timestamp || Date.now()),
            isSystem: data.message.is_system || false,
            isOwn: data.message.user === currentUser?.username,
          };
          
          setMessages(prev => {
            // Prevent duplicate messages
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Stop typing indicator when message received
          setIsTyping(false);
        } else if (data.type === 'user_typing') {
          if (data.user !== currentUser?.username) {
            setIsTyping(true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            
            // Hide typing indicator after 3 seconds
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      };
      
      return onMessage(handleIncomingMessage);
    }
  }, [onMessage, currentUser]);

  const handleSendMessage = useCallback(() => {
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

    // Clear input
    setInputMessage('');
    
    // Focus back on input
    inputRef.current?.focus();
  }, [inputMessage, websocketSend, gameId, currentUser, isPlayerChat]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Send typing indicator
    if (websocketSend && e.target.value.length > 0) {
      websocketSend({
        type: 'typing',
        payload: {
          game_id: gameId,
          user: currentUser?.username || 'Anonymous',
        },
      });
    }
  };

  const addEmoji = (emoji) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <h3 className="text-white font-semibold flex items-center text-sm">
          <Users className="w-4 h-4 mr-2" />
          {isPlayerChat ? 'Game Chat' : 'Spectator Chat'}
        </h3>
        <span className="text-white/40 text-xs">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 py-8">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-2">Say hello to start chatting!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`
                  ${msg.isSystem ? 'text-center' : ''}
                  ${msg.isOwn ? 'ml-auto' : ''}
                `}
              >
                {msg.isSystem ? (
                  <p className="text-white/40 text-xs italic bg-white/5 py-2 px-3 rounded-lg inline-block">
                    {msg.message}
                  </p>
                ) : (
                  <div className={`max-w-[80%] ${msg.isOwn ? 'ml-auto' : ''}`}>
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className={`text-xs font-semibold ${msg.isOwn ? 'text-purple-400' : 'text-blue-400'}`}>
                        {msg.user}
                      </span>
                      <span className="text-white/40 text-[10px]">{formatTime(msg.timestamp)}</span>
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
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-white/60 text-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-3 bg-white/10 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs font-semibold">Quick Emojis</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {quickEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => addEmoji(emoji)}
                  className="text-xl hover:bg-white/10 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors flex items-center space-x-2"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-white/40 text-[10px] mt-2 text-right">
          {inputMessage.length}/500
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
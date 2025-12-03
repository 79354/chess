import React, { useState, useRef, useEffect } from 'react';
import { Send, Users } from 'lucide-react';

function ChatBox({ gameId, isPlayerChat = false, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // TODO: Connect to WebSocket for real-time chat
    // Example mock messages
    setMessages([
      { id: 1, user: 'Player1', message: 'Good luck!', timestamp: new Date(), isSystem: false },
      { id: 2, user: 'Player2', message: 'Have fun!', timestamp: new Date(), isSystem: false },
    ]);
  }, [gameId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: currentUser?.username || 'You',
      message: inputMessage,
      timestamp: new Date(),
      isSystem: false,
      isOwn: true,
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // TODO: Send message via WebSocket
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
        {!isPlayerChat && (
          <span className="text-white/60 text-sm">
            {messages.filter((m) => !m.isSystem).length} watching
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
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
                    rounded-lg p-3 text-sm
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Swords, MessageCircle, Trophy, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch friend requests
      const friendRequests = await api.get('/auth/friends/requests/');
      
      // Fetch game challenges
      const challenges = await api.get('/game/challenges/pending/');
      
      const allNotifications = [
        ...friendRequests.map(req => ({
          id: `friend_${req.id}`,
          type: 'friend_request',
          data: req,
          message: `${req.from_user.username} sent you a friend request`,
          timestamp: new Date(req.created_at),
          read: false
        })),
        ...challenges.received.map(ch => ({
          id: `challenge_${ch.id}`,
          type: 'game_challenge',
          data: ch,
          message: `${ch.challenger.username} challenged you to a ${ch.time_control} game`,
          timestamp: new Date(ch.created_at),
          read: false
        }))
      ];

      // Sort by timestamp
      allNotifications.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      await api.post('/auth/friends/accept/', { request_id: requestId });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      await api.post('/auth/friends/reject/', { request_id: requestId });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const handleAcceptChallenge = async (challengeId) => {
    try {
      const response = await api.post(`/game/challenges/accept/${challengeId}/`);
      setIsOpen(false);
      navigate(`/game/${response.game_id}`);
    } catch (error) {
      console.error('Failed to accept challenge:', error);
    }
  };

  const handleRejectChallenge = async (challengeId) => {
    try {
      await api.post(`/game/challenges/reject/${challengeId}/`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to reject challenge:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      case 'game_challenge':
        return <Swords className="w-5 h-5 text-green-400" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-purple-400" />;
      case 'tournament':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-white" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/60">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm mb-1">
                        {notification.message}
                      </p>
                      <p className="text-white/40 text-xs">
                        {getTimeAgo(notification.timestamp)}
                      </p>

                      {/* Actions */}
                      {notification.type === 'friend_request' && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleAcceptFriendRequest(notification.data.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectFriendRequest(notification.data.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}

                      {notification.type === 'game_challenge' && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleAcceptChallenge(notification.data.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectChallenge(notification.data.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                          {notification.data.time_remaining && (
                            <span className="flex items-center text-xs text-white/60 px-2">
                              Expires in {Math.floor(notification.data.time_remaining / 60)}:{(notification.data.time_remaining % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 text-center">
              <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
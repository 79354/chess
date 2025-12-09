import React, { useState, useEffect } from 'react';
import { Swords, Clock, X } from 'lucide-react';

function ChallengeNotification({ challenge, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(challenge.time_remaining || 120);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onReject(challenge.id); // Auto-reject when expired
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge.id, onReject]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-500/50 rounded-xl p-4 shadow-xl animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Swords className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Game Challenge!</h3>
        </div>
        <button
          onClick={() => onReject(challenge.id)}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Challenger Info */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
          {challenge.challenger.username[0].toUpperCase()}
        </div>
        <div>
          <p className="text-white font-medium">{challenge.challenger.username}</p>
          <p className="text-white/60 text-sm">{challenge.challenger.rating} rating</p>
        </div>
      </div>

      {/* Time Control */}
      <div className="bg-white/10 rounded-lg p-2 mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-white/60" />
          <span className="text-white text-sm">{challenge.time_control}</span>
        </div>
        <div className={`text-sm font-mono font-semibold ${
          timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'
        }`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onReject(challenge.id)}
          className="flex-1 px-3 py-2 rounded-lg font-medium bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
        >
          Decline
        </button>
        <button
          onClick={() => onAccept(challenge.id)}
          className="flex-1 px-3 py-2 rounded-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all text-sm"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

export default ChallengeNotification;
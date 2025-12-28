import React from 'react';
import { Trophy, Clock, Zap } from 'lucide-react';

function MatchCard({ match, onWatchClick }) {
  const getStatusColor = () => {
    if (match.status === 'completed') return 'bg-gray-500/20';
    if (match.status === 'in-progress') return 'bg-green-500/20';
    return 'bg-blue-500/20';
  };

  const getStatusText = () => {
    if (match.status === 'completed') return 'Completed';
    if (match.status === 'in-progress') return 'Playing';
    return 'Pending';
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${match.status === 'in-progress' ? 'bg-green-500 animate-pulse' : 'bg-white/40'}`} />
          <span className="text-sm font-medium text-white/80">{getStatusText()}</span>
        </div>
        <span className="text-xs text-white/60">Round {match.round}</span>
      </div>

      {/* Players */}
      <div className="space-y-2 mb-4">
        {/* White Player */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{match.whitePlayer.username}</p>
            <p className="text-white/60 text-xs">{match.whitePlayer.rating} rating</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{match.result?.white || '—'}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Black Player */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{match.blackPlayer.username}</p>
            <p className="text-white/60 text-xs">{match.blackPlayer.rating} rating</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{match.result?.black || '—'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center space-x-2 text-white/60 text-xs">
          <Clock className="w-3 h-3" />
          <span>{match.timeControl}</span>
        </div>
        {match.status === 'in-progress' && onWatchClick && (
          <button
            onClick={() => onWatchClick(match.id)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium transition-all"
          >
            Watch
          </button>
        )}
      </div>
    </div>
  );
}

export default MatchCard;
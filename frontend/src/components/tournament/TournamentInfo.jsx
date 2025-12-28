import React from 'react';
import { Calendar, Clock, Trophy, Users, Zap } from 'lucide-react';

function TournamentInfo({ tournament }) {
  if (!tournament) {
    return <div className="text-white/60">No tournament data available</div>;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    {
      icon: Users,
      label: 'Participants',
      value: tournament.players || tournament.participants || 0,
      color: 'text-blue-400',
    },
    {
      icon: Trophy,
      label: 'Prize Pool',
      value: tournament.prize || 'TBD',
      color: 'text-yellow-400',
    },
    {
      icon: Clock,
      label: 'Time Control',
      value: tournament.timeControl || '—',
      color: 'text-green-400',
    },
    {
      icon: Zap,
      label: 'Format',
      value: tournament.format || 'Swiss',
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{tournament.name}</h2>
        <p className="text-white/60 text-sm">{tournament.description || 'A competitive tournament'}</p>
      </div>

      {/* Status Badge */}
      <div className="mb-6 flex items-center space-x-3">
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            tournament.status === 'ongoing'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : tournament.status === 'upcoming'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}
        >
          {tournament.status ? tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1) : 'Pending'}
        </div>
        {tournament.entryFee && (
          <div className="text-white/80 text-sm">
            Entry: <span className="font-semibold text-white">{tournament.entryFee}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/5 rounded-lg p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-white/60 text-xs mb-1">{stat.label}</p>
              <p className="text-white font-bold text-sm">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Dates */}
      {(tournament.startTime || tournament.endTime) && (
        <div className="space-y-3 border-t border-white/10 pt-6">
          {tournament.startTime && (
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Start Time</span>
              <span className="text-white font-semibold text-sm">{formatDate(tournament.startTime)}</span>
            </div>
          )}
          {tournament.endTime && (
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">End Time</span>
              <span className="text-white font-semibold text-sm">{formatDate(tournament.endTime)}</span>
            </div>
          )}
          {tournament.duration && (
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Duration</span>
              <span className="text-white font-semibold text-sm">{tournament.duration} minutes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TournamentInfo;
import React from 'react';
import { Medal, TrendingUp } from 'lucide-react';

function TournamentStandings({ standings = [], isLoading = false }) {
  const getMedalColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 3:
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      default:
        return 'bg-white/5 text-white/80 border-white/10';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Standings</h3>
        <div className="text-center text-white/60">Loading standings...</div>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Standings</h3>
        <div className="text-center text-white/60">No standings available yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Medal className="w-5 h-5 text-yellow-400" />
          <span>Standings</span>
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-xs font-semibold">
              <th className="text-left px-6 py-3">#</th>
              <th className="text-left px-6 py-3">Player</th>
              <th className="text-center px-6 py-3">Played</th>
              <th className="text-center px-6 py-3">Points</th>
              <th className="text-center px-6 py-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr
                key={player.id || index}
                className={`border-b border-white/5 hover:bg-white/5 transition-all ${getMedalColor(index + 1)}`}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center space-x-2">
                    {index + 1 <= 3 && <Medal className="w-4 h-4 text-yellow-400" />}
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{player.username || 'Unknown'}</p>
                    <p className="text-white/60 text-xs">{player.country || ''}</p>
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className="text-white font-semibold text-sm">{player.played || 0}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className="text-white font-bold text-sm">{player.points || player.score || 0}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-white font-semibold text-sm">{player.rating || 1600}</span>
                    {player.ratingChange && (
                      <span className={player.ratingChange > 0 ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                        {player.ratingChange > 0 ? '+' : ''}{player.ratingChange}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TournamentStandings;
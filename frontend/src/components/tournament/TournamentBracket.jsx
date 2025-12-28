import React from 'react';
import { ChevronRight } from 'lucide-react';

function TournamentBracket({ matches = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Bracket</h3>
        <div className="text-center text-white/60">Loading bracket...</div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Bracket</h3>
        <div className="text-center text-white/60">No matches to display</div>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = {};
  matches.forEach((match) => {
    const round = match.round || 1;
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-6">Tournament Bracket</h3>

      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-4">
          {rounds.map((round) => (
            <div key={round} className="flex flex-col space-y-4">
              {/* Round Label */}
              <div className="text-center">
                <p className="text-white/60 text-xs font-semibold">
                  Round {round}
                </p>
              </div>

              {/* Matches in Round */}
              <div className="space-y-3">
                {matchesByRound[round].map((match, idx) => (
                  <div key={match.id || idx} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden w-48">
                    {/* White Player */}
                    <div className="p-2 border-b border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                      <p className="text-white text-sm font-semibold truncate">
                        {match.whitePlayer?.username || 'Player 1'}
                      </p>
                      <p className="text-white/60 text-xs">
                        {match.whitePlayer?.rating || 0} rating
                      </p>
                    </div>

                    {/* Result Badge */}
                    <div className="px-2 py-1 bg-white/5 border-t border-b border-white/10 flex items-center justify-center">
                      {match.status === 'completed' ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-bold text-sm">{match.result?.white || '½'}</span>
                          <span className="text-white/40">—</span>
                          <span className="text-white font-bold text-sm">{match.result?.black || '½'}</span>
                        </div>
                      ) : match.status === 'in-progress' ? (
                        <div className="flex items-center space-x-1 text-green-400 text-xs">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span>Playing</span>
                        </div>
                      ) : (
                        <span className="text-white/60 text-xs">Pending</span>
                      )}
                    </div>

                    {/* Black Player */}
                    <div className="p-2 hover:bg-white/10 cursor-pointer transition-all">
                      <p className="text-white text-sm font-semibold truncate">
                        {match.blackPlayer?.username || 'Player 2'}
                      </p>
                      <p className="text-white/60 text-xs">
                        {match.blackPlayer?.rating || 0} rating
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TournamentBracket;
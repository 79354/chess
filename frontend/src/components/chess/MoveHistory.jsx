import React, { useRef, useEffect } from 'react';

function MoveHistory({ moves, currentMoveIndex, onMoveClick }) {
  const movesEndRef = useRef(null);

  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  const formatMove = (move, index) => {
    // Convert move to standard chess notation
    // This is simplified - you'd need proper chess notation logic
    return move.notation || `${move.from}-${move.to}`;
  };

  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-3">Move History</h3>
      
      <div className="max-h-96 overflow-y-auto space-y-1">
        {movePairs.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No moves yet</p>
        ) : (
          movePairs.map((pair, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[40px_1fr_1fr] gap-2 text-sm hover:bg-white/5 rounded p-1 transition-colors"
            >
              {/* Move Number */}
              <span className="text-white/40 font-semibold">{pair.number}.</span>
              
              {/* White's Move */}
              <button
                onClick={() => onMoveClick(idx * 2)}
                className={`
                  text-left px-2 py-1 rounded transition-colors
                  ${currentMoveIndex === idx * 2
                    ? 'bg-purple-600/50 text-white font-semibold'
                    : 'text-white/80 hover:bg-white/10'
                  }
                `}
              >
                {formatMove(pair.white, idx * 2)}
              </button>
              
              {/* Black's Move */}
              {pair.black && (
                <button
                  onClick={() => onMoveClick(idx * 2 + 1)}
                  className={`
                    text-left px-2 py-1 rounded transition-colors
                    ${currentMoveIndex === idx * 2 + 1
                      ? 'bg-purple-600/50 text-white font-semibold'
                      : 'text-white/80 hover:bg-white/10'
                    }
                  `}
                >
                  {formatMove(pair.black, idx * 2 + 1)}
                </button>
              )}
            </div>
          ))
        )}
        <div ref={movesEndRef} />
      </div>

      {/* Navigation Buttons */}
      {moves.length > 0 && (
        <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => onMoveClick(0)}
            disabled={currentMoveIndex === 0}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ⏮ Start
          </button>
          <button
            onClick={() => onMoveClick(Math.max(0, currentMoveIndex - 1))}
            disabled={currentMoveIndex === 0}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ◀ Prev
          </button>
          <button
            onClick={() => onMoveClick(Math.min(moves.length - 1, currentMoveIndex + 1))}
            disabled={currentMoveIndex === moves.length - 1}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next ▶
          </button>
          <button
            onClick={() => onMoveClick(moves.length - 1)}
            disabled={currentMoveIndex === moves.length - 1}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            End ⏭
          </button>
        </div>
      )}
    </div>
  );
}

export default MoveHistory;
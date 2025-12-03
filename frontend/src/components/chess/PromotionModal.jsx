
function PromotionModal({ isOpen, color, onSelect }) {
  if (!isOpen) return null;

  const pieces = [
    { type: 'queen', symbol: color === 'white' ? '♕' : '♛', name: 'Queen' },
    { type: 'rook', symbol: color === 'white' ? '♖' : '♜', name: 'Rook' },
    { type: 'bishop', symbol: color === 'white' ? '♗' : '♝', name: 'Bishop' },
    { type: 'knight', symbol: color === 'white' ? '♘' : '♞', name: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Promote Your Pawn
        </h2>
        
        <div className="grid grid-cols-4 gap-4">
          {pieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onSelect(piece.type)}
              className="group relative bg-white/5 hover:bg-purple-600/30 border-2 border-white/10 hover:border-purple-500 rounded-xl p-6 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/20"
            >
              <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">
                {piece.symbol}
              </div>
              <p className="text-white/80 text-sm font-medium">{piece.name}</p>
            </button>
          ))}
        </div>

        <p className="text-white/40 text-sm text-center mt-6">
          Click on a piece to promote
        </p>
      </div>
    </div>
  );
}

export default PromotionModal;
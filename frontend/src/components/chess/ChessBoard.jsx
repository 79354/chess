import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/Board.css";
import RatingChangeDisplay from "./RatingChangeDisplay";

function ChessBoard({ gameState, onMove, isSpectator, playerColor, getValidMoves }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [pieceSet, setPieceSet] = useState('cburnett');
  const [boardTheme, setBoardTheme] = useState('brown');
  const boardRef = useRef(null);

  const files = playerColor === "black" 
    ? ["h", "g", "f", "e", "d", "c", "b", "a"]
    : ["a", "b", "c", "d", "e", "f", "g", "h"];
  
  const ranks = playerColor === "black" 
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : [8, 7, 6, 5, 4, 3, 2, 1];

  useEffect(() => {
    if (gameState?.lastMove) {
      setLastMove(gameState.lastMove);
    }
  }, [gameState]);

  useEffect(() => {
    // Prevent scrolling during game
    const preventScroll = (e) => {
      if (selectedSquare || validMoves.length > 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
    };
  }, [selectedSquare, validMoves]);

  const handleSquareClick = (file, rank) => {
    if (isSpectator || gameState?.status !== 'ongoing') return;

    const square = `${file}${rank}`;
    const piece = gameState?.board?.[square];

    if (selectedSquare) {
      if (validMoves.includes(square)) {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        setValidMoves([]);
      } else if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        const moves = getValidMoves ? getValidMoves(square) : [];
        setValidMoves(moves);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && piece.color === playerColor && gameState.turn === playerColor) {
        setSelectedSquare(square);
        const moves = getValidMoves ? getValidMoves(square) : [];
        setValidMoves(moves);
      }
    }
  };

  const getPieceAtSquare = (file, rank) => {
    const square = `${file}${rank}`;
    return gameState?.board?.[square] || null;
  };

  const isSquareHighlighted = (file, rank) => {
    const square = `${file}${rank}`;
    return validMoves.includes(square);
  };

  const isSquareSelected = (file, rank) => {
    const square = `${file}${rank}`;
    return selectedSquare === square;
  };

  const isSquareLastMove = (file, rank) => {
    const square = `${file}${rank}`;
    return lastMove?.from === square || lastMove?.to === square;
  };

  const isSquareInCheck = (file, rank) => {
    const square = `${file}${rank}`;
    const piece = getPieceAtSquare(file, rank);
    return piece?.type === "king" && gameState?.check === piece.color;
  };

  const getPieceImage = (piece) => {
    const colorCode = piece.color === 'white' ? 'w' : 'b';
    const typeMap = {
      'pawn': 'P', 'knight': 'N', 'bishop': 'B',
      'rook': 'R', 'queen': 'Q', 'king': 'K'
    };
    const typeCode = typeMap[piece.type];
    return `/assets/pieces/${pieceSet}/${colorCode}${typeCode}.svg`;
  };

  return (
    <div className="chess-board-container" ref={boardRef}>
      <div className="chess-board-wrapper">
        <div 
          className="chess-board" 
          style={{
            backgroundImage: `url(/assets/board/${boardTheme}.svg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {ranks.map((rank, rankIdx) =>
            files.map((file, fileIdx) => {
              const isLight = (rankIdx + fileIdx) % 2 === 0;
              const piece = getPieceAtSquare(file, rank);
              const square = `${file}${rank}`;
              const hasPieceOnValidMove = isSquareHighlighted(file, rank) && piece;

              return (
                <div
                  key={square}
                  className={`
                    chess-square
                    ${isLight ? 'light' : 'dark'}
                    ${isSquareSelected(file, rank) ? 'selected' : ''}
                    ${hasPieceOnValidMove ? 'valid-capture' : ''}
                    ${isSquareHighlighted(file, rank) && !piece ? 'valid-move' : ''}
                    ${isSquareLastMove(file, rank) ? 'last-move' : ''}
                    ${isSquareInCheck(file, rank) ? 'in-check' : ''}
                    ${isSpectator ? 'disabled' : ''}
                  `}
                  onClick={() => handleSquareClick(file, rank)}
                >
                  <AnimatePresence>
                    {piece && (
                      <motion.div
                        key={`${square}-${piece.type}-${piece.color}`}
                        className="chess-piece"
                        initial={false}
                        drag={!isSpectator && piece.color === playerColor && gameState.turn === playerColor}
                        dragSnapToOrigin={true}
                        dragElastic={0}
                        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                        whileDrag={{ 
                          scale: 1.2, 
                          zIndex: 1000,
                          cursor: 'grabbing',
                          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))'
                        }}
                        onDragStart={() => {
                          if (piece.color === playerColor && gameState.turn === playerColor) {
                            setSelectedSquare(square);
                            const moves = getValidMoves ? getValidMoves(square) : [];
                            setValidMoves(moves);
                          }
                        }}
                        onDragEnd={(event, info) => {
                          if (!boardRef.current) return;

                          const boardRect = boardRef.current.getBoundingClientRect();
                          const squareSize = boardRect.width / 8;
                          
                          const dropX = event.clientX - boardRect.left;
                          const dropY = event.clientY - boardRect.top;
                          
                          const dropFileIdx = Math.floor(dropX / squareSize);
                          const dropRankIdx = Math.floor(dropY / squareSize);
                          
                          if (dropFileIdx >= 0 && dropFileIdx < 8 && dropRankIdx >= 0 && dropRankIdx < 8) {
                            const targetFile = files[dropFileIdx];
                            const targetRank = ranks[dropRankIdx];
                            const targetSquare = `${targetFile}${targetRank}`;
                            
                            if (validMoves.includes(targetSquare)) {
                              onMove(square, targetSquare);
                            }
                          }
                          
                          setSelectedSquare(null);
                          setValidMoves([]);
                        }}
                        animate={lastMove?.to === square ? {
                          scale: [1, 1.1, 1],
                          transition: { duration: 0.3 }
                        } : {}}
                      >
                        <img 
                          src={getPieceImage(piece)} 
                          alt={`${piece.color} ${piece.type}`}
                          draggable={false}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {fileIdx === 0 && <span className="rank-label">{rank}</span>}
                  {rankIdx === ranks.length - 1 && <span className="file-label">{file}</span>}
                </div>
              );
            })
          )}
        </div>

        {gameState?.status && gameState.status !== "ongoing" && (
          <motion.div 
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="game-over-card"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h2 className="game-over-title">
                {gameState.status === "checkmate" && "Checkmate!"}
                {gameState.status === "stalemate" && "Stalemate!"}
                {gameState.status === "draw" && "Draw!"}
                {gameState.status === "resignation" && "Game Over"}
                {gameState.status === "completed" && "Game Over"}
              </h2>
              <p className="game-over-result">
                {gameState.winner
                  ? `${gameState.winner === "white" ? "White" : "Black"} wins!`
                  : "Game ended in a draw"}
              </p>
              
              {gameState.ratingChanges && <RatingChangeDisplay/>}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Theme Selector - Fixed in Corner */}
      <div 
        className="fixed bottom-6 right-6 z-50 bg-slate-800/90 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-2xl"
        style={{ maxWidth: '200px' }}
      >
        <h4 className="text-white text-sm font-semibold mb-2">Board Theme</h4>
        <select 
          value={boardTheme} 
          onChange={(e) => setBoardTheme(e.target.value)}
          className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 mb-2"
        >
          <option value="brown">Brown</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
        </select>
        
        <h4 className="text-white text-sm font-semibold mb-2">Piece Set</h4>
        <select 
          value={pieceSet} 
          onChange={(e) => setPieceSet(e.target.value)}
          className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2"
        >
          <option value="cburnett">Classic</option>
          <option value="alpha">Alpha</option>
        </select>
      </div>
    </div>
  );
}

export default ChessBoard;
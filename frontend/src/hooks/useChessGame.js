import { useState, useCallback, useEffect } from 'react';
import Board from '../chess/Board';
import MoveValidator from '../chess/MoveValidator';

function useChessGame(initialFen) {
  const [board, setBoard] = useState(new Board(initialFen));
  const [validator, setValidator] = useState(new MoveValidator(board));
  const [gameStatus, setGameStatus] = useState({
    status: 'ongoing',
    check: null,
    winner: null,
  });
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({
    white: [],
    black: [],
  });

  // Update validator when board changes
  useEffect(() => {
    setValidator(new MoveValidator(board));
  }, [board]);

  const makeMove = useCallback((from, to, promotion = null) => {
    if (!validator.isValidMove(from, to, promotion)) {
      return { success: false, error: 'Invalid move' };
    }

    const piece = board.getPiece(from);
    const capturedPiece = board.getPiece(to);

    // Clone and make move
    const newBoard = board.clone();
    validator.makeMove(newBoard, from, to, promotion);

    // Update captured pieces
    if (capturedPiece) {
      setCapturedPieces((prev) => ({
        ...prev,
        [piece.color]: [...prev[piece.color], capturedPiece.type],
      }));
    }

    // Update move history
    const move = {
      from,
      to,
      piece: piece.type,
      captured: capturedPiece?.type,
      promotion,
      fen: newBoard.toFen(),
      timestamp: Date.now(),
    };
    setMoveHistory((prev) => [...prev, move]);

    // Update game status
    const status = validator.getGameStatus();
    setGameStatus(status);

    // Update board
    setBoard(newBoard);

    return {
      success: true,
      move,
      gameStatus: status,
    };
  }, [board, validator]);

  const getValidMoves = useCallback((square) => {
    return validator.getPieceMoves(square);
  }, [validator]);

  const isValidMove = useCallback((from, to, promotion = null) => {
    return validator.isValidMove(from, to, promotion);
  }, [validator]);

  const reset = useCallback((fen = null) => {
    const newBoard = new Board(fen);
    setBoard(newBoard);
    setValidator(new MoveValidator(newBoard));
    setGameStatus({
      status: 'ongoing',
      check: null,
      winner: null,
    });
    setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
  }, []);

  const loadFen = useCallback((fen) => {
    const newBoard = new Board(fen);
    setBoard(newBoard);
    setValidator(new MoveValidator(newBoard));
  }, []);

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return false;

    const newHistory = [...moveHistory];
    newHistory.pop();
    
    if (newHistory.length > 0) {
      const lastMove = newHistory[newHistory.length - 1];
      loadFen(lastMove.fen);
    } else {
      reset();
    }

    setMoveHistory(newHistory);
    return true;
  }, [moveHistory, loadFen, reset]);

  return {
    board,
    gameStatus,
    moveHistory,
    capturedPieces,
    makeMove,
    getValidMoves,
    isValidMove,
    reset,
    loadFen,
    undoMove,
  };
}

export default useChessGame;
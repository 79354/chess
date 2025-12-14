import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useWebSocket from '../services/socketService';

import ChessBoard from '../components/chess/ChessBoard';
import GameClock from '../components/chess/GameClock';
import GameControls from '../components/chess/GameControls';
import MoveHistory from '../components/chess/MoveHistory';
import CapturedPieces from '../components/chess/CapturedPieces';
import ChatBox from '../components/chess/ChatBox';
import PromotionModal from '../components/chess/PromotionModal';

import Board from '../chess/Board';
import MoveValidator from '../chess/MoveValidator';

function Game() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connectionError, setConnectionError] = useState(null);

  // Game state
  const [board, setBoard] = useState(new Board());
  const [validator, setValidator] = useState(new MoveValidator(board));
  const [gameState, setGameState] = useState({
    status: 'ongoing',
    turn: 'white',
    check: null,
    winner: null,
  });

  // Player info
  const [whitePlayer, setWhitePlayer] = useState(null);
  const [blackPlayer, setBlackPlayer] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);

  // Timers
  const [whiteTime, setWhiteTime] = useState(300000);
  const [blackTime, setBlackTime] = useState(300000);
  const [timeIncrement, setTimeIncrement] = useState(0);

  // Move history
  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });

  // UI state
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [error, setError] = useState(null);
  const [chatMessageHandler, setChatMessageHandler] = useState(null);

  // WebSocket connection
  const { isConnected, lastMessage, send, error: wsError } = useWebSocket(`/ws/game/${gameId}/`, {
    onOpen: () => {
      console.log('WebSocket connected, joining game...');
      setConnectionError(null);
      send({ type: 'join_game' });
    },
    onMessage: (data) => {
      handleWebSocketMessage(data);
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
      setConnectionError('Connection failed. Please check your internet.');
    },
    onClose: (event) => {
      if (event.code === 1008 || event.code === 4001) {
        setConnectionError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    }
  });

  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message received:', data.type);
    
    switch (data.type) {
      case 'game_state':
        initializeGame(data);
        break;

      case 'move_made':
        handleOpponentMove(data);
        break;

      case 'clock_sync':
        setWhiteTime(data.white_time);
        setBlackTime(data.black_time);
        break;

      case 'state_snapshot':
        applyStateSnapshot(data);
        break;

      case 'game_ended':
        handleGameEnd(data);
        break;

      case 'chat_message':
        if (chatMessageHandler) {
          chatMessageHandler(data);
        }
        break;

      case 'error':
        console.error('Game error:', data.message);
        setError(data.message);
        // Rollback optimistic update on error
        if (moves.length > 0 && moves[moves.length - 1].optimistic) {
          rollbackOptimisticMove();
        }
        break;
        
      default:
        console.warn('Unknown message type:', data.type);
    }
  }, [chatMessageHandler, moves]);

  const initializeGame = (data) => {
    console.log('Initializing game with data:', data);
    
    // Set players
    setWhitePlayer(data.white_player);
    setBlackPlayer(data.black_player);

    // Determine player color
    if (user?.id === data.white_player?.id) {
      setPlayerColor('white');
      setIsSpectator(false);
    } else if (user?.id === data.black_player?.id) {
      setPlayerColor('black');
      setIsSpectator(false);
    } else {
      setIsSpectator(true);
      setPlayerColor('white');
    }

    // Load board from FEN
    const newBoard = new Board(data.fen);
    setBoard(newBoard);
    setValidator(new MoveValidator(newBoard));

    // Set time control
    setWhiteTime(data.white_time);
    setBlackTime(data.black_time);
    setTimeIncrement(data.increment);

    // Load move history
    setMoves(data.moves || []);
    setCurrentMoveIndex((data.moves?.length || 1) - 1);

    // Set game state
    setGameState({
      status: data.status,
      turn: data.current_turn || newBoard.turn,
      check: data.check,
      winner: data.winner,
    });
  };

  const handleMove = (from, to) => {
    if (isSpectator) return;
    if (gameState.status !== 'ongoing') return;
    if (board.turn !== playerColor) return;

    const piece = board.getPiece(from);
    if (!piece || piece.color !== playerColor) return;

    // Check for pawn promotion
    if (piece.type === 'pawn') {
      const toCoord = board.squareToCoordinate(to);
      const promotionRank = piece.color === 'white' ? 7 : 0;
      
      if (toCoord.rank === promotionRank) {
        setPendingMove({ from, to });
        setShowPromotionModal(true);
        return;
      }
    }

    executeMove(from, to, null);
  };

  const handlePromotion = (promotionPiece) => {
    setShowPromotionModal(false);
    if (pendingMove) {
      executeMove(pendingMove.from, pendingMove.to, promotionPiece);
      setPendingMove(null);
    }
  };

  const executeMove = (from, to, promotion) => {
    // OPTIMISTIC UPDATE - Show move immediately for instant feedback
    const tempBoard = board.clone();
    const piece = tempBoard.getPiece(from);
    
    if (!piece) return;
    
    if (promotion && piece.type === 'pawn') {
      piece.type = promotion;
    }
    
    const capturedPiece = tempBoard.getPiece(to);
    
    // Make the move on temp board
    tempBoard.board[to] = piece;
    delete tempBoard.board[from];
    tempBoard.turn = tempBoard.turn === 'white' ? 'black' : 'white';
    
    // Update UI immediately (optimistic)
    setBoard(tempBoard);
    setValidator(new MoveValidator(tempBoard));
    
    // Add to move history with optimistic flag
    const tempMove = {
      from,
      to,
      piece: piece.type,
      captured: capturedPiece?.type,
      notation: `${from}-${to}`,
      color: board.turn,
      optimistic: true,  // Flag for rollback if server rejects
      timestamp: Date.now(),
    };
    
    setMoves(prev => [...prev, tempMove]);
    setCurrentMoveIndex(prev => prev + 1);
    
    // Update captured pieces optimistically
    if (capturedPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        [board.turn]: [...prev[board.turn], capturedPiece.type],
      }));
    }
    
    // Send to server
    send({
      type: 'move',
      payload: { from, to, promotion, timestamp: Date.now() },
    });
  };

const handleOpponentMove = useCallback((data) => {
  console.log('Move event received:', data);
  
  const moveData = data.move;
  
  if (!moveData) {
    console.error('No move data in event:', data);
    return;
  }
  
  // CRITICAL: Update board from FEN (authoritative)
  if (moveData.fen) {
    const newBoard = new Board(moveData.fen);
    setBoard(newBoard);
    setValidator(new MoveValidator(newBoard));
  }
  
  // Remove optimistic moves and add confirmed move
  setMoves(prev => {
    const confirmed = prev.filter(m => !m.optimistic);
    
    const serverMove = {
      from: moveData.from,
      to: moveData.to,
      piece: moveData.piece,
      captured: moveData.captured,
      notation: moveData.notation,
      color: moveData.color,
      timestamp: moveData.timestamp || Date.now(),
      sequence: moveData.sequence,
    };
    
    return [...confirmed, serverMove];
  });
  
  setCurrentMoveIndex(prev => {
    const confirmedCount = moves.filter(m => !m.optimistic).length;
    return confirmedCount;
  });

  // Update captured pieces
  if (moveData.captured) {
    setCapturedPieces(prev => ({
      ...prev,
      [moveData.color]: [...prev[moveData.color], moveData.captured],
    }));
  }

  // Update clock times
  if (data.white_time !== undefined) setWhiteTime(data.white_time);
  if (data.black_time !== undefined) setBlackTime(data.black_time);

  // Update game state
  setGameState(prev => ({
    ...prev,
    status: moveData.status || prev.status,
    turn: board.turn,
    check: moveData.is_check ? board.turn : null,
    winner: moveData.winner || prev.winner,
    lastMove: { from: moveData.from, to: moveData.to },
  }));
}, [board, moves]);

  const rollbackOptimisticMove = () => {
    // Remove last optimistic move and restore board state
    setMoves(prev => prev.filter(m => !m.optimistic));
    
    // Reload board from last confirmed move
    // In a production app, you'd store FEN snapshots
    // For now, we'll request current state from server
    send({ type: 'join_game' });
  };

  const handleMoveClick = (index) => {
    send({
      type: 'jump_to_move',
      payload: {
        move_index: index,
      },
    });
  };

  const applyStateSnapshot = (data) => {
    const newBoard = new Board(data.fen);
    setBoard(newBoard);
    setValidator(new MoveValidator(newBoard));
    
    setWhiteTime(data.white_time);
    setBlackTime(data.black_time);
    setCurrentMoveIndex(data.move_index);
    
    setGameState(prev => ({
      ...prev,
      turn: newBoard.turn,
      check: data.check,
      lastMove: data.last_move,
    }));
  };

  const handleGameEnd = (data) => {
    setGameState({
      status: data.status,
      turn: board.turn,
      winner: data.winner,
      reason: data.reason,
    });
  };

  const handleResign = () => {
    send({ type: 'resign' });
  };

  const handleOfferDraw = () => {
    send({ type: 'offer_draw' });
  };

  const handleRequestTakeback = () => {
    send({ type: 'request_takeback' });
  };

  const getValidMoves = (square) => {
    return validator.getPieceMoves(square);
  };

  const registerChatHandler = (handler) => {
    setChatMessageHandler(() => handler);
  };

  return (
    <div className="container mx-auto max-w-7xl h-[calc(100vh-150px)]">
      {(connectionError || wsError) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-600">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <div className="flex-1">
                <p className="font-semibold">Connection Error</p>
                <p className="text-sm text-white/90">{connectionError || wsError}</p>
              </div>
              <button 
                onClick={() => {
                  setConnectionError(null);
                  window.location.reload();
                }}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed top-20 right-6 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
        </div>
      )}

      {!isConnected && !connectionError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-medium">Reconnecting to game...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-4 h-full">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <GameClock
            initialTime={playerColor === 'white' ? blackTime : whiteTime}
            increment={timeIncrement}
            isActive={gameState.status === 'ongoing' && gameState.turn !== playerColor}
            color={playerColor === 'white' ? 'black' : 'white'}
            playerName={playerColor === 'white' ? blackPlayer?.username : whitePlayer?.username}
            playerRating={playerColor === 'white' ? blackPlayer?.rating : whitePlayer?.rating}
          />

          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <CapturedPieces
              capturedPieces={capturedPieces}
              color={playerColor === 'white' ? 'black' : 'white'}
            />
          </div>

          <GameControls
            isSpectator={isSpectator}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onRequestTakeback={handleRequestTakeback}
            gameStatus={gameState.status}
          />
        </div>

        {/* Center - Board */}
        <div className="flex items-center justify-center min-h-0 h-full">
          <div className="w-full h-full max-w-[min(90vh,90vw)] max-h-[min(90vh,90vw)]">
            <ChessBoard
              gameState={{
                board: board.board,
                turn: board.turn,
                check: gameState.check,
                status: gameState.status,
                winner: gameState.winner,
                lastMove: moves[moves.length - 1],
              }}
              onMove={handleMove}
              isSpectator={isSpectator}
              playerColor={playerColor || 'white'}
              getValidMoves={getValidMoves}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <GameClock
            initialTime={playerColor === 'white' ? whiteTime : blackTime}
            increment={timeIncrement}
            isActive={gameState.status === 'ongoing' && gameState.turn === playerColor}
            color={playerColor || 'white'}
            playerName={playerColor === 'white' ? whitePlayer?.username : blackPlayer?.username}
            playerRating={playerColor === 'white' ? whitePlayer?.rating : blackPlayer?.rating}
          />

          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <CapturedPieces
              capturedPieces={capturedPieces}
              color={playerColor || 'white'}
            />
          </div>

          <MoveHistory
            moves={moves.filter(m => !m.optimistic)}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={handleMoveClick}
          />

          <div className="h-64">
            <ChatBox
              gameId={gameId}
              isPlayerChat={!isSpectator}
              currentUser={user}
              websocketSend={send}
              onMessage={registerChatHandler}
            />
          </div>
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showPromotionModal}
        color={playerColor}
        onSelect={handlePromotion}
      />
    </div>
  );
}

export default Game;
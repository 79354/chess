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
  const [whiteTime, setWhiteTime] = useState(300000); // 5 minutes in ms
  const [blackTime, setBlackTime] = useState(300000);
  const [timeIncrement, setTimeIncrement] = useState(0);

  // Move history
  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });

  // UI state
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);

  // WebSocket connection
  const { isConnected, lastMessage, send } = useWebSocket(`/ws/game/${gameId}/`, {
    onOpen: () => {
      // Request game state
      send({ action: 'join_game' });
    },
    onMessage: (data) => {
      handleWebSocketMessage(data);
    },
  });

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'game_state':
        initializeGame(data);
        break;

      case 'move_made':
        handleOpponentMove(data);
        break;

      case 'time_update':
        setWhiteTime(data.white_time);
        setBlackTime(data.black_time);
        break;

      case 'game_ended':
        handleGameEnd(data);
        break;

      case 'draw_offered':
        // Show draw offer notification
        break;

      case 'takeback_requested':
        // Show takeback request notification
        break;

      case 'error':
        console.error('Game error:', data.message);
        break;
    }
  }, [board, validator]);

  const initializeGame = (data) => {
    // Set players
    setWhitePlayer(data.white_player);
    setBlackPlayer(data.black_player);

    // Determine player color
    if (user?.id === data.white_player?.id) {
      setPlayerColor('white');
    } else if (user?.id === data.black_player?.id) {
      setPlayerColor('black');
    } else {
      setIsSpectator(true);
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
    setCurrentMoveIndex(data.moves?.length - 1 || -1);

    // Set game state
    setGameState({
      status: data.status,
      turn: newBoard.turn,
      check: data.check,
      winner: data.winner,
    });
  };

  const handleOpponentMove = (data) => {
    // Update board
    const newBoard = new Board(data.fen);
    setBoard(newBoard);
    setValidator(new MoveValidator(newBoard));

    // Add move to history
    setMoves(prev => [...prev, data.move]);
    setCurrentMoveIndex(prev => prev + 1);

    // Update captured pieces
    if (data.move.captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [data.move.color]: [...prev[data.move.color], data.move.captured],
      }));
    }

    // Update game state
    const status = validator.getGameStatus();
    setGameState({
      status: status.status,
      turn: newBoard.turn,
      check: status.check,
      winner: status.winner,
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
    if (!validator.isValidMove(from, to, promotion)) {
      console.log('Invalid move');
      return;
    }

    // Send move to server
    send({
      action: 'make_move',
      from,
      to,
      promotion,
    });
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
    send({ action: 'resign' });
  };

  const handleOfferDraw = () => {
    send({ action: 'offer_draw' });
  };

  const handleRequestTakeback = () => {
    send({ action: 'request_takeback' });
  };

  const getValidMoves = (square) => {
    return validator.getPieceMoves(square);
  };

  const handleMoveClick = (index) => {
    // Navigate through move history
    setCurrentMoveIndex(index);
    // TODO: Update board to show position at that move
  };

  return (
    <div className="container mx-auto max-w-7xl h-[calc(100vh-150px)]">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr_350px] gap-6 h-full">
        {/* Left Sidebar - Player Info & Controls */}
        <div className="space-y-6">
          {/* Opponent Clock */}
          <GameClock
            initialTime={playerColor === 'white' ? blackTime : whiteTime}
            increment={timeIncrement}
            isActive={
              gameState.status === 'ongoing' &&
              gameState.turn !== playerColor
            }
            color={playerColor === 'white' ? 'black' : 'white'}
            playerName={
              playerColor === 'white' ? blackPlayer?.username : whitePlayer?.username
            }
            playerRating={
              playerColor === 'white' ? blackPlayer?.rating : whitePlayer?.rating
            }
          />

          {/* Captured Pieces (Opponent) */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <CapturedPieces
              capturedPieces={capturedPieces}
              color={playerColor === 'white' ? 'black' : 'white'}
            />
          </div>

          {/* Game Controls */}
          <GameControls
            isSpectator={isSpectator}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onRequestTakeback={handleRequestTakeback}
            gameStatus={gameState.status}
          />
        </div>

        {/* Center - Chess Board */}
        <div className="flex flex-col items-center justify-center">
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

        {/* Right Sidebar - Move History & Chat */}
        <div className="space-y-6">
          {/* Player Clock */}
          <GameClock
            initialTime={playerColor === 'white' ? whiteTime : blackTime}
            increment={timeIncrement}
            isActive={
              gameState.status === 'ongoing' &&
              gameState.turn === playerColor
            }
            color={playerColor || 'white'}
            playerName={
              playerColor === 'white' ? whitePlayer?.username : blackPlayer?.username
            }
            playerRating={
              playerColor === 'white' ? whitePlayer?.rating : blackPlayer?.rating
            }
          />

          {/* Captured Pieces (Player) */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <CapturedPieces
              capturedPieces={capturedPieces}
              color={playerColor || 'white'}
            />
          </div>

          {/* Move History */}
          <MoveHistory
            moves={moves}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={handleMoveClick}
          />

          {/* Chat */}
          <div className="h-64">
            <ChatBox
              gameId={gameId}
              isPlayerChat={!isSpectator}
              currentUser={user}
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
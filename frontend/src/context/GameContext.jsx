import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createGame = useCallback(async (opponentId, timeControl) => {
    setLoading(true);
    try {
      const response = await api.post('/game/create', {
        opponent_id: opponentId,
        time_control: timeControl,
      });
      setCurrentGame(response);
      navigate(`/game/${response.game_id}`);
      return { success: true, game: response };
    } catch (error) {
      console.error('Failed to create game:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadGame = useCallback(async (gameId) => {
    setLoading(true);
    try {
      const response = await api.get(`/game/games/${gameId}`);
      setCurrentGame(response);
      return { success: true, game: response };
    } catch (error) {
      console.error('Failed to load game:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserGames = useCallback(async (username) => {
    setLoading(true);
    try {
      const response = await api.get(`/game/user-games/${username}`);
      setGameHistory(response);
      return { success: true, games: response };
    } catch (error) {
      console.error('Failed to load user games:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getGameMoves = useCallback(async (gameId) => {
    try {
      const response = await api.get(`/game/games/${gameId}/moves`);
      return { success: true, moves: response };
    } catch (error) {
      console.error('Failed to get game moves:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    currentGame,
    gameHistory,
    loading,
    createGame,
    loadGame,
    loadUserGames,
    getGameMoves,
    setCurrentGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export default GameContext;
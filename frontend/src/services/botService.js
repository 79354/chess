/**
 * Chess Bot API Service
 * Handles all communication with the chess bot microservice
 */

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:8001';

class BotService {
  /**
   * Create a new bot game
   * @param {string} playerColor - 'white' or 'black'
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   * @returns {Promise<{success: boolean, game_id: string, starting_fen: string, bot_first_move: string}>}
   */
  async createGame(playerColor = 'white', difficulty = 'medium') {
    try {
      const response = await fetch(`${BOT_API_URL}/api/bot/games/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          player_color: playerColor, 
          difficulty: difficulty 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create game');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create game error:', error);
      throw error;
    }
  }

  /**
   * Make a move and get bot response
   * @param {string} gameId - Game session ID
   * @param {string} move - Move in UCI format (e.g., "e2e4")
   * @returns {Promise<{success: boolean, bot_move: string, new_fen: string, game_over: boolean}>}
   */
  async makeMove(gameId, move) {
    try {
      const response = await fetch(`${BOT_API_URL}/api/bot/games/${gameId}/move/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Move failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Make move error:', error);
      throw error;
    }
  }

  /**
   * Get game state
   * @param {string} gameId - Game session ID
   * @returns {Promise<{success: boolean, fen: string, moves: string[]}>}
   */
  async getGame(gameId) {
    try {
      const response = await fetch(`${BOT_API_URL}/api/bot/games/${gameId}/`);
      
      if (!response.ok) {
        throw new Error('Game not found');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get game error:', error);
      throw error;
    }
  }

  /**
   * Delete game session
   * @param {string} gameId - Game session ID
   */
  async deleteGame(gameId) {
    try {
      await fetch(`${BOT_API_URL}/api/bot/games/${gameId}/delete/`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete game error:', error);
    }
  }

  /**
   * Check bot service health
   * @returns {Promise<{status: string, service: string}>}
   */
  async healthCheck() {
    try {
      const response = await fetch(`${BOT_API_URL}/api/bot/health/`);
      return await response.json();
    } catch (error) {
      console.error('Bot health check failed:', error);
      return { status: 'unavailable', service: 'chess-bot' };
    }
  }

  /**
   * Calculate thinking time based on difficulty
   * @param {string} difficulty - 'easy', 'medium', 'hard', or 'expert'
   * @returns {number} Time in milliseconds
   */
  getThinkingTimeForDifficulty(difficulty) {
    const timeMap = {
      'easy': 500,      // 0.5 seconds
      'medium': 2000,   // 2 seconds
      'hard': 5000,     // 5 seconds
      'expert': 10000   // 10 seconds
    };
    return timeMap[difficulty] || 2000;
  }

  /**
   * Get difficulty label and description
   * @param {string} difficulty
   * @returns {{label: string, time: string, icon: string, description: string}}
   */
  getDifficultyInfo(difficulty) {
    const info = {
      'easy': {
        label: 'Easy',
        time: '0.5s',
        icon: '😊',
        description: 'Great for beginners'
      },
      'medium': {
        label: 'Medium',
        time: '2s',
        icon: '🤔',
        description: 'Good challenge for intermediate players'
      },
      'hard': {
        label: 'Hard',
        time: '5s',
        icon: '😈',
        description: 'Challenging for advanced players'
      },
      'expert': {
        label: 'Expert',
        time: '10s',
        icon: '🔥',
        description: 'Maximum difficulty'
      }
    };
    return info[difficulty] || info['medium'];
  }

  /**
   * Get AI evaluation explanation
   * @param {number} evaluation - Centipawn evaluation
   * @returns {string}
   */
  getEvaluationDescription(evaluation) {
    const abs = Math.abs(evaluation);
    
    if (abs < 50) return 'Equal position';
    if (abs < 150) return 'Slight advantage';
    if (abs < 300) return 'Clear advantage';
    if (abs < 500) return 'Winning advantage';
    if (abs < 1000) return 'Decisive advantage';
    return 'Completely winning';
  }
}

export default new BotService();

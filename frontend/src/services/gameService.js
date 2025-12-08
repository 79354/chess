import api from './api';

class GameService {
  async createGame(opponentId, timeControl) {
    try {
      const response = await api.post('/game/create/', {
        opponent_id: opponentId,
        time_control: timeControl,
      });
      return { success: true, game: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGame(gameId) {
    try {
      const response = await api.get(`/game/games/${gameId}/`);
      return { success: true, game: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGameMoves(gameId) {
    try {
      const response = await api.get(`/game/games/${gameId}/moves/`);
      return { success: true, moves: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserGames(username, params = {}) {
    try {
      const response = await api.get(`/game/user-games/${username}/`, { params });
      return { success: true, games: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getOngoingGames(params = {}) {
    try {
      const response = await api.get('/game/games/', {
        params: { status: 'ongoing', ...params }
      });
      return { success: true, games: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resign(gameId) {
    try {
      const response = await api.post(`/game/games/${gameId}/resign/`);
      return { success: true, game: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async offerDraw(gameId) {
    try {
      const response = await api.post(`/game/games/${gameId}/offer-draw/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async acceptDraw(gameId) {
    try {
      const response = await api.post(`/game/games/${gameId}/accept-draw/`);
      return { success: true, game: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async requestTakeback(gameId) {
    try {
      const response = await api.post(`/game/games/${gameId}/request-takeback/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new GameService();
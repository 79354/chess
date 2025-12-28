import api from './api';

const tournamentService = {
  // List tournaments with filters
  getTournaments: async (status = 'all') => {
    try {
      const params = status !== 'all' ? { status } : {};
      const response = await api.get('/tournaments/', { params });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get single tournament details
  getTournament: async (tournamentId) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create a new tournament
  createTournament: async (tournamentData) => {
    try {
      const response = await api.post('/tournaments/', tournamentData);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Join a tournament
  joinTournament: async (tournamentId) => {
    try {
      const response = await api.post(`/tournaments/${tournamentId}/join/`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Leave a tournament
  leaveTournament: async (tournamentId) => {
    try {
      const response = await api.post(`/tournaments/${tournamentId}/leave/`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get tournament matches
  getMatches: async (tournamentId) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/matches/`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get tournament standings
  getStandings: async (tournamentId) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/standings/`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Search tournaments
  searchTournaments: async (query) => {
    try {
      const response = await api.get('/tournaments/', { params: { search: query } });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default tournamentService;
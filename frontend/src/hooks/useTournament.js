import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function useTournament(tournamentId) {
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTournament = useCallback(async () => {
    if (!tournamentId) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API endpoints when tournament service is ready
      const tournamentData = await api.get(`/tournaments/${tournamentId}/`);
      const participantsData = await api.get(`/tournaments/${tournamentId}/participants/`);
      const standingsData = await api.get(`/tournaments/${tournamentId}/standings/`);
      const matchesData = await api.get(`/tournaments/${tournamentId}/matches/`);

      setTournament(tournamentData);
      setParticipants(participantsData);
      setStandings(standingsData);
      setMatches(matchesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const joinTournament = useCallback(async () => {
    try {
      await api.post(`/tournaments/${tournamentId}/join/`);
      await fetchTournament();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [tournamentId, fetchTournament]);

  const leaveTournament = useCallback(async () => {
    try {
      await api.post(`/tournaments/${tournamentId}/leave/`);
      await fetchTournament();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [tournamentId, fetchTournament]);

  return {
    tournament,
    participants,
    standings,
    matches,
    loading,
    error,
    joinTournament,
    leaveTournament,
    refresh: fetchTournament,
  };
}

export default useTournament;
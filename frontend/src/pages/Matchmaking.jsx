import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Users, X, Loader2 } from 'lucide-react';
import useWebSocket from '../services/socketService';
import { useAuth } from '../context/AuthContext';

function Matchmaking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const timeControl = searchParams.get('time') || '5+0';
  
  const [queuePosition, setQueuePosition] = useState(null);
  const [playersInQueue, setPlayersInQueue] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(30);
  const [searching, setSearching] = useState(true);

  const { isConnected, lastMessage, send, disconnect } = useWebSocket('/ws/matchmaking/', {
    onOpen: () => {
      // Join matchmaking queue
      send({
        action: 'join_queue',
        time_control: timeControl,
        user_id: user?.id,
        rating: user?.rating || 1200,
      });
    },
    onMessage: (data) => {
      handleWebSocketMessage(data);
    },
  });

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'queue_joined':
        setQueuePosition(data.position);
        setPlayersInQueue(data.total_players);
        break;
        
      case 'queue_update':
        setQueuePosition(data.position);
        setPlayersInQueue(data.total_players);
        setEstimatedWait(data.estimated_wait);
        break;
        
      case 'match_found':
        setSearching(false);
        // Navigate to game page
        setTimeout(() => {
          navigate(`/game/${data.game_id}`);
        }, 1500);
        break;
        
      case 'error':
        console.error('Matchmaking error:', data.message);
        break;
    }
  };

  const handleCancel = () => {
    send({ action: 'leave_queue' });
    disconnect();
    navigate('/');
  };

  useEffect(() => {
    return () => {
      if (isConnected) {
        send({ action: 'leave_queue' });
        disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-12 shadow-2xl">
          {/* Status */}
          <div className="text-center mb-8">
            {searching ? (
              <>
                <div className="relative w-32 h-32 mx-auto mb-6">
                  {/* Animated Search Circle */}
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="w-12 h-12 text-purple-400" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">Finding Opponent...</h2>
                <p className="text-white/60 text-lg">
                  Searching for a player with similar rating
                </p>
              </>
            ) : (
              <>
                <div className="w-32 h-32 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <div className="text-6xl">✓</div>
                </div>
                
                <h2 className="text-3xl font-bold text-green-400 mb-2">Match Found!</h2>
                <p className="text-white/60 text-lg">
                  Connecting to game...
                </p>
              </>
            )}
          </div>

          {searching && (
            <>
              {/* Time Control */}
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Time Control</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold text-white">{timeControl}</span>
                  </div>
                </div>
              </div>

              {/* Queue Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {queuePosition !== null ? `#${queuePosition}` : '—'}
                  </div>
                  <div className="text-white/60 text-sm">Position in Queue</div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1 flex items-center justify-center">
                    <Users className="w-6 h-6 mr-2" />
                    {playersInQueue}
                  </div>
                  <div className="text-white/60 text-sm">Players Searching</div>
                </div>
              </div>

              {/* Estimated Wait Time */}
              <div className="text-center mb-6">
                <p className="text-white/60 text-sm mb-2">Estimated wait time</p>
                <p className="text-white text-xl font-semibold">
                  {estimatedWait < 60 ? `${estimatedWait}s` : `${Math.floor(estimatedWait / 60)}m`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-8">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg py-3 font-semibold transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Cancel Search</span>
              </button>
            </>
          )}

          {!searching && (
            <div className="flex items-center justify-center space-x-2 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting to game...</span>
            </div>
          )}
        </div>

        {/* Tips */}
        {searching && (
          <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-semibold mb-3">💡 While you wait...</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Make sure you're in a quiet environment</li>
              <li>• Check your internet connection</li>
              <li>• Review your opening repertoire</li>
              <li>• Stay calm and focused</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Matchmaking;
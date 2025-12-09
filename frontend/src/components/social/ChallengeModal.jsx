import React, { useState } from 'react';
import { X, Clock, Zap } from 'lucide-react';

function ChallengeModal({ isOpen, onClose, friend, onSendChallenge }) {
  const [selectedTime, setSelectedTime] = useState('5+0');
  const [sending, setSending] = useState(false);

  const timeControls = [
    { value: '1+0', label: '1 min', type: 'Bullet' },
    { value: '2+1', label: '2|1', type: 'Bullet' },
    { value: '3+0', label: '3 min', type: 'Blitz' },
    { value: '3+2', label: '3|2', type: 'Blitz' },
    { value: '5+0', label: '5 min', type: 'Blitz' },
    { value: '5+3', label: '5|3', type: 'Blitz' },
    { value: '10+0', label: '10 min', type: 'Rapid' },
    { value: '10+5', label: '10|5', type: 'Rapid' },
    { value: '15+10', label: '15|10', type: 'Rapid' },
  ];

  const handleSend = async () => {
    setSending(true);
    try {
      await onSendChallenge(friend.id, selectedTime);
      onClose();
    } catch (error) {
      console.error('Failed to send challenge:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !friend) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Challenge Friend</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Friend Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
              {friend.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{friend.username}</p>
              <p className="text-white/60 text-sm">{friend.rating} rating</p>
            </div>
          </div>
        </div>

        {/* Time Control Selection */}
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Select Time Control
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {timeControls.map((tc) => (
              <button
                key={tc.value}
                onClick={() => setSelectedTime(tc.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTime === tc.value
                    ? 'border-purple-500 bg-purple-600/30 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="text-lg font-bold">{tc.label}</div>
                <div className="text-xs opacity-70">{tc.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
          <div className="flex items-start space-x-2">
            <Zap className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-200 text-sm">
              Your challenge will expire in 2 minutes if not accepted.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallengeModal;
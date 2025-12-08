import React from 'react';
import { MessageCircle, Swords, UserMinus } from 'lucide-react';

function FriendsList({ friends, onChallenge, onMessage, onRemove }) {
  if (!friends || friends.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        No friends yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {friend.username[0].toUpperCase()}
              </div>
              {friend.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold">{friend.username}</p>
              <p className="text-white/60 text-sm">{friend.rating} rating</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onMessage(friend)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChallenge(friend)}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <Swords className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove(friend)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FriendsList;
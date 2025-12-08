import React from 'react';
import { Trophy, Target, TrendingUp, Zap } from 'lucide-react';

function ProfileStats({ user }) {
  const stats = [
    {
      icon: Trophy,
      label: 'Rating',
      value: user?.rating || 1200,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      icon: Target,
      label: 'Games Played',
      value: user?.games_played || 0,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      icon: TrendingUp,
      label: 'Win Rate',
      value: `${user?.win_rate || 0}%`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      icon: Zap,
      label: 'Best Streak',
      value: '7', // This would come from backend
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4"
          >
            <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <Icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-white/60 text-sm mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}

export default ProfileStats;
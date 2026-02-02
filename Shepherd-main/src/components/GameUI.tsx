import { Plus, User, Settings } from 'lucide-react';

interface GameUIProps {
  sheepCount: number;
  onAddSheep: () => void;
}

export function GameUI({ sheepCount, onAddSheep }: GameUIProps) {
  const tasks = [
    {
      id: 1,
      name: '林風雯',
      subtitle: '新朋友',
      progress: 0,
      color: '#f4a460',
    },
    {
      id: 2,
      name: '顯示暱名兮...',
      subtitle: '真厲害',
      progress: 30,
      color: '#faf0e6',
    },
    {
      id: 3,
      name: '郭默涵',
      subtitle: '真棒',
      progress: 10,
      color: '#d3d3d3',
    },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm z-10">
        <div className="flex items-center justify-between px-4 pt-12">
          <button className="p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="font-semibold text-gray-900">sheep-care-game</div>
            <div className="text-xs text-gray-500">https://scratch-murex.vercel.app</div>
          </div>
          
          <button className="p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="absolute top-28 left-4 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500" />
        <span className="text-sm font-medium text-blue-600">Shepherd</span>
      </div>

      {/* Settings Button */}
      <div className="absolute top-28 right-4 z-10">
        <button className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm hover:bg-blue-200 transition-colors">
          <Settings className="w-6 h-6 text-blue-500" />
        </button>
      </div>

      {/* Sheep Counter */}
      <div className="absolute bottom-52 left-4 z-10">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-full px-6 py-3 shadow-lg flex items-center gap-2">
          <span className="text-white font-bold text-lg">{sheepCount}隻</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <circle cx="15" cy="12" r="3" />
            <circle cx="10" cy="10" r="2.5" />
            <circle cx="19" cy="10" r="2" />
            <ellipse cx="14" cy="14" rx="4" ry="3" />
          </svg>
        </div>
      </div>

      {/* Add Sheep Button */}
      <div className="absolute bottom-52 right-4 z-10">
        <button
          onClick={onAddSheep}
          className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full px-6 py-3 shadow-lg flex items-center gap-2 hover:from-blue-500 hover:to-blue-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white font-medium">認領小羊</span>
        </button>
      </div>

      {/* Task Cards */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex-shrink-0 w-[160px] bg-gradient-to-br from-orange-50 to-pink-50 rounded-3xl p-4 shadow-md border-2 border-white"
            >
              {/* Today's Task Badge */}
              {task.id === 1 && (
                <div className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full inline-block mb-2">
                  今日任務
                </div>
              )}
              
              {/* Progress */}
              <div className="flex items-center gap-1 mb-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#e17b77">
                  <path d="M8 2 L9.5 6 L14 6.5 L10.5 9.5 L11.5 14 L8 11.5 L4.5 14 L5.5 9.5 L2 6.5 L6.5 6 Z" />
                </svg>
                <span className="text-sm font-medium">{task.progress}%</span>
              </div>

              {/* Sheep Image */}
              <div className="bg-white rounded-2xl p-3 mb-3 flex items-center justify-center h-20">
                <svg width="50" height="42" viewBox="0 0 60 50">
                  <ellipse cx="30" cy="28" rx="18" ry="15" fill={task.color} />
                  <circle cx="20" cy="25" r="8" fill={task.color} />
                  <circle cx="40" cy="25" r="8" fill={task.color} />
                  <ellipse cx="45" cy="22" rx="8" ry="9" fill="#f5e6d3" />
                  <circle cx="44" cy="21" r="1.5" fill="#2d3436" />
                  <circle cx="49" cy="21" r="1.5" fill="#2d3436" />
                  <rect x="20" y="38" width="4" height="8" rx="2" fill="#f5e6d3" />
                  <rect x="36" y="38" width="4" height="8" rx="2" fill="#f5e6d3" />
                </svg>
              </div>

              {/* Name */}
              <div className="text-center mb-3">
                <div className="font-medium text-gray-900 text-sm truncate">{task.name}</div>
                <div className="text-xs text-gray-500">{task.subtitle}</div>
              </div>

              {/* Action Button */}
              <button className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-full py-2 text-sm font-medium flex items-center justify-center gap-1 hover:from-pink-500 hover:to-pink-600 transition-all">
                <User className="w-4 h-4" />
                <span>為他祈禱</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

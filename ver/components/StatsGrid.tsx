import React from 'react';

// You can use lucide-react or react-icons. 
// Assuming basic text/emoji for simplicity if icons aren't installed, 
// but you can swap these <span>s for <FaUser /> etc.

interface StatItem {
  label: string;
  value: string | number;
  icon?: string; // Emoji or icon name
  color?: string; // 'blue', 'green', 'orange', 'red'
}

interface Props {
  stats: StatItem[];
  loading?: boolean;
}

export default function StatsGrid({ stats, loading }: Props) {
  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading statistics...</div>;
  }

  // Color Maps for styling
  const colorMap: Record<string, string> = {
    blue:   'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    green:  'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
    red:    'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    gray:   'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => {
        const themeClass = colorMap[stat.color || 'blue'];

        return (
          <div 
            key={idx}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
               <span className={`text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                 {stat.label}
               </span>
               <div className={`p-2 rounded-lg ${themeClass}`}>
                 {/* Render icon based on string or fallback */}
                 {stat.icon === 'users' && '👥'}
                 {stat.icon === 'calendar' && '📅'}
                 {stat.icon === 'history' && '📜'}
                 {stat.icon === 'clock' && '⏰'}
                 {stat.icon === 'activity' && '📉'}
                 {stat.icon === 'alert-circle' && '🔴'}
                 {!['users','calendar','history','clock','activity','alert-circle'].includes(stat.icon || '') && (stat.icon || '📊')}
               </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-bold ${themeClass.split(' ')[0]}`}>
                {stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
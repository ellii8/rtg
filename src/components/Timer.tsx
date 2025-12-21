import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  endTime: number | null;
  onExpire?: () => void;
  totalDuration: number;
}

export const Timer: React.FC<TimerProps> = ({ endTime, onExpire, totalDuration }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  // Calculate percentage for progress bar
  const progress = Math.min(100, (timeLeft / totalDuration) * 100);
  
  // Color change based on time
  const colorClass = progress > 50 ? 'bg-green-500' : progress > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center text-xl font-bold text-white">
        <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>Süre</span>
        </div>
        <span className={timeLeft <= 5 ? 'text-red-400 animate-pulse' : ''}>{timeLeft}s</span>
      </div>
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden w-full">
        <div 
            className={`h-full transition-all duration-200 ease-linear ${colorClass}`} 
            style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
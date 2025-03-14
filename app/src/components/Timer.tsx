import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface TimerProps {
  isPlaying: boolean;
}

export const Timer = forwardRef<{ getTime: () => string }, TimerProps>(({ isPlaying }, ref) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useImperativeHandle(ref, () => ({
    getTime: () => formatTime(seconds)
  }));

  return (
    <div className="bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/30 font-mono font-medium shadow-md">
      {formatTime(seconds)}
    </div>
  );
});

export default Timer;
import { useState, useEffect } from 'react';
// Timer component
interface TimerProps {
  isPlaying: boolean;
}

export const Timer: React.FC<TimerProps> = ({ isPlaying }) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-lg font-mono bg-white px-4 py-2 rounded-full shadow-sm">
      {formatTime(timer)}
    </div>
  );
};

export default Timer;
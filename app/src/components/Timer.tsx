import React from 'react';

interface TimerProps {
  time: string;
  className?: string;
}

/**
 * Timer component that displays the current time
 * Timer state is managed by GameContext
 */
export const Timer: React.FC<TimerProps> = ({ 
  time,
  className = ''
}) => {
  return (
    <span className={className}>
      {time}
    </span>
  );
};

export default Timer;
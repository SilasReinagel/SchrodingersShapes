import React from 'react';

type Operator = 'exactly' | 'at_least' | 'at_most' | 'none' | 'is' | 'is_not';

interface OperatorDisplayProps {
  operator: Operator;
  className?: string;
}

/**
 * Maps operators to their display symbols
 */
const operatorSymbols: Record<Operator, string> = {
  exactly: '=',
  at_least: '≥',
  at_most: '≤',
  none: '=',      // Displayed as "= 0×"
  is: '=',
  is_not: '≠',
};

/**
 * OperatorDisplay renders the correct mathematical symbol
 * for a constraint operator
 */
export const OperatorDisplay: React.FC<OperatorDisplayProps> = ({ 
  operator, 
  className = '' 
}) => {
  const symbol = operatorSymbols[operator];
  
  return (
    <span 
      className={`font-mono font-bold ${className}`}
      style={{ color: '#88c9f0' }}
      aria-label={operator.replace('_', ' ')}
    >
      {symbol}
    </span>
  );
};


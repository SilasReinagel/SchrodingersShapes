import { motion } from 'framer-motion';
import { ConstraintDefinition, GameBoard, ShapeNames } from '../../game/types';
import { getConstraintStatus } from '../../game/utils';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface ConstraintsPanelProps {
  constraints: ConstraintDefinition[];
  grid: GameBoard;
}

/**
 * Converts a string to title case (first letter of each word capitalized)
 * @param str The string to convert
 * @returns The string in title case
 */
const toTitleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Pluralizes a word based on count
 * @param word The word to pluralize
 * @param count The count to check against
 * @returns The word, pluralized if needed
 */
const pluralize = (word: string, count: number): string => {
  if (count === 1) {
    return word;
  }
  
  // Handle special cases
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  
  return word + 's';
};

export const ConstraintsPanel: React.FC<ConstraintsPanelProps> = ({ constraints, grid }) => {
  const constraintStatuses = getConstraintStatus(grid, constraints);

  const formatConstraint = (constraint: ConstraintDefinition): string => {
    const { type, rule } = constraint;
    const location = type === 'global' 
      ? 'Whole Board' 
      : `${toTitleCase(type)} ${(constraint.index ?? 0) + 1}`;
    
    const shape = rule.shape !== undefined 
      ? ShapeNames[rule.shape] 
      : 'shapes';
    
    switch (rule.operator) {
      case 'exactly':
        return `${location}: Exactly ${rule.count} ${pluralize(shape, rule.count)}`;
      case 'at_least':
        return `${location}: At least ${rule.count} ${pluralize(shape, rule.count)}`;
      case 'at_most':
        return `${location}: At most ${rule.count} ${pluralize(shape, rule.count)}`;
      case 'none':
        return `${location}: No ${pluralize(shape, 2)}`;
      default:
        return '';
    }
  };

  return (
    <motion.div
      className="w-full lg:w-[400px]"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-lg md:text-xl font-semibold mb-4 bg-gradient-to-r from-shape-circle to-shape-triangle bg-clip-text text-transparent">
        Constraints
      </h2>
      <div className="space-y-1 md:space-y-2">
        {constraints.map((constraint, index) => (
          <motion.div
            key={index}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1
            }}
            className={`inner-panel text-lg md:text-xl flex items-center justify-between ${
              constraintStatuses[index] ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span>{formatConstraint(constraint)}</span>
            {constraintStatuses[index] ? (
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-red-500" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 
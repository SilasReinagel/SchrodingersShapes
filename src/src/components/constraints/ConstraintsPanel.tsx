import { motion } from 'framer-motion';
import { Constraint } from '../../game/types';

interface ConstraintsPanelProps {
  constraints: Constraint[];
}

export const ConstraintsPanel: React.FC<ConstraintsPanelProps> = ({ constraints }) => {
  const formatConstraint = (constraint: Constraint): string => {
    const { type, rule } = constraint;
    const location = type === 'global' 
      ? 'In total' 
      : `In ${type} ${(constraint.index ?? 0) + 1}`;
    const shape = rule.shape ? rule.shape : 'shapes';
    
    switch (rule.operator) {
      case 'exactly':
        return `${location}: Exactly ${rule.count} ${shape}`;
      case 'at_least':
        return `${location}: At least ${rule.count} ${shape}`;
      case 'at_most':
        return `${location}: At most ${rule.count} ${shape}`;
      case 'none':
        return `${location}: No ${shape}`;
      default:
        return '';
    }
  };

  return (
    <motion.div
      className="floating-panel w-full lg:w-[300px]"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-lg md:text-xl font-semibold mb-4 bg-gradient-to-r from-shape-circle to-shape-triangle bg-clip-text text-transparent">
        Constraints
      </h2>
      <div className="space-y-2 md:space-y-3">
        {constraints.map((constraint, index) => (
          <motion.div
            key={index}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1
            }}
            className="inner-panel text-base md:text-lg"
          >
            {formatConstraint(constraint)}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 
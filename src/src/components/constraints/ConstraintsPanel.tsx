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
    <div className="space-y-2 p-4 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Constraints</h2>
      {constraints.map((constraint, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-2 bg-gray-100 rounded-lg"
        >
          {formatConstraint(constraint)}
        </motion.div>
      ))}
    </div>
  );
}; 
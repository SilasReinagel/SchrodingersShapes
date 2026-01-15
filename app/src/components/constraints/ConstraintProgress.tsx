import React from 'react';
import { motion } from 'framer-motion';
import { ConstraintState } from '../../game/types';

interface ConstraintProgressProps {
  constraintStates: ConstraintState[];
}

/**
 * ConstraintProgress displays a progress indicator showing how many constraints are satisfied
 */
export const ConstraintProgress: React.FC<ConstraintProgressProps> = ({ constraintStates }) => {
  const total = constraintStates.length;
  const satisfied = constraintStates.filter(state => state === 'satisfied').length;
  const violated = constraintStates.filter(state => state === 'violated').length;
  const inProgress = constraintStates.filter(state => state === 'in_progress').length;
  
  const percentage = total > 0 ? Math.round((satisfied / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4 w-full"
    >
      {/* Progress Bar Container */}
      <div className="relative w-full h-8 bg-slate-800/50 rounded-lg overflow-hidden border border-cyan-500/30">
        {/* Progress Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-emerald-400/80"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            boxShadow: '0 0 12px rgba(52, 211, 153, 0.5)',
          }}
        />
        
        {/* Violated indicator overlay */}
        {violated > 0 && (
          <motion.div
            className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500/60 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: `${(violated / total) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm font-nunito font-bold">
            <span className="text-cyan-100 drop-shadow-[0_0_4px_rgba(136,201,240,0.8)]">
              {satisfied}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-300">{total}</span>
            <span className="text-slate-400 ml-1">constraints</span>
          </div>
        </div>
      </div>
      
      {/* Status Breakdown */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        {satisfied > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
            <span className="text-emerald-300">{satisfied} satisfied</span>
          </div>
        )}
        {inProgress > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
            <span className="text-amber-300">{inProgress} in progress</span>
          </div>
        )}
        {violated > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_4px_rgba(251,113,133,0.6)]" />
            <span className="text-rose-300">{violated} violated</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};


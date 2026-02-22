import { motion } from 'framer-motion';
import ReactModal from 'react-modal';

interface VictoryModalProps {
  isOpen: boolean;
  time: string;
  onNextLevel: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  time,
  onNextLevel,
}) => {
  return (
    <ReactModal
      isOpen={isOpen}
      className="modal-content"
      overlayClassName="modal-overlay"
      closeTimeoutMS={300}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
        className="relative max-w-md mx-auto rounded-3xl p-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(30, 20, 60, 0.95))',
          boxShadow: `
            0 0 60px rgba(79, 195, 247, 0.4),
            0 25px 50px -12px rgba(0, 0, 0, 0.7),
            inset 0 0 80px rgba(79, 195, 247, 0.1),
            0 0 0 2px rgba(79, 195, 247, 0.5),
            0 0 0 4px rgba(255, 0, 255, 0.3)
          `,
          border: '2px solid rgba(79, 195, 247, 0.4)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Animated glow orbs */}
        <motion.div
          className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-40"
          style={{ background: '#4FC3F7' }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-40"
          style={{ background: '#FFB5BA' }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Title with glow effect */}
        <motion.h2 
          className="relative text-4xl font-fredoka font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span 
            className="relative z-10"
            style={{
              background: 'linear-gradient(135deg, #4FC3F7, #FFB5BA, #FFE5B4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(79, 195, 247, 0.5)',
            }}
          >
            Puzzle Solved!
          </span>
        </motion.h2>
        
        {/* Time display */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className="flex justify-between items-center rounded-xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.15), rgba(107, 70, 193, 0.15))',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              boxShadow: 'inset 0 0 20px rgba(79, 195, 247, 0.1)',
            }}
          >
            <span className="text-cyan-300 font-nunito font-bold text-lg tracking-wide">Time</span>
            <span 
              className="text-4xl font-nunito font-bold tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #4FC3F7, #00D9FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(79, 195, 247, 0.6)',
              }}
            >
              {time}
            </span>
          </div>
        </motion.div>

        {/* Button */}
        <div className="relative z-10">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(79, 195, 247, 0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextLevel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full py-4 px-6 rounded-xl font-fredoka font-bold text-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #4FC3F7, #6B46C1)',
              color: 'white',
              boxShadow: '0 0 20px rgba(79, 195, 247, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(79, 195, 247, 0.5)',
            }}
          >
            Next Level
          </motion.button>
        </div>
      </motion.div>
    </ReactModal>
  );
}; 
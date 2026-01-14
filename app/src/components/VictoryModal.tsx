import { motion } from 'framer-motion';
import ReactModal from 'react-modal';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  moves: number;
  time: string;
  onNextLevel: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  moves,
  time,
  onNextLevel,
}) => {
  const { width, height } = useWindowSize();

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
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
        className="bg-white rounded-3xl p-8 max-w-md mx-auto relative shadow-2xl"
      >
        {isOpen && (
          <Confetti 
            width={width} 
            height={height} 
            recycle={false} 
            numberOfPieces={200}
            gravity={0.3}
            initialVelocityY={-5}
            colors={['#FFB5BA', '#A8D8FF', '#FFE5B4']}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
        )}
        
        <h2 className="text-4xl font-fredoka font-bold mb-8 text-center bg-gradient-to-r from-shape-square via-shape-circle to-shape-triangle bg-clip-text text-transparent">
          Puzzle Solved!
        </h2>
        
        <div className="space-y-6 mb-8">
          <div className="flex justify-between items-center bg-gray-100 rounded-xl p-4">
            <span className="text-gray-800 font-nunito font-bold">Moves</span>
            <span className="text-3xl font-nunito font-bold text-gray-900">
              {moves}
            </span>
          </div>
          <div className="flex justify-between items-center bg-gray-100 rounded-xl p-4">
            <span className="text-gray-800 font-nunito font-bold">Time</span>
            <span className="text-3xl font-nunito font-bold text-gray-900">
              {time}
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextLevel}
            className="w-full py-4 px-6 bg-gradient-to-r from-shape-square via-shape-circle to-shape-triangle text-white rounded-xl font-fredoka font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            Next Level
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-4 px-6 bg-gray-100 text-gray-800 rounded-xl font-fredoka font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Keep Playing
          </motion.button>
        </div>
      </motion.div>
    </ReactModal>
  );
}; 
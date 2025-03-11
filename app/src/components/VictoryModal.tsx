import { motion } from 'framer-motion';
import ReactModal from 'react-modal';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  moves: number;
  time: string;
  onNextPuzzle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  moves,
  time,
  onNextPuzzle,
}) => {
  const { width, height } = useWindowSize();

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      {isOpen && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-8 max-w-md mx-auto relative z-50 shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-shape-square to-shape-circle bg-clip-text text-transparent">
          Puzzle Solved!
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Moves:</span>
            <span className="text-2xl font-semibold">{moves}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Time:</span>
            <span className="text-2xl font-semibold">{time}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onNextPuzzle}
            className="w-full py-3 px-6 bg-gradient-to-r from-shape-square to-shape-circle text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Next Puzzle
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-6 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Keep Playing
          </button>
        </div>
      </motion.div>
    </ReactModal>
  );
}; 
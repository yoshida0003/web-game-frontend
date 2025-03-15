import React from "react";

interface PromoteModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onPromote: () => void;
  onNotPromote: () => void;
}

const PromoteModal: React.FC<PromoteModalProps> = ({
  isOpen,
  onRequestClose,
  onPromote,
  onNotPromote,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg relative z-60">
        <h2>成りますか？</h2>
        <div className="flex justify-around mt-4">
          <button
            onClick={onPromote}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            成る
          </button>
          <button
            onClick={onNotPromote}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            成らない
          </button>
        </div>
        <button
          onClick={onRequestClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PromoteModal;

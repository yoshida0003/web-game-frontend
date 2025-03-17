"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ResignModalProps {
  message: string;
  onClose: () => void;
  isWinner: boolean;
}

const ResignModal: React.FC<ResignModalProps> = ({
  message,
  onClose,
  isWinner,
}) => {
  const router = useRouter();

  const handleOkClick = () => {
    onClose();
    router.push("/shogi");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-xl mb-4">{message}</h2>
        {isWinner ? (
          <p className="text-lg mb-4">あなたの勝ちです！</p>
        ) : (
          <p className="text-lg mb-4">あなたの負けです！</p>
        )}
        <button
          onClick={handleOkClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default ResignModal;

import React from "react";
import Button from "@/components/Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-1/2">
        {children}
        <Button onClick={onClose} className="text-gray-500 hover:text-gray-700 mt-3">
          閉じる
        </Button>
      </div>
    </div>
  );
};

export default Modal;

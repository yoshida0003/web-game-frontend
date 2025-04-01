import React from "react";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 rounded font-bold border-2 ${
        disabled
          ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-300"
          : "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
      } ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

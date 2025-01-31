import React from "react";
interface ButtonProps {
  text: string;
  bgColor: string;
  textColor: string;
  onClick: () => void;
  disabled?: boolean;
}
export const FormButton: React.FC<ButtonProps> = ({
  text,
  bgColor,
  textColor = 'white',
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full py-4 rounded-xl text-center font-bold text-base cursor-pointer h-14 transition-all
        ${disabled
          ?
          "bg-gray-300 text-gray-500 cursor-not-allowed"
          :
          `${bgColor} ${textColor} hover:opacity-80`
        }
        `}
      disabled={disabled} >
      {text}
    </button>
  );
};

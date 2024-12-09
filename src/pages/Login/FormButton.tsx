import React from "react";
interface ButtonProps {
  text: string;
  bgColor: string;
  textColor: string;
  onClick: () => void;
}
export const FormButton: React.FC<ButtonProps> = ({
  text,
  bgColor,
  textColor = 'white',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-full py-4 rounded-xl text-center font-bold text-base cursor-pointer h-14 transition-all ${bgColor} ${textColor} hover:bg-opacity-80`}
    >
      {text}
    </div>
  );
};

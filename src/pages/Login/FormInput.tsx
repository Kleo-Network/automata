import React, { useState } from "react";
interface InputFieldProps {
  label: string;
  placeholder: string;
  iconPath?: string; // Optional icon on the right
  value: string;
  onChange: (value: string) => void;
}
export const FormInputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  iconPath,
  value,
  onChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="relative rounded-lg bg-gray-100 px-4 py-3">
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="peer w-full bg-transparent pt-5 font-semibold text-sm outline-none transition-all placeholder:text-transparent"
        placeholder={placeholder}
      />
      {/* Label */}
      <label
        className={`absolute left-4 top-3 z-10 origin-[0] transform font-medium text-base text-black transition-all duration-300
          ${isFocused || value ? "text-sm opacity-40" : "translate-y-2"}`}
      >
        {label}
      </label>
      {/* Icon (optional) */}
      {iconPath && (
        <img
          src={iconPath}
          alt="icon"
          className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        />
      )}
    </div>
  );
};

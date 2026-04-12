import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold font-headline uppercase tracking-widest text-black ml-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-0 px-4 py-3 text-on-surface placeholder:text-gray-400 transition-all duration-300 outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

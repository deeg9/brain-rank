"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const letterVariants = {
  initial: {
    y: 0,
    color: "inherit",
  },
  animate: {
    y: "-120%",
    color: "var(--color-on-surface-variant)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export function Input({
  label,
  error,
  className = "",
  id,
  value: controlledValue,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [isAutofilled, setIsAutofilled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect browser autofill via CSS animation trick
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleAnimation = (e: AnimationEvent) => {
      if (e.animationName === "onAutoFillStart") setIsAutofilled(true);
      if (e.animationName === "onAutoFillCancel") setIsAutofilled(false);
    };
    input.addEventListener("animationstart", handleAnimation);
    return () => input.removeEventListener("animationstart", handleAnimation);
  }, []);

  // Support both controlled and uncontrolled
  const currentValue = controlledValue !== undefined ? String(controlledValue) : internalValue;
  const hasValue = currentValue.length > 0;
  const showFloatingLabel = isFocused || hasValue || isAutofilled;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (controlledValue === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  return (
    <div className="space-y-2">
      <div className={`relative ${label ? "pt-5" : ""}`}>
        {label && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant ml-4"
            variants={containerVariants}
            initial="initial"
            animate={showFloatingLabel ? "animate" : "initial"}
          >
            {label.split("").map((char, index) => (
              <motion.span
                key={index}
                className="inline-block text-sm"
                variants={letterVariants}
                style={{ willChange: "transform" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.div>
        )}
        <input
          ref={inputRef}
          id={inputId}
          value={controlledValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={showFloatingLabel ? placeholder : undefined}
          className={`w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:bg-white focus:border-on-surface focus:ring-0 px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 transition-all duration-300 outline-none ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

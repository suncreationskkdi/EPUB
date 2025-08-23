import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <input
        id={id}
        className={`w-full bg-surface border border-border rounded h-10 px-3 text-text placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${className || ''}`}
        {...props}
      />
    </div>
  );
};

export default Input;

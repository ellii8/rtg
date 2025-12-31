import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 shadow-primary/30",
    secondary: "bg-surface text-white hover:bg-[#22242c] border border-secondary/60",
    danger: "bg-[#b91c1c] text-white hover:bg-[#991b1b] shadow-red-800/30",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-green-500/30",
    outline: "border-2 border-primary text-primary hover:bg-primary/10"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

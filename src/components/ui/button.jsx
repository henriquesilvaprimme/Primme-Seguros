import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

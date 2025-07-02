import React from 'react';

export function Label({ children, ...props }) {
  return (
    <label {...props} className={`font-semibold text-gray-700 ${props.className || ''}`}>
      {children}
    </label>
  );
}

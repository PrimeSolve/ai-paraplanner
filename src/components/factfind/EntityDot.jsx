import React from 'react';

export default function EntityDot({ color, size = 8 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 6,
        flexShrink: 0
      }}
    />
  );
}
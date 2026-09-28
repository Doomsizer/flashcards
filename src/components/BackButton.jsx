import React from 'react';
import ArrowIcon from './ArrowIcon';

export default function BackButton({ onClick, children = 'Назад' }) {
  return (
    <button className="back-btn" onClick={onClick}>
      <ArrowIcon direction="left" />
      <span>{children}</span>
    </button>
  );
}

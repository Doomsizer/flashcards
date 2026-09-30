import React from 'react';
import './SearchInput.css';

// Поле поиска: по колодам (главный экран, коллекция) или по карточкам (избранное)
export default function SearchInput({ value, onChange, placeholder = 'Найти колоду: название или предмет' }) {
  return (
    <input
      className="search-input"
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

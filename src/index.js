import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import decks from './data/decks';
import { cleanupFavorites } from './utils/favorites';

// До первого рендера, чтобы счетчики избранного сразу были верными
cleanupFavorites(decks);

const root = createRoot(document.getElementById('root'));
root.render(<App />);

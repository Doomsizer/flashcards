import React from 'react';
import { createRoot } from 'react-dom/client';
// Общие стили подключаются раньше App: стили компонентов идут после них и могут их уточнять
import './styles/tokens.css';
import './styles/base.css';
import './styles/buttons.css';
import './styles/common.css';
import App from './app/App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

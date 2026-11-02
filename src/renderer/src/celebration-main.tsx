import React from 'react';
import ReactDOM from 'react-dom/client';
import { CelebrationApp } from './CelebrationApp';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <CelebrationApp />
    </React.StrictMode>
  );
}


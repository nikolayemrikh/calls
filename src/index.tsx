import './init-sentry';
import { createRoot } from 'react-dom/client';
import 'normalize.css';

import { StrictMode } from 'react';
import { App } from './App';

window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { API_BASE } from './config/api';

// Diagnostic logs to help trace "Failed to construct 'URL'" errors in prod.
// These are intentionally lightweight and safe to keep: they only log the
// resolved API base and capture global errors to the console for troubleshooting.
console.log('[diagnostic] NODE_ENV=', process.env.NODE_ENV, 'API_BASE=', API_BASE);
window.addEventListener('error', (evt) => {
  // eslint-disable-next-line no-console
  console.error('[diagnostic][window.error]', evt.message, evt.filename, evt.lineno, evt.colno, evt.error && evt.error.stack);
});
window.addEventListener('unhandledrejection', (evt) => {
  // eslint-disable-next-line no-console
  console.error('[diagnostic][unhandledrejection]', evt.reason && (evt.reason.stack || evt.reason));
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

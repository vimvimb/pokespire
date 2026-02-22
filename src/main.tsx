import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Request persistent storage so the browser (especially iOS) doesn't evict
// the service worker cache under storage pressure.
if ('storage' in navigator && 'persist' in navigator.storage) {
  navigator.storage.persist();
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App, ErrorBoundary } from './App.jsx';

// Bouton retour Android — empêche de quitter l'app
(function() {
  try {
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", function() {
      window.history.pushState(null, "", window.location.href);
    });
  } catch(e) {}
})();

ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);

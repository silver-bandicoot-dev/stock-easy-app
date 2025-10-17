import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initSentry } from './services/sentry'
import './index.css'

// Initialiser Sentry avant le rendu
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

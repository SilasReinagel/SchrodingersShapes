import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactModal from 'react-modal';
import '../styles/globals.css'
import App from './App.tsx'
import './index.css'

// Set the app element for React Modal
ReactModal.setAppElement('#root');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

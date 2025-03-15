import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import ReactModal from 'react-modal';
import '../styles/globals.css'
import { App } from './App'
import './index.css'

// Set the app element for React Modal
ReactModal.setAppElement('#root');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-background font-inter antialiased">
        <App />
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)

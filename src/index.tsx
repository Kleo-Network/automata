import React from 'react'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import ReactDOM from 'react-dom/client';
import './App.css'
const root = document.createElement("div")
root.className = "container h-screen"
document.body.appendChild(root)
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
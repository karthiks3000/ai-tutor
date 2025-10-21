import React from 'react'
import ReactDOM from 'react-dom/client'
import { configureAmplify } from './config/amplify'

import './index.css'
import App from './App'

// Initialize Amplify before rendering
configureAmplify()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

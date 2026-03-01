import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance, handleRedirectPromise } from '@/auth/msalInstance'
import App from '@/App.jsx'
import '@/index.css'

// Handle MSAL redirect promise before rendering
handleRedirectPromise().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  )
}).catch((error) => {
  console.error('MSAL redirect handling failed:', error)
  // Render anyway so the app can show an error state
  ReactDOM.createRoot(document.getElementById('root')).render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  )
})

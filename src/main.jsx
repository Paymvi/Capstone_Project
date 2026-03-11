import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from "@react-oauth/google";
import './index.css'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId="167049612356-r14p57se5j7sjouc7ovlgadkcfiosbj3.apps.googleusercontent.com">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>

)

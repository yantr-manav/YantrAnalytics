import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161b22',
            color: '#f3f4f6',
            border: '1px solid #21262d',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0d1117' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0d1117' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)

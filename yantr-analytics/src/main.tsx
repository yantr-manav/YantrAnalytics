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
          duration: 4000,
          style: {
            background: 'rgba(17,20,29,0.92)',
            backdropFilter: 'blur(12px)',
            color: '#f3f6fb',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: 500,
            fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
          },
          success: { iconTheme: { primary: '#3ce0a0', secondary: '#07080c' } },
          error: { iconTheme: { primary: '#fb6f7d', secondary: '#07080c' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)

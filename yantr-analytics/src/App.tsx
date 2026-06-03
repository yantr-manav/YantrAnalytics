import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ErrorBoundary from './components/ErrorBoundary'
import { BrandMark } from './components/Logo'

// The dashboard pulls in Plotly + Mermaid + Markdown — code-split it so the
// landing page never pays for them.
const Analysis = lazy(() => import('./pages/Analysis'))

/** Reset scroll position on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Lightweight fallback while a route chunk loads. */
function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-base">
      <div className="animate-pulse">
        <BrandMark size={44} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-base">
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze/:handle" element={<Analysis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

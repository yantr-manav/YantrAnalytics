import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Element shown instead of children when a render error is thrown. */
  fallback?: ReactNode
  /** When true, swallow silently (used for non-critical visuals like the 3D scene). */
  silent?: boolean
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Catches render-time errors in a subtree. Used at the app root for a graceful
 * crash screen, and around the WebGL hero so a GPU/driver failure degrades to a
 * static fallback rather than blanking the page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
    if (!this.props.silent) {
      console.error('[YantrAnalytics] render error:', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-base text-center">
          <div className="glass-panel max-w-md p-10">
            <div className="text-3xl mb-4">⚠</div>
            <h1 className="font-display text-xl text-ink mb-2">Something went sideways</h1>
            <p className="text-sm text-ink-mid mb-6">
              An unexpected error occurred while rendering. Reloading usually clears it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-signal/90 hover:bg-signal px-5 py-2.5 text-sm font-bold text-[#07080c] transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

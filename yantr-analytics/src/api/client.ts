import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 min — analysis pipeline can take time
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — unified error toasts
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail || err.message || 'Request failed'
    if (err.response?.status === 429) {
      toast.error('Rate limit hit. Please wait a moment.')
    } else if (err.response?.status === 404) {
      toast.error(detail)
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Check if backend is running.')
    }
    return Promise.reject(err)
  }
)

export default client

// ── API Functions ─────────────────────────────────────────────────────────────

export const analyzeChannel = (handle: string, options = {}) =>
  client.post('/analyze', {
    handle,
    include_shorts: true,
    include_community: true,
    video_limit: 20,
    run_competitors: true,
    ...options
  })

export const getTrends = (keyword: string) =>
  client.get(`/trends?keyword=${encodeURIComponent(keyword)}`)

export const testTitles = (video_idea: string, niche: string, keywords: string[]) =>
  client.post('/tools/title-test', { video_idea, niche, keywords })

export const generateCalendar = (
  handle: string,
  niche: string,
  content_pillars: string[],
  top_keywords: string[]
) =>
  client.post('/tools/calendar', { handle, niche, content_pillars, top_keywords })

export const exportPdf = (handle: string) =>
  client.get(`/export/pdf/${handle.replace('@', '')}`, { responseType: 'blob' })

export const checkHealth = () =>
  client.get('/health', { baseURL: '' }) // health is at root, not /api

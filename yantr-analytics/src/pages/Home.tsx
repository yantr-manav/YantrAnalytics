// // import { useState, useEffect } from 'react'
// // import { useNavigate } from 'react-router-dom'
// // import { motion } from 'framer-motion'

// // const FEATURES = [
// //   { icon: '🎯', label: 'Viral Score', desc: 'AI-computed virality probability 0–100' },
// //   { icon: '🔍', label: 'Competitor Intel', desc: 'Benchmark against top 5 rivals in your niche' },
// //   { icon: '📈', label: 'Trend Radar', desc: 'Rising YouTube search trends in real-time' },
// //   { icon: '🧠', label: 'Hook Analysis', desc: 'First-30s transcript scoring via AI' },
// //   { icon: '📅', label: 'Content Calendar', desc: '30-day AI-generated publishing schedule' },
// //   { icon: '🔤', label: 'A/B Titles', desc: '5 title variations ranked by CTR score' },
// // ]

// // const STATS = [
// //   { value: '0$', label: 'Data Pipeline Cost' },
// //   { value: '3', label: 'AI Calls per Analysis' },
// //   { value: '60s', label: 'Avg. Report Time' },
// //   { value: '100%', label: 'Public Data Only' },
// // ]

// // const EXAMPLE_HANDLES = ['@MrBeast', '@mkbhd', '@veritasium', '@kurzgesagt']

// // export default function Home() {
// //   const [handle, setHandle] = useState('')
// //   const [focused, setFocused] = useState(false)
// //   const [exampleIndex, setExampleIndex] = useState(0)
// //   const navigate = useNavigate()

// //   useEffect(() => {
// //     const id = setInterval(() => {
// //       setExampleIndex(i => (i + 1) % EXAMPLE_HANDLES.length)
// //     }, 2000)
// //     return () => clearInterval(id)
// //   }, [])

// //   const handleSubmit = () => {
// //     const clean = handle.trim().replace(/^@/, '')
// //     if (clean.length >= 3) {
// //       navigate(`/analyze/${clean}`)
// //     }
// //   }

// //   const isValid = handle.trim().replace(/^@/, '').length >= 3

// //   return (
// //     <div className="min-h-screen bg-[#0d1117] relative overflow-hidden">
// //       {/* Ambient Glow Background */}
// //       <div className="absolute inset-0 overflow-hidden pointer-events-none">
// //         <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
// //         <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl" />
// //         <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-teal-600/6 rounded-full blur-3xl" />
// //       </div>

// //       {/* Navbar */}
// //       <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
// //         <div className="flex items-center gap-2">
// //           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-sm">R</div>
// //           <span className="font-bold text-white">ReachRadar</span>
// //           <span className="text-[10px] bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full ml-1">Ultra</span>
// //         </div>
// //         <div className="flex items-center gap-4 text-sm text-gray-400">
// //           <a href="/docs" target="_blank" className="hover:text-white transition-colors hidden sm:block">API Docs</a>
// //           <a href="https://github.com" target="_blank" className="hover:text-white transition-colors hidden sm:block">GitHub</a>
// //         </div>
// //       </nav>

// //       {/* Hero Section */}
// //       <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-20">
// //         <motion.div
// //           initial={{ opacity: 0, y: 40 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ duration: 0.7, ease: 'easeOut' }}
// //           className="max-w-4xl"
// //         >
// //           {/* Badge */}
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.9 }}
// //             animate={{ opacity: 1, scale: 1 }}
// //             transition={{ delay: 0.1 }}
// //             className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 rounded-full px-4 py-1.5 text-xs text-blue-300 mb-8"
// //           >
// //             <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
// //             AI-Powered · Zero Cost · Industry Grade
// //           </motion.div>

// //           {/* Headline */}
// //           <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight mb-4">
// //             Reach<span className="text-blue-500">Radar</span>{' '}
// //             <span className="gradient-text">Ultra</span>
// //           </h1>
// //           <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-3">
// //             AI Creator Intelligence Platform. Deep YouTube audit, competitor benchmarking,
// //             trend detection & growth strategy — in under 60 seconds.
// //           </p>
// //           <p className="text-sm text-gray-600 mb-10">
// //             No API keys needed. No credit card. 100% public data.
// //           </p>

// //           {/* Search Box */}
// //           <div className="relative max-w-xl mx-auto">
// //             <div className={`flex items-center gap-3 bg-[#161b22] border rounded-2xl px-4 py-3 transition-all duration-200 ${
// //               focused
// //                 ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
// //                 : 'border-[#21262d] hover:border-gray-600'
// //             }`}>
// //               <div className="flex-shrink-0 text-gray-500">
// //                 <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
// //                 </svg>
// //               </div>
// //               <input
// //                 id="yt-handle-input"
// //                 type="text"
// //                 value={handle}
// //                 onChange={e => setHandle(e.target.value)}
// //                 onFocus={() => setFocused(true)}
// //                 onBlur={() => setFocused(false)}
// //                 onKeyDown={e => e.key === 'Enter' && handleSubmit()}
// //                 placeholder={EXAMPLE_HANDLES[exampleIndex]}
// //                 className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
// //                 autoComplete="off"
// //               />
// //               <button
// //                 id="analyze-btn"
// //                 onClick={handleSubmit}
// //                 disabled={!isValid}
// //                 className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-150 flex-shrink-0 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
// //               >
// //                 Analyze
// //               </button>
// //             </div>
// //             <p className="text-xs text-gray-600 mt-2">
// //               Enter a YouTube handle like <code className="text-gray-500 bg-gray-800 px-1 rounded">@channelname</code>
// //             </p>
// //           </div>

// //           {/* Quick Examples */}
// //           <div className="flex flex-wrap justify-center gap-2 mt-5">
// //             {EXAMPLE_HANDLES.map(h => (
// //               <button
// //                 key={h}
// //                 onClick={() => { setHandle(h); setTimeout(handleSubmit, 50) }}
// //                 className="text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-[#21262d] hover:border-gray-600 text-gray-400 hover:text-white rounded-full transition-all"
// //               >
// //                 {h}
// //               </button>
// //             ))}
// //           </div>
// //         </motion.div>

// //         {/* Stats Row */}
// //         <motion.div
// //           initial={{ opacity: 0, y: 20 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ delay: 0.4, duration: 0.6 }}
// //           className="flex flex-wrap justify-center gap-8 mt-16 mb-20"
// //         >
// //           {STATS.map(s => (
// //             <div key={s.label} className="text-center">
// //               <div className="text-2xl font-black text-blue-400">{s.value}</div>
// //               <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
// //             </div>
// //           ))}
// //         </motion.div>

// //         {/* Feature Grid */}
// //         <motion.div
// //           initial={{ opacity: 0, y: 30 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ delay: 0.6, duration: 0.6 }}
// //           className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl w-full"
// //         >
// //           {FEATURES.map((f, i) => (
// //             <motion.div
// //               key={f.label}
// //               initial={{ opacity: 0, y: 20 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ delay: 0.7 + i * 0.08 }}
// //               className="glass-card p-5 text-left hover:border-blue-800/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-200 cursor-default"
// //             >
// //               <div className="text-2xl mb-2">{f.icon}</div>
// //               <div className="text-sm font-semibold text-white mb-1">{f.label}</div>
// //               <div className="text-xs text-gray-500">{f.desc}</div>
// //             </motion.div>
// //           ))}
// //         </motion.div>

// //         {/* Footer note */}
// //         <motion.p
// //           initial={{ opacity: 0 }}
// //           animate={{ opacity: 1 }}
// //           transition={{ delay: 1.2 }}
// //           className="text-xs text-gray-700 mt-12"
// //         >
// //           Analyzes public YouTube data only. Built with FastAPI + Gemini AI + yt-dlp.
// //         </motion.p>
// //       </main>
// //     </div>
// //   )
// // }



// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { motion, AnimatePresence } from 'framer-motion'

// const FEATURES = [
//   { icon: '🎯', label: 'Viral Score', desc: 'Neural-net powered probability engine.' },
//   { icon: '⚔️', label: 'Competitor Intel', desc: 'Real-time benchmarking vs niche leaders.' },
//   { icon: '📈', label: 'Trend Radar', desc: 'Capture breakout search signals early.' },
//   { icon: '🪝', label: 'Hook Analysis', desc: 'Transcript-level retention scoring.' },
//   { icon: '📅', label: 'AI Strategy', desc: '30-day automated publishing roadmap.' },
//   { icon: '🔤', label: 'CTR Lab', desc: 'A/B title testing with psychological hooks.' },
// ]

// const STATS = [
//   { value: '0$', label: 'Data Costs' },
//   { value: 'Gen-3', label: 'AI Engine' },
//   { value: '60s', label: 'Analysis' },
//   { value: 'No-Key', label: 'Public Access' },
// ]

// const EXAMPLE_HANDLES = ['@MrBeast', '@MKBHD', '@Veritasium', '@Kurzgesagt']

// export default function Home() {
//   const [handle, setHandle] = useState('')
//   const [focused, setFocused] = useState(false)
//   const [exampleIndex, setExampleIndex] = useState(0)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const id = setInterval(() => setExampleIndex(i => (i + 1) % EXAMPLE_HANDLES.length), 2500)
//     return () => clearInterval(id)
//   }, [])

//   const handleSubmit = () => {
//     const clean = handle.trim().replace(/^@/, '')
//     if (clean.length >= 2) navigate(`/analyze/${clean}`)
//   }

//   return (
//     <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 selection:text-blue-200 selection:font-bold overflow-x-hidden">
//       {/* Dynamic Background Mesh */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
//         <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
//         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
//         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
//       </div>

//       <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
//             <span className="font-black text-xl tracking-tighter">R</span>
//           </div>
//           <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">ReachRadar</span>
//           <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-widest text-blue-400">Ultra 3.0</span>
//         </div>
//         <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
//           <a href="#" className="hover:text-white transition-colors">Platform</a>
//           <a href="#" className="hover:text-white transition-colors">Intelligence</a>
//           <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2 rounded-full transition-all">Docs</button>
//         </div>
//       </nav>

//       <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
//         <div className="grid lg:grid-cols-2 gap-16 items-center">
          
//           <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
//             <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-6">
//               <span className="relative flex h-2 w-2">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
//                 <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
//               </span>
//               Neural Insights Live
//             </div>
            
//             <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8">
//               UNFAIR <br />
//               <span className="text-blue-500 italic">ADVANTAGE</span>
//             </h1>
            
//             <p className="text-xl text-gray-400 max-w-lg leading-relaxed mb-10">
//               Stop guessing. ReachRadar Ultra performs deep visual and transcript audits on any YouTube channel in seconds.
//             </p>

//             {/* Input Module */}
//             <div className={`relative max-w-md group transition-all duration-500 ${focused ? 'scale-105' : ''}`}>
//                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
//                <div className="relative flex items-center gap-2 bg-[#0d0d0d] border border-white/10 rounded-2xl p-2 pl-5">
//                   <input
//                     type="text"
//                     value={handle}
//                     onChange={e => setHandle(e.target.value)}
//                     onFocus={() => setFocused(true)}
//                     onBlur={() => setFocused(false)}
//                     onKeyDown={e => e.key === 'Enter' && handleSubmit()}
//                     placeholder={EXAMPLE_HANDLES[exampleIndex]}
//                     className="flex-1 bg-transparent text-white placeholder-gray-700 outline-none font-medium"
//                   />
//                   <button
//                     onClick={handleSubmit}
//                     className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-xl shadow-blue-900/20"
//                   >
//                     Analyze
//                   </button>
//                </div>
//             </div>
            
//             <div className="mt-6 flex flex-wrap gap-3">
//                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest pt-2">Try:</span>
//                {EXAMPLE_HANDLES.map(h => (
//                  <button key={h} onClick={() => setHandle(h)} className="text-xs font-semibold px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-gray-400 transition-all">{h}</button>
//                ))}
//             </div>
//           </motion.div>

//           {/* Right Column: Bento Feature Grid */}
//           <motion.div 
//             initial={{ opacity: 0, scale: 0.9 }} 
//             animate={{ opacity: 1, scale: 1 }} 
//             transition={{ duration: 0.8, delay: 0.2 }}
//             className="grid grid-cols-2 gap-4"
//           >
//             {FEATURES.map((f, i) => (
//               <div key={f.label} className={`p-6 rounded-3xl border border-white/5 bg-[#0d0d0d] hover:border-blue-500/30 transition-all group ${i === 1 || i === 4 ? 'translate-y-8' : ''}`}>
//                 <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
//                 <h3 className="font-bold text-white mb-1">{f.label}</h3>
//                 <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
//               </div>
//             ))}
//           </motion.div>

//         </div>

//         {/* Floating Stats */}
//         <div className="mt-32 pt-16 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
//           {STATS.map(s => (
//             <div key={s.label}>
//               <div className="text-3xl font-black text-white">{s.value}</div>
//               <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/80 mt-1">{s.label}</div>
//             </div>
//           ))}
//         </div>
//       </main>
//     </div>
//   )
// }


import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'

const FEATURES = [
  {
    icon: '🎯',
    label: 'Viral Score',
    desc: 'AI-computed virality probability 0–100 using engagement pattern modeling.',
    accent: '#6366f1',
    size: 'col-span-1',
  },
  {
    icon: '⚔️',
    label: 'Competitor Intel',
    desc: 'Deep benchmark against your top 5 niche rivals. See exactly where you win and lose.',
    accent: '#0ea5e9',
    size: 'col-span-1',
  },
  {
    icon: '📈',
    label: 'Trend Radar',
    desc: 'Rising YouTube queries before they peak.',
    accent: '#10b981',
    size: 'col-span-1',
  },
  {
    icon: '🪝',
    label: 'Hook Analysis',
    desc: 'Transcript-level scoring of your first 30 seconds.',
    accent: '#f59e0b',
    size: 'col-span-1',
  },
  {
    icon: '📅',
    label: '30-Day Calendar',
    desc: 'AI-built content schedule from competitor patterns and live trends.',
    accent: '#ec4899',
    size: 'col-span-1',
  },
  {
    icon: '🔤',
    label: 'CTR Lab',
    desc: 'Five title variations A/B-ranked by psychological hook type and keyword density.',
    accent: '#8b5cf6',
    size: 'col-span-1',
  },
]

const STATS = [
  { value: '$0', label: 'Pipeline Cost', icon: '💸' },
  { value: '60s', label: 'Avg Analysis', icon: '⚡' },
  { value: '100%', label: 'Public Data', icon: '🔓' },
  { value: 'Gen-AI', label: 'Powered By', icon: '🧠' },
]

const HANDLES = ['@MrBeast', '@MKBHD', '@Veritasium', '@Kurzgesagt', '@LexFridman']

// Animated counter
function Counter({ to, duration = 1.5 }: { to: string; duration?: number }) {
  return <span>{to}</span>
}

// Typewriter for placeholder
function useTypewriter(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[wordIdx]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speed)
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2)
    } else if (deleting && charIdx === 0) {
      setDeleting(false)
      setWordIdx((w) => (w + 1) % words.length)
    }

    setDisplay(word.slice(0, charIdx))
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, wordIdx, words, speed, pause])

  return display
}

// Orbit ring decoration
function OrbitRing({ size, duration, delay = 0, color }: { size: number; duration: number; delay?: number; color: string }) {
  return (
    <div
      className="absolute rounded-full border pointer-events-none"
      style={{
        width: size,
        height: size,
        borderColor: color + '18',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: `spin ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="absolute w-2 h-2 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}

export default function Home() {
  const [handle, setHandle] = useState('')
  const [focused, setFocused] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const placeholder = useTypewriter(HANDLES)

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, -60])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.4])

  const handleSubmit = () => {
    const clean = handle.trim().replace(/^@/, '')
    if (clean.length >= 2) navigate(`/analyze/${clean}`)
  }

  const isValid = handle.trim().replace(/^@/, '').length >= 2

  return (
    <div className="min-h-screen bg-[#06060a] text-white overflow-x-hidden">
      {/* ── Global Keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');

        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Syne', sans-serif !important; }

        @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes spin-reverse { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }

        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #0ea5e9 50%, #10b981 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }

        .input-glow:focus-within {
          box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 0 32px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.4s ease;
          background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), var(--accent, #6366f1)08, transparent 65%);
        }
        .feature-card:hover::before { opacity: 1; }

        .scanline {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 120px;
          background: linear-gradient(to bottom, transparent, rgba(99,102,241,0.015), transparent);
          animation: scanline 12s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 0;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #06060a; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 4px; }
      `}</style>

      {/* ── Noise + Scanline ── */}
      <div className="noise" />
      <div className="scanline" />

      {/* ── Ambient Blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            top: '-20%', left: '-15%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            animation: 'glow-pulse 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            bottom: '-10%', right: '-10%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)',
            animation: 'glow-pulse 8s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            top: '40%', right: '20%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
            animation: 'glow-pulse 10s ease-in-out infinite 4s',
          }}
        />
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 flex items-center justify-between px-5 sm:px-8 py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-display font-black text-base text-white">R</div>
          </div>
          <span className="font-display font-bold text-lg text-white hidden sm:block">ReachRadar</span>
          <div
            className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border"
            style={{ color: '#6366f1', borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)' }}
          >
            Ultra
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2">
            Platform
          </a>
          <a href="#" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2">
            Docs
          </a>
          <button
            onClick={() => inputRef.current?.focus()}
            className="text-sm font-bold px-4 py-2 rounded-xl border border-slate-700 hover:border-indigo-500/60 bg-white/[0.03] hover:bg-white/[0.06] text-white transition-all duration-200"
          >
            Get Started →
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-24"
      >
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-center">

          {/* Left */}
          <div className="max-w-2xl">
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2.5 mb-8 rounded-full border px-4 py-1.5"
              style={{
                background: 'rgba(99,102,241,0.06)',
                borderColor: 'rgba(99,102,241,0.2)',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                AI Intelligence · Live
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="font-display font-black leading-[0.88] tracking-tighter mb-6"
              style={{ fontSize: 'clamp(3.2rem, 9vw, 7rem)' }}
            >
              KNOW YOUR
              <br />
              <span className="gradient-text">CHANNEL</span>
              <br />
              INSIDE OUT.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-slate-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl font-light"
            >
              ReachRadar performs deep YouTube channel audits — viral scoring, competitor benchmarking, trend detection, and an AI growth strategy — in under 60 seconds.
            </motion.p>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mb-5"
            >
              <div
                className="input-glow relative flex items-center gap-2 rounded-2xl border p-2 transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  borderColor: focused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {/* @ prefix */}
                <div className="flex-shrink-0 pl-2 text-slate-600 font-bold text-lg select-none">@</div>
                <input
                  ref={inputRef}
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder={placeholder || 'channelname'}
                  className="flex-1 bg-transparent text-white placeholder-slate-700 outline-none text-base font-semibold min-w-0 py-2"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="flex-shrink-0 font-black text-sm px-5 sm:px-7 py-3 rounded-xl text-white transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: isValid
                      ? 'linear-gradient(135deg, #6366f1, #0ea5e9)'
                      : '#1e1e2e',
                    boxShadow: isValid ? '0 8px 24px rgba(99,102,241,0.35)' : 'none',
                  }}
                >
                  Analyze
                </button>
              </div>
            </motion.div>

            {/* Example chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Try:</span>
              {HANDLES.map((h) => (
                <button
                  key={h}
                  onClick={() => setHandle(h)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
                >
                  {h}
                </button>
              ))}
            </motion.div>
          </div>

          {/* Right: Orbit Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex items-center justify-center relative flex-shrink-0"
            style={{ width: 340, height: 340 }}
          >
            {/* Core */}
            <div
              className="relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center font-display font-black text-4xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(14,165,233,0.15))',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 0 40px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              📡
            </div>

            {/* Orbits */}
            <OrbitRing size={160} duration={8} color="#6366f1" />
            <OrbitRing size={240} duration={14} delay={-3} color="#0ea5e9" />
            <OrbitRing size={320} duration={20} delay={-6} color="#10b981" />

            {/* Floating stat pills */}
            {[
              { label: 'Viral Score', val: '87', color: '#6366f1', top: '8%', right: '0%' },
              { label: 'Engagement', val: '4.2%', color: '#10b981', bottom: '12%', left: '0%' },
              { label: 'Hook', val: '92/100', color: '#f59e0b', top: '50%', right: '-5%' },
            ].map((pill) => (
              <div
                key={pill.label}
                className="absolute flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
                style={{
                  ...pill,
                  background: pill.color + '10',
                  borderColor: pill.color + '30',
                  color: pill.color,
                  backdropFilter: 'blur(8px)',
                  boxShadow: `0 0 16px ${pill.color}18`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: pill.color }}
                />
                {pill.label}: <span className="font-black ml-0.5">{pill.val}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Stats Bar ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mb-24"
      >
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center justify-center gap-1 py-8 px-4 text-center"
              style={{ background: '#06060a' }}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display font-black text-2xl text-white">{s.value}</div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center sm:text-left"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-3">What you get</p>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white leading-tight">
            Everything a creator needs.<br />
            <span className="text-slate-600">Nothing they don't.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              className="feature-card relative rounded-2xl border p-6 cursor-default transition-all duration-400 group overflow-hidden"
              style={{
                '--accent': f.accent,
                background: hoveredFeature === i
                  ? `linear-gradient(135deg, ${f.accent}06, rgba(255,255,255,0.01))`
                  : 'rgba(255,255,255,0.02)',
                borderColor: hoveredFeature === i ? f.accent + '30' : 'rgba(255,255,255,0.05)',
                transform: hoveredFeature === i ? 'translateY(-2px)' : 'none',
                boxShadow: hoveredFeature === i ? `0 16px 40px ${f.accent}10` : 'none',
              } as React.CSSProperties}
            >
              {/* Accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-px transition-all duration-400"
                style={{
                  background: `linear-gradient(90deg, transparent, ${f.accent}${hoveredFeature === i ? '60' : '00'}, transparent)`,
                }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: f.accent + '12', border: `1px solid ${f.accent}20` }}
              >
                {f.icon}
              </div>

              <h3 className="font-display font-bold text-white text-base mb-2">{f.label}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>

              <div
                className="absolute bottom-5 right-5 text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                style={{ color: f.accent }}
              >
                →
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mb-24"
      >
        <div
          className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(14,165,233,0.06) 100%)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          {/* BG decorations */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1), transparent)', filter: 'blur(40px)' }}
          />

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-4">Ready?</p>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white mb-4 leading-tight">
            Run your first audit.<br />It's free.
          </h2>
          <p className="text-slate-500 text-base mb-10 max-w-lg mx-auto">
            Paste any YouTube handle and see your channel through the lens of AI-powered competitive intelligence.
          </p>

          <div
            className="flex items-center max-w-sm mx-auto gap-2 rounded-2xl border p-2 mb-4 transition-all duration-300"
            style={{
              background: 'rgba(6,6,10,0.8)',
              borderColor: 'rgba(99,102,241,0.3)',
            }}
          >
            <span className="text-slate-600 font-bold pl-3">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="yourhandle"
              className="flex-1 bg-transparent text-white placeholder-slate-700 outline-none text-sm font-semibold py-2"
            />
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="font-black text-sm px-6 py-2.5 rounded-xl text-white transition-all active:scale-95 disabled:opacity-30"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              Go →
            </button>
          </div>
          <p className="text-[11px] text-slate-700">No signup. No API key. Public data only.</p>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-5 sm:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center font-display font-black text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}
          >
            R
          </div>
          <span className="text-slate-700 text-xs font-semibold">ReachRadar Ultra</span>
        </div>
        <p className="text-[10px] text-slate-800 font-medium text-center">
          Built with FastAPI · Gemini AI · yt-dlp · Public YouTube data only
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-[11px] text-slate-700 hover:text-slate-400 transition-colors">Docs</a>
          <a href="#" className="text-[11px] text-slate-700 hover:text-slate-400 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
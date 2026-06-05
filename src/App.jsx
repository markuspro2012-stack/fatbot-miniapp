import { useState, useEffect, Component } from 'react'
import TabBar from './components/TabBar.jsx'
import Today from './pages/Today.jsx'
import Add from './pages/Add.jsx'
import Photo from './pages/Photo.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'
import { colors } from './theme.js'

const PAGES = { today: Today, add: Add, photo: Photo, stats: Stats, profile: Profile }

function Splash({ fading }) {
  return (
    <div style={{ ...ss.root, opacity: fading ? 0 : 1, transition: 'opacity 350ms ease' }}>
      <div style={ss.glow} />

      <div style={ss.logoWrap}>
        <div style={ss.logoCircle}>🔥</div>
        <div style={ss.ring} />
      </div>

      <div style={ss.appName}>FatBot</div>
      <div style={ss.tagline}>Умный трекинг питания</div>

      <div style={ss.dots}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ ...ss.dot, animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  )
}

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, color: colors.danger, background: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Ошибка приложения</div>
        <div style={{ fontSize: 13, color: colors.textSub }}>{this.state.error.message}</div>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  const [tab, setTab] = useState('today')
  const [splash, setSplash] = useState(true)
  const [splashFading, setSplashFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1400)
    const t2 = setTimeout(() => setSplash(false), 1750)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const Page = PAGES[tab]

  return (
    <ErrorBoundary>
      <div style={s.root}>
        {splash && <Splash fading={splashFading} />}
        <div style={s.glow1} />
        <div style={s.glow2} />
        <div key={tab} style={s.content}>
          <Page onNavigate={setTab} />
        </div>
        <TabBar active={tab} onChange={setTab} />
      </div>
    </ErrorBoundary>
  )
}

const s = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: colors.bgGradient,
    backgroundAttachment: 'fixed',
    color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    position: 'relative', overflow: 'hidden',
  },
  glow1: {
    position: 'fixed', top: '-15%', right: '-10%',
    width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  glow2: {
    position: 'fixed', bottom: '10%', left: '-15%',
    width: 250, height: 250, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,92,252,0.10) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  content: {
    flex: 1, overflowY: 'auto', paddingBottom: 68,
    position: 'relative', zIndex: 1,
    animation: 'pageIn 280ms cubic-bezier(0.25,0.46,0.45,0.94)',
  },
}

const ss = {
  root: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, #0a0a1a 0%, #0d0d2b 50%, #0a0a1a 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  },
  glow: {
    position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
    width: 320, height: 320, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,92,252,0.28) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  logoWrap: {
    position: 'relative', width: 100, height: 100,
    marginBottom: 28,
    animation: 'scaleIn 600ms cubic-bezier(0.34,1.56,0.64,1)',
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c5cfc 0%, #a78bfa 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 48,
    boxShadow: '0 0 50px rgba(124,92,252,0.6), 0 0 100px rgba(124,92,252,0.25)',
  },
  ring: {
    position: 'absolute', inset: -8,
    border: '2px solid rgba(124,92,252,0.35)',
    borderRadius: '50%',
    animation: 'pulse 2s ease infinite',
  },
  appName: {
    fontSize: 44, fontWeight: 900, letterSpacing: -1.5,
    background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 60%, #7c5cfc 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    animation: 'slideUp 500ms ease 150ms both',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15, color: 'rgba(240,240,255,0.42)', fontWeight: 500,
    letterSpacing: 0.2,
    animation: 'slideUp 500ms ease 300ms both',
    marginBottom: 64,
  },
  dots: {
    display: 'flex', gap: 8,
    animation: 'slideUp 500ms ease 450ms both',
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'rgba(167,139,250,0.7)',
    animation: 'pulse 1.1s ease infinite',
  },
}

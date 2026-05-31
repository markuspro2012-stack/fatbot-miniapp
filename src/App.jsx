import { useState } from 'react'
import TabBar from './components/TabBar.jsx'
import Today from './pages/Today.jsx'
import Add from './pages/Add.jsx'
import Photo from './pages/Photo.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'

const PAGES = { today: Today, add: Add, photo: Photo, stats: Stats, profile: Profile }

export default function App() {
  const [tab, setTab] = useState('today')
  const Page = PAGES[tab]

  return (
    <div style={styles.root}>
      <div style={styles.content}>
        <Page onNavigate={setTab} />
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

const styles = {
  root: { display: 'flex', flexDirection: 'column', height: '100%' },
  content: { flex: 1, overflowY: 'auto', paddingBottom: 68 },
}

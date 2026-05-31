const TABS = [
  { id: 'today', label: 'Сегодня', icon: '📋' },
  { id: 'add', label: 'Добавить', icon: '➕' },
  { id: 'photo', label: 'Фото AI', icon: '📸' },
  { id: 'stats', label: 'Статистика', icon: '📊' },
  { id: 'profile', label: 'Профиль', icon: '👤' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav style={styles.nav}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{ ...styles.btn, ...(active === t.id ? styles.active : {}) }}
        >
          <span style={styles.icon}>{t.icon}</span>
          <span style={styles.label}>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--tg-theme-bg-color, #fff)',
    borderTop: '1px solid var(--tg-theme-hint-color, #e0e0e0)',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  btn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--tg-theme-hint-color, #999)',
    gap: 2,
  },
  active: {
    color: 'var(--tg-theme-button-color, #2196f3)',
  },
  icon: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: 500 },
}

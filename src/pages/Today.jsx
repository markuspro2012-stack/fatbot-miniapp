import { useState, useEffect } from 'react'
import { api } from '../api.js'

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

function MacroBar({ label, current, limit, color }) {
  const pct = limit ? Math.min((current / limit) * 100, 100) : 0
  return (
    <div style={s.macroRow}>
      <div style={s.macroLabel}>{label}</div>
      <div style={s.barTrack}>
        <div style={{ ...s.barFill, width: `${pct}%`, background: color }} />
      </div>
      <div style={s.macroVal}>{Math.round(current)}/{limit}г</div>
    </div>
  )
}

export default function Today({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    api.getToday()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await api.deleteFood(id)
      load()
    } catch (e) {
      alert('Ошибка удаления: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleAddWater = async () => {
    try {
      await api.addWater(1)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div style={s.center}>Загрузка...</div>
  if (error) return <div style={s.center}>⚠️ {error}</div>

  const { totals, limits, entries, water_glasses } = data
  const calPct = limits.calories ? Math.min((totals.calories / limits.calories) * 100, 100) : 0
  const calLeft = Math.max(0, (limits.calories || 0) - totals.calories)

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    const items = entries.filter(e => e.meal_type === meal)
    if (items.length) acc[meal] = items
    return acc
  }, {})

  return (
    <div style={s.page}>
      <h2 style={s.title}>Сегодня</h2>

      {/* Калории */}
      <div style={s.card}>
        <div style={s.calRow}>
          <div>
            <div style={s.calNum}>{Math.round(totals.calories)}</div>
            <div style={s.calSub}>ккал съедено</div>
          </div>
          <div style={s.calCircle}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--tg-theme-hint-color,#e0e0e0)" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke="var(--tg-theme-button-color,#2196f3)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 34 * calPct / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round" transform="rotate(-90 40 40)" />
            </svg>
            <div style={s.calInner}>
              <div style={s.calPct}>{Math.round(calPct)}%</div>
            </div>
          </div>
          <div>
            <div style={s.calNum}>{Math.round(calLeft)}</div>
            <div style={s.calSub}>ккал осталось</div>
          </div>
        </div>

        <MacroBar label="Б" current={totals.protein} limit={limits.protein} color="#4caf50" />
        <MacroBar label="Ж" current={totals.fat} limit={limits.fat} color="#ff9800" />
        <MacroBar label="У" current={totals.carbs} limit={limits.carbs} color="#2196f3" />
      </div>

      {/* Вода */}
      <div style={s.card}>
        <div style={s.waterRow}>
          <span style={s.waterTitle}>💧 Вода</span>
          <span style={s.waterVal}>{water_glasses} стаканов</span>
          <button style={s.waterBtn} onClick={handleAddWater}>+1</button>
        </div>
      </div>

      {/* Еда по приёмам */}
      {Object.keys(grouped).length === 0 ? (
        <div style={s.empty}>
          <p>Пока ничего не добавлено</p>
          <button style={s.addBtn} onClick={() => onNavigate('add')}>➕ Добавить еду</button>
        </div>
      ) : (
        Object.entries(grouped).map(([meal, items]) => (
          <div key={meal} style={s.card}>
            <div style={s.mealTitle}>{MEAL_ICONS[meal]} {items[0].meal_label}</div>
            {items.map(item => (
              <div key={item.id} style={s.entryRow}>
                <div style={s.entryInfo}>
                  <div style={s.entryName}>{item.food_name}</div>
                  <div style={s.entrySub}>{item.amount_g}г · {Math.round(item.calories)} ккал</div>
                </div>
                <button
                  style={s.deleteBtn}
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        ))
      )}

      <div style={{ height: 16 }} />
    </div>
  )
}

const s = {
  page: { padding: '16px 12px' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  card: { background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)', borderRadius: 16, padding: 16, marginBottom: 12 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--tg-theme-hint-color,#999)' },
  calRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNum: { fontSize: 22, fontWeight: 700, textAlign: 'center' },
  calSub: { fontSize: 11, color: 'var(--tg-theme-hint-color,#999)', textAlign: 'center' },
  calCircle: { position: 'relative', width: 80, height: 80 },
  calInner: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  calPct: { fontSize: 14, fontWeight: 700 },
  macroRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  macroLabel: { width: 14, fontSize: 12, fontWeight: 600 },
  barTrack: { flex: 1, height: 6, background: 'var(--tg-theme-hint-color,#e0e0e0)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s' },
  macroVal: { fontSize: 11, color: 'var(--tg-theme-hint-color,#999)', width: 70, textAlign: 'right' },
  waterRow: { display: 'flex', alignItems: 'center', gap: 8 },
  waterTitle: { fontSize: 15, fontWeight: 600, flex: 1 },
  waterVal: { fontSize: 14, color: 'var(--tg-theme-hint-color,#999)' },
  waterBtn: { background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px 0', color: 'var(--tg-theme-hint-color,#999)' },
  addBtn: { marginTop: 12, background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, cursor: 'pointer' },
  mealTitle: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--tg-theme-hint-color,#666)' },
  entryRow: { display: 'flex', alignItems: 'center', paddingVertical: 4, borderTop: '1px solid var(--tg-theme-hint-color,#e0e0e0)', paddingTop: 8, marginTop: 4 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: 500 },
  entrySub: { fontSize: 12, color: 'var(--tg-theme-hint-color,#999)', marginTop: 2 },
  deleteBtn: { background: 'none', border: 'none', color: '#ff5252', fontSize: 16, cursor: 'pointer', padding: '4px 8px' },
}

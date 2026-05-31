import { useState, useEffect } from 'react'
import { api } from '../api.js'

function Bar({ value, max, label, date }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const isToday = date === new Date().toISOString().split('T')[0]
  return (
    <div style={s.barCol}>
      <div style={s.barWrap}>
        <div style={{ ...s.bar, height: `${pct}%`, background: isToday ? 'var(--tg-theme-button-color,#2196f3)' : 'var(--tg-theme-hint-color,#b0bec5)' }} />
      </div>
      <div style={s.barLabel}>{label}</div>
      <div style={s.barVal}>{Math.round(value)}</div>
    </div>
  )
}

export default function Stats() {
  const [data, setData] = useState(null)
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [newWeight, setNewWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([api.getWeekStats(), api.getWeightHistory()])
      .then(([stats, wh]) => { setData(stats); setWeights(wh.entries) })
      .catch(e => alert(e.message))
      .finally(() => setLoading(false))
  }, [])

  const saveWeight = async () => {
    const w = parseFloat(newWeight)
    if (isNaN(w) || w <= 0) return
    setSaving(true)
    try {
      await api.logWeight(w)
      const wh = await api.getWeightHistory()
      setWeights(wh.entries)
      setNewWeight('')
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={s.center}>Загрузка...</div>

  const days = data?.days || []
  const maxCal = Math.max(...days.map(d => d.calories), 1)
  const DAY_LABELS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
  const avgCal = days.filter(d => d.calories > 0).reduce((a, d) => a + d.calories, 0) / (days.filter(d => d.calories > 0).length || 1)

  return (
    <div style={s.page}>
      <h2 style={s.title}>Статистика</h2>

      {/* График калорий за неделю */}
      <div style={s.card}>
        <div style={s.cardTitle}>🔥 Калории за 7 дней</div>
        <div style={s.chart}>
          {days.map((d, i) => {
            const dow = new Date(d.date).getDay()
            const label = DAY_LABELS[(dow + 6) % 7]
            return <Bar key={d.date} value={d.calories} max={maxCal} label={label} date={d.date} />
          })}
        </div>
        <div style={s.avgRow}>
          <span style={s.avgLabel}>Среднее за неделю</span>
          <span style={s.avgVal}>{Math.round(avgCal)} ккал/день</span>
        </div>
      </div>

      {/* Детализация */}
      <div style={s.card}>
        <div style={s.cardTitle}>📊 По дням</div>
        {[...days].reverse().map(d => (
          <div key={d.date} style={s.dayRow}>
            <div style={s.dayDate}>{new Date(d.date).toLocaleDateString('ru', { day: 'numeric', month: 'short', weekday: 'short' })}</div>
            <div style={s.dayMacros}>
              <span style={s.chip}>🔥 {Math.round(d.calories)}</span>
              <span style={s.chip}>Б{Math.round(d.protein)}</span>
              <span style={s.chip}>Ж{Math.round(d.fat)}</span>
              <span style={s.chip}>У{Math.round(d.carbs)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Вес */}
      <div style={s.card}>
        <div style={s.cardTitle}>⚖️ Вес</div>
        <div style={s.weightRow}>
          <input
            style={{ ...s.input, flex: 1 }}
            type="number"
            placeholder="Введи вес (кг)"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
          />
          <button style={s.weightBtn} onClick={saveWeight} disabled={saving || !newWeight}>
            {saving ? '...' : 'Записать'}
          </button>
        </div>
        {weights.slice(0, 7).map((w, i) => (
          <div key={i} style={s.weightEntry}>
            <span style={s.wDate}>{new Date(w.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
            <span style={s.wVal}>{w.weight_kg} кг</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '16px 12px' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--tg-theme-hint-color,#999)' },
  card: { background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 14 },
  chart: { display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 10 },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  barWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', background: 'var(--tg-theme-hint-color,#e0e0e0)', borderRadius: 4, overflow: 'hidden', minHeight: 4 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4, transition: 'height 0.3s' },
  barLabel: { fontSize: 10, color: 'var(--tg-theme-hint-color,#999)' },
  barVal: { fontSize: 9, color: 'var(--tg-theme-hint-color,#aaa)' },
  avgRow: { display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--tg-theme-hint-color,#e0e0e0)' },
  avgLabel: { fontSize: 13, color: 'var(--tg-theme-hint-color,#666)' },
  avgVal: { fontSize: 13, fontWeight: 700 },
  dayRow: { paddingVertical: 6, borderBottom: '1px solid var(--tg-theme-hint-color,#e0e0e0)', paddingBottom: 8, marginBottom: 6 },
  dayDate: { fontSize: 12, color: 'var(--tg-theme-hint-color,#666)', marginBottom: 4 },
  dayMacros: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { fontSize: 12, background: 'var(--tg-theme-bg-color,#fff)', padding: '2px 8px', borderRadius: 8 },
  weightRow: { display: 'flex', gap: 8, marginBottom: 12 },
  input: { padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'var(--tg-theme-bg-color,#fff)', color: 'var(--tg-theme-text-color,#000)', fontSize: 15, outline: 'none' },
  weightBtn: { padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  weightEntry: { display: 'flex', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid var(--tg-theme-hint-color,#e0e0e0)' },
  wDate: { fontSize: 13, color: 'var(--tg-theme-hint-color,#666)' },
  wVal: { fontSize: 14, fontWeight: 600 },
}

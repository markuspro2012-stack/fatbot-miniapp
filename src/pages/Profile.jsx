import { useState, useEffect } from 'react'
import { api } from '../api.js'

const GOAL_LABELS = { lose: '📉 Похудеть', maintain: '⚖️ Поддерживать вес', gain: '📈 Набрать массу' }

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={s.center}>Загрузка...</div>
  if (error) return (
    <div style={s.center}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={s.errorText}>{error}</div>
        <div style={s.hintText}>Настрой профиль через бота: /setup</div>
      </div>
    </div>
  )

  if (!user?.is_onboarded) return (
    <div style={s.center}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <div style={s.setupText}>Профиль не настроен</div>
        <div style={s.hintText}>Открой бота и выполни /setup чтобы настроить цели</div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <h2 style={s.title}>Профиль</h2>

      <div style={s.card}>
        <div style={s.avatar}>👤</div>
        <div style={s.name}>{user.first_name || 'Пользователь'}</div>
        <div style={s.goal}>{GOAL_LABELS[user.goal] || user.goal}</div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>📊 Данные</div>
        <Row label="Вес" value={`${user.weight_kg} кг`} />
        <Row label="Рост" value={`${user.height_cm} см`} />
        <Row label="Возраст" value={`${user.age} лет`} />
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>🎯 Дневные лимиты</div>
        <Row label="🔥 Калории" value={`${user.daily_calories} ккал`} highlight />
        <Row label="🥩 Белки" value={`${user.daily_protein} г`} />
        <Row label="🧈 Жиры" value={`${user.daily_fat} г`} />
        <Row label="🍞 Углеводы" value={`${user.daily_carbs} г`} />
      </div>

      <div style={s.hint}>Для изменения данных открой бота и выполни /setup</div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={{ ...s.rowVal, ...(highlight ? s.highlight : {}) }}>{value}</span>
    </div>
  )
}

const s = {
  page: { padding: '16px 12px' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' },
  card: { background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)', borderRadius: 16, padding: 16, marginBottom: 12, textAlign: 'center' },
  avatar: { fontSize: 52, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: 700 },
  goal: { fontSize: 14, color: 'var(--tg-theme-hint-color,#666)', marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: 'left' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--tg-theme-hint-color,#e0e0e0)' },
  rowLabel: { fontSize: 14, color: 'var(--tg-theme-hint-color,#666)' },
  rowVal: { fontSize: 15, fontWeight: 600 },
  highlight: { color: 'var(--tg-theme-button-color,#2196f3)', fontSize: 17 },
  hint: { textAlign: 'center', fontSize: 13, color: 'var(--tg-theme-hint-color,#999)', padding: '8px 0 24px' },
  errorText: { fontSize: 15, marginBottom: 8 },
  setupText: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  hintText: { fontSize: 14, color: 'var(--tg-theme-hint-color,#999)' },
}

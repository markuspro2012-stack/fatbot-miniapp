import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import { colors, card, shadows } from '../theme.js'

const GOAL_OPTIONS = [
  { id: 'lose',     label: '📉 Похудеть' },
  { id: 'maintain', label: '⚖️ Поддерживать' },
  { id: 'gain',     label: '📈 Набрать массу' },
]

const ACTIVITY_OPTIONS = [
  { id: 'sedentary',   label: 'Сидячий (нет спорта)' },
  { id: 'light',       label: 'Лёгкий (1-2 раза/нед)' },
  { id: 'moderate',    label: 'Умеренный (3-5 раз/нед)' },
  { id: 'active',      label: 'Активный (6-7 раз/нед)' },
  { id: 'very_active', label: 'Очень активный (ежедневно)' },
]

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const SIZE = 256
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = url
  })
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileRef = useRef(null)

  const load = () => {
    setLoading(true)
    api.getMe()
      .then(u => { setUser(u); setForm(toForm(u)) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toForm = (u) => ({
    first_name:     u.first_name || '',
    age:            u.age || '',
    height_cm:      u.height_cm || '',
    weight_kg:      u.weight_kg || '',
    gender:         u.gender || 'male',
    activity_level: u.activity_level || 'moderate',
    goal:           u.goal || 'maintain',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        first_name:     form.first_name || undefined,
        age:            form.age ? parseInt(form.age) : undefined,
        height_cm:      form.height_cm ? parseInt(form.height_cm) : undefined,
        weight_kg:      form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        gender:         form.gender,
        activity_level: form.activity_level,
        goal:           form.goal,
      }
      await api.updateProfile(payload)
      setSaved(true)
      setEditing(false)
      load()
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert('Ошибка: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoClick = () => fileRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhotoUploading(true)
    try {
      const dataUrl = await compressImage(file)
      await api.updateProfilePhoto(dataUrl)
      setUser(u => ({ ...u, profile_photo: dataUrl }))
    } catch (err) {
      alert('Не удалось загрузить фото: ' + err.message)
    } finally {
      setPhotoUploading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${colors.accentSubtle}`, borderTop: `3px solid ${colors.accent}`, animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (error || !user?.is_onboarded) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', padding: 32, textAlign: 'center', gap: 12 }}>
      <div style={s.avatarCircle}>👤</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>Профиль не настроен</div>
      <div style={{ fontSize: 14, color: colors.textSub }}>Открой бота и выполни /setup</div>
    </div>
  )

  const initial = (user.first_name || 'U')[0].toUpperCase()

  if (editing) return (
    <div style={s.page}>
      <div style={s.editHeader}>
        <button style={s.backBtn} onClick={() => setEditing(false)}>← Назад</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Редактировать</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={card}>
        <Field label="Имя" value={form.first_name} onChange={v => set('first_name', v)} placeholder="Твоё имя" />
        <Field label="Возраст" value={form.age} onChange={v => set('age', v)} placeholder="лет" type="number" />
        <Field label="Рост (см)" value={form.height_cm} onChange={v => set('height_cm', v)} placeholder="175" type="number" />
        <Field label="Вес (кг)" value={form.weight_kg} onChange={v => set('weight_kg', v)} placeholder="70" type="number" step="0.1" />

        <div style={s.label}>Пол</div>
        <div style={s.segmented}>
          {[{id:'male',label:'👨 Мужской'},{id:'female',label:'👩 Женский'}].map(g => (
            <button key={g.id} style={{ ...s.seg, ...(form.gender === g.id ? s.segActive : {}) }}
              onClick={() => set('gender', g.id)}>{g.label}</button>
          ))}
        </div>

        <div style={s.label}>Активность</div>
        <div style={s.selectWrap}>
          <select style={s.select} value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
            {ACTIVITY_OPTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        <div style={s.label}>Цель</div>
        <div style={s.goalGrid}>
          {GOAL_OPTIONS.map(g => (
            <button key={g.id} style={{ ...s.goalBtn, ...(form.goal === g.id ? s.goalActive : {}) }}
              onClick={() => set('goal', g.id)}>{g.label}</button>
          ))}
        </div>
      </div>

      <div style={s.infoBox}>
        💡 После сохранения автоматически пересчитаются дневные лимиты калорий и КБЖУ
      </div>

      <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
        {saving ? 'Сохраняю...' : '✅ Сохранить и пересчитать'}
      </button>

      <div style={{ height: 24 }} />
    </div>
  )

  return (
    <div style={s.page}>
      {saved && (
        <div style={s.toast}>✅ Профиль обновлён! Лимиты пересчитаны.</div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={s.title}>Профиль</div>

      <div style={{ ...card, textAlign: 'center', padding: 28, animation: 'scaleIn 300ms ease' }}>
        <div style={s.avatarWrap} onClick={handlePhotoClick}>
          {user.profile_photo ? (
            <img src={user.profile_photo} alt="avatar" style={s.avatarImg} />
          ) : (
            <div style={s.avatar}>{initial}</div>
          )}
          <div style={s.avatarOverlay}>
            {photoUploading
              ? <div style={s.photoSpinner} />
              : <span style={{ fontSize: 18 }}>📷</span>
            }
          </div>
        </div>
        <div style={s.name}>{user.first_name || 'Пользователь'}</div>
        <div style={s.goalBadge}>{GOAL_OPTIONS.find(g => g.id === user.goal)?.label || user.goal}</div>
        <button style={s.editBtn} onClick={() => setEditing(true)}>✏️ Редактировать профиль</button>
      </div>

      <div style={card}>
        <div style={s.cardTitle}>📊 Мои данные</div>
        <Row label="Пол" value={user.gender === 'male' ? '👨 Мужской' : '👩 Женский'} />
        <Row label="Возраст" value={`${user.age} лет`} />
        <Row label="Рост" value={`${user.height_cm} см`} />
        <Row label="Вес" value={`${user.weight_kg} кг`} />
        <Row label="Активность" value={ACTIVITY_OPTIONS.find(a => a.id === user.activity_level)?.label || user.activity_level} />
      </div>

      <div style={card}>
        <div style={s.cardTitle}>🎯 Дневные цели</div>
        <div style={s.calRow}>
          <div style={{ ...s.calBig, background: colors.accentGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {user.daily_calories}
          </div>
          <div style={s.calLabel}>ккал / день</div>
        </div>
        <div style={s.macroGrid}>
          <MacroCard label="Белки"    value={user.daily_protein}  unit="г" color={colors.protein} />
          <MacroCard label="Жиры"     value={user.daily_fat}      unit="г" color={colors.fat} />
          <MacroCard label="Углеводы" value={user.daily_carbs}    unit="г" color={colors.carbs} />
        </div>
      </div>

      <div style={s.hint}>Нажми на фото чтобы изменить его</div>
      <div style={{ height: 16 }} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', step }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={s.label}>{label}</div>
      <input
        style={s.input}
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${colors.divider}` }}>
      <span style={{ fontSize: 14, color: colors.textSub }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{value}</span>
    </div>
  )
}

function MacroCard({ label, value, unit, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 12px', border: `1px solid rgba(255,255,255,0.07)`, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{unit}</div>
      <div style={{ fontSize: 11, color: colors.textSub, marginTop: 4 }}>{label}</div>
    </div>
  )
}

const s = {
  page: { padding: '16px 14px' },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: -0.3, color: colors.text, marginBottom: 18 },
  avatarWrap: { position: 'relative', width: 88, height: 88, margin: '0 auto 16px', cursor: 'pointer' },
  avatar: { width: 88, height: 88, borderRadius: '50%', background: colors.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#fff', boxShadow: '0 0 30px rgba(124,92,252,0.5)' },
  avatarImg: { width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 30px rgba(124,92,252,0.5)', display: 'block' },
  avatarOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: colors.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', border: '2px solid #1a1a2e' },
  photoSpinner: { width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', animation: 'spin 0.7s linear infinite' },
  avatarCircle: { width: 80, height: 80, borderRadius: '50%', background: colors.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 },
  name: { fontSize: 22, fontWeight: 800, color: colors.text, marginBottom: 8 },
  goalBadge: { display: 'inline-block', fontSize: 13, fontWeight: 600, background: 'rgba(124,92,252,0.2)', color: colors.accentSoft, padding: '6px 16px', borderRadius: 20, border: `1px solid ${colors.accentBorder}`, marginBottom: 16 },
  editBtn: { background: colors.glass, border: `1.5px solid ${colors.accentBorder}`, borderRadius: 14, padding: '11px 24px', color: colors.accentSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 4 },
  calRow: { textAlign: 'center', padding: '14px 0' },
  calBig: { fontSize: 42, fontWeight: 800 },
  calLabel: { fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  macroGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 },
  hint: { textAlign: 'center', fontSize: 12, color: colors.textMuted, padding: '4px 0 16px' },
  editHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 10, padding: '8px 14px', color: colors.textSub, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  label: { fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  input: { width: '100%', padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${colors.glassBorder}`, background: colors.glassInput, color: colors.text, fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  segmented: { display: 'flex', gap: 8, marginBottom: 18 },
  seg: { flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${colors.glassBorder}`, background: colors.glass, color: colors.textSub, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', transition: 'all 150ms ease' },
  segActive: { background: 'rgba(124,92,252,0.25)', borderColor: colors.accentBorder, color: colors.accentSoft, fontWeight: 700 },
  selectWrap: { marginBottom: 18 },
  select: { width: '100%', padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${colors.glassBorder}`, background: colors.glassInput, color: colors.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' },
  goalGrid: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 },
  goalBtn: { padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${colors.glassBorder}`, background: colors.glass, color: colors.textSub, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', textAlign: 'left', transition: 'all 150ms ease' },
  goalActive: { background: 'rgba(124,92,252,0.25)', borderColor: colors.accentBorder, color: colors.accentSoft, fontWeight: 700 },
  infoBox: { background: 'rgba(124,92,252,0.10)', border: `1px solid ${colors.accentBorder}`, borderRadius: 14, padding: '12px 16px', fontSize: 13, color: colors.accentSoft, marginBottom: 16, lineHeight: 1.5 },
  saveBtn: { display: 'block', width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: colors.accentGradient, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: shadows.btn, fontFamily: 'inherit', transition: 'opacity 200ms ease' },
  toast: { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: colors.success, color: '#fff', padding: '10px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, zIndex: 200, animation: 'slideUp 300ms ease', whiteSpace: 'nowrap' },
}

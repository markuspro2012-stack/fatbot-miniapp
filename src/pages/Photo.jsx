import { useState, useRef } from 'react'
import { api } from '../api.js'

const MEALS = [
  { id: 'breakfast', label: '🌅 Завтрак' },
  { id: 'lunch', label: '☀️ Обед' },
  { id: 'dinner', label: '🌙 Ужин' },
  { id: 'snack', label: '🍎 Перекус' },
]

export default function Photo({ onNavigate }) {
  const [step, setStep] = useState('pick') // pick | analyzing | confirm | saving | done
  const [result, setResult] = useState(null)
  const [meal, setMeal] = useState('lunch')
  const [grams, setGrams] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStep('analyzing')
    setError(null)
    try {
      const res = await api.analyzePhoto(file)
      setResult(res)
      setGrams(String(Math.round(res.amount_g)))
      setStep('confirm')
    } catch (e) {
      setError(e.message === 'not_food' ? 'На фото не распознана еда 😕' : '⚠️ Ошибка распознавания: ' + e.message)
      setStep('pick')
    }
  }

  const save = async () => {
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0) return
    setStep('saving')
    const ratio = g / result.amount_g
    try {
      await api.addFood({
        food_name: result.food_name,
        amount_g: g,
        calories: Math.round(result.calories * ratio * 10) / 10,
        protein: Math.round(result.protein * ratio * 10) / 10,
        fat: Math.round(result.fat * ratio * 10) / 10,
        carbs: Math.round(result.carbs * ratio * 10) / 10,
        meal_type: meal,
      })
      setStep('done')
      setTimeout(() => onNavigate('today'), 1500)
    } catch (e) {
      alert(e.message)
      setStep('confirm')
    }
  }

  if (step === 'done') return <div style={s.center}><div style={s.big}>✅<br />Добавлено!</div></div>

  if (step === 'analyzing') return (
    <div style={s.center}>
      {preview && <img src={preview} style={s.previewImg} alt="" />}
      <div style={s.analyzing}>🤖 Анализирую фото...</div>
    </div>
  )

  if (step === 'confirm' && result) {
    const conf = { high: '🟢', medium: '🟡', low: '🔴' }[result.confidence] || '🟡'
    return (
      <div style={s.page}>
        <h2 style={s.title}>Результат AI {conf}</h2>
        {preview && <img src={preview} style={s.previewImg} alt="" />}
        <div style={s.card}>
          <div style={s.foodName}>{result.food_name}</div>
          <div style={s.macros}>
            🔥 {Math.round(result.calories)} ккал · Б{result.protein}г · Ж{result.fat}г · У{result.carbs}г
          </div>

          <label style={s.label}>Граммы</label>
          <input
            style={s.input}
            type="number"
            value={grams}
            onChange={e => setGrams(e.target.value)}
          />

          <label style={s.label}>Приём пищи</label>
          <div style={s.mealGrid}>
            {MEALS.map(m => (
              <button
                key={m.id}
                style={{ ...s.mealBtn, ...(meal === m.id ? s.mealActive : {}) }}
                onClick={() => setMeal(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div style={s.actions}>
            <button style={s.cancelBtn} onClick={() => { setStep('pick'); setResult(null); setPreview(null) }}>
              ← Заново
            </button>
            <button style={s.saveBtn} onClick={save} disabled={!grams}>
              ✅ Сохранить
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <h2 style={s.title}>Фото AI</h2>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        <p style={s.hint}>Сфотографируй еду — AI определит калории и КБЖУ автоматически</p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        <button style={s.cameraBtn} onClick={() => { fileRef.current.setAttribute('capture','environment'); fileRef.current.click() }}>
          📷 Сделать фото
        </button>
        <button style={s.galleryBtn} onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}>
          🖼️ Выбрать из галереи
        </button>
      </div>
    </div>
  )
}

const s = {
  page: { padding: '16px 12px' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 16 },
  big: { fontSize: 28, textAlign: 'center', lineHeight: 1.5 },
  analyzing: { fontSize: 16, color: 'var(--tg-theme-hint-color,#999)' },
  previewImg: { width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 16, marginBottom: 12 },
  card: { background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)', borderRadius: 16, padding: 16, marginBottom: 12 },
  hint: { color: 'var(--tg-theme-hint-color,#999)', fontSize: 14, lineHeight: 1.5, marginBottom: 16, textAlign: 'center' },
  cameraBtn: { display: 'block', width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
  galleryBtn: { display: 'block', width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid var(--tg-theme-button-color,#2196f3)', background: 'none', color: 'var(--tg-theme-button-color,#2196f3)', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  error: { background: '#fff3f3', color: '#e53935', borderRadius: 12, padding: '12px 16px', marginBottom: 12, fontSize: 14 },
  foodName: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  macros: { fontSize: 13, color: 'var(--tg-theme-hint-color,#666)', marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tg-theme-hint-color,#666)' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'var(--tg-theme-bg-color,#fff)', color: 'var(--tg-theme-text-color,#000)', fontSize: 15, outline: 'none', marginBottom: 14 },
  mealGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
  mealBtn: { padding: '10px', borderRadius: 10, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--tg-theme-text-color,#000)' },
  mealActive: { borderColor: 'var(--tg-theme-button-color,#2196f3)', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff' },
  actions: { display: 'flex', gap: 8 },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--tg-theme-text-color,#000)' },
  saveBtn: { flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
}

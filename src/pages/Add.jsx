import { useState } from 'react'
import { api } from '../api.js'

const MEALS = [
  { id: 'breakfast', label: '🌅 Завтрак' },
  { id: 'lunch', label: '☀️ Обед' },
  { id: 'dinner', label: '🌙 Ужин' },
  { id: 'snack', label: '🍎 Перекус' },
]

export default function Add({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState('')
  const [meal, setMeal] = useState('breakfast')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setSelected(null)
    try {
      const res = await api.searchFood(query)
      setResults(res.products)
    } catch (e) {
      alert(e.message)
    } finally {
      setSearching(false)
    }
  }

  const save = async () => {
    if (!selected || !grams || !meal) return
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0) return
    const ratio = g / 100
    setSaving(true)
    try {
      await api.addFood({
        food_name: selected.name,
        amount_g: g,
        calories: Math.round(selected.kcal_100g * ratio * 10) / 10,
        protein: Math.round(selected.protein_100g * ratio * 10) / 10,
        fat: Math.round(selected.fat_100g * ratio * 10) / 10,
        carbs: Math.round(selected.carbs_100g * ratio * 10) / 10,
        meal_type: meal,
      })
      setDone(true)
      setTimeout(() => {
        setDone(false)
        setQuery('')
        setResults([])
        setSelected(null)
        setGrams('')
        onNavigate('today')
      }, 1200)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) return <div style={s.center}><div style={s.success}>✅ Добавлено!</div></div>

  return (
    <div style={s.page}>
      <h2 style={s.title}>Добавить еду</h2>

      {/* Поиск */}
      <div style={s.searchRow}>
        <input
          style={s.input}
          placeholder="Название продукта или блюда..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button style={s.searchBtn} onClick={search} disabled={searching}>
          {searching ? '...' : '🔍'}
        </button>
      </div>

      {/* Результаты */}
      {results.length > 0 && !selected && (
        <div style={s.card}>
          {results.map((p, i) => (
            <button key={i} style={s.resultItem} onClick={() => setSelected(p)}>
              <div style={s.resultName}>{p.name}</div>
              <div style={s.resultSub}>
                {p.kcal_100g} ккал · Б{p.protein_100g} Ж{p.fat_100g} У{p.carbs_100g} (на 100г)
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Выбранный продукт */}
      {selected && (
        <div style={s.card}>
          <div style={s.selectedName}>{selected.name}</div>
          <div style={s.selectedSub}>
            На 100г: {selected.kcal_100g} ккал · Б{selected.protein_100g}г Ж{selected.fat_100g}г У{selected.carbs_100g}г
          </div>

          <label style={s.label}>Граммы</label>
          <input
            style={s.input}
            type="number"
            placeholder="Например: 200"
            value={grams}
            onChange={e => setGrams(e.target.value)}
          />

          {grams && !isNaN(parseFloat(grams)) && (
            <div style={s.preview}>
              🔥 {Math.round(selected.kcal_100g * parseFloat(grams) / 100)} ккал
              · Б{Math.round(selected.protein_100g * parseFloat(grams) / 100)}г
              · Ж{Math.round(selected.fat_100g * parseFloat(grams) / 100)}г
              · У{Math.round(selected.carbs_100g * parseFloat(grams) / 100)}г
            </div>
          )}

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
            <button style={s.cancelBtn} onClick={() => setSelected(null)}>← Назад</button>
            <button style={s.saveBtn} onClick={save} disabled={saving || !grams}>
              {saving ? 'Сохраняю...' : '✅ Сохранить'}
            </button>
          </div>
        </div>
      )}

      {results.length === 0 && !searching && query && (
        <div style={s.hint}>Ничего не найдено. Попробуй на английском.</div>
      )}

      {!query && (
        <div style={s.hint}>Введи название продукта и нажми 🔍<br />Или используй вкладку 📸 для фото</div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '16px 12px' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  success: { fontSize: 28, textAlign: 'center' },
  searchRow: { display: 'flex', gap: 8, marginBottom: 12 },
  input: { flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)', color: 'var(--tg-theme-text-color,#000)', fontSize: 15, outline: 'none', width: '100%' },
  searchBtn: { padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', fontSize: 18, cursor: 'pointer' },
  card: { background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)', borderRadius: 16, padding: 16, marginBottom: 12 },
  resultItem: { display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--tg-theme-hint-color,#e0e0e0)', padding: '10px 0', cursor: 'pointer' },
  resultName: { fontSize: 14, fontWeight: 600, color: 'var(--tg-theme-text-color,#000)' },
  resultSub: { fontSize: 12, color: 'var(--tg-theme-hint-color,#999)', marginTop: 3 },
  selectedName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  selectedSub: { fontSize: 12, color: 'var(--tg-theme-hint-color,#999)', marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--tg-theme-hint-color,#666)' },
  preview: { fontSize: 13, color: 'var(--tg-theme-button-color,#2196f3)', margin: '8px 0 14px', fontWeight: 600 },
  mealGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
  mealBtn: { padding: '10px', borderRadius: 10, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--tg-theme-text-color,#000)' },
  mealActive: { borderColor: 'var(--tg-theme-button-color,#2196f3)', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff' },
  actions: { display: 'flex', gap: 8 },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--tg-theme-hint-color,#ddd)', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--tg-theme-text-color,#000)' },
  saveBtn: { flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tg-theme-button-color,#2196f3)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  hint: { textAlign: 'center', padding: '32px 16px', color: 'var(--tg-theme-hint-color,#999)', lineHeight: 1.6 },
}

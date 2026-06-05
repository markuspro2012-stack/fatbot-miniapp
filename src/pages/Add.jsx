import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api.js'
import { colors, card, shadows } from '../theme.js'

const MEALS = [
  { id: 'breakfast', label: '🌅 Завтрак' },
  { id: 'lunch',    label: '☀️ Обед' },
  { id: 'dinner',   label: '🌙 Ужин' },
  { id: 'snack',    label: '🍎 Перекус' },
]

const EMPTY_FORM = { name: '', kcal_100g: '', protein_100g: '', fat_100g: '', carbs_100g: '' }

// ── Main component ────────────────────────────────────────────────────────────

export default function Add({ onNavigate }) {
  const [mode, setMode] = useState('search') // 'search' | 'myfoods'

  // Search mode
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState('')
  const [meal, setMeal] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState(false)

  // MyFoods mode
  const [myFoods, setMyFoods] = useState([])
  const [myFoodsLoading, setMyFoodsLoading] = useState(false)
  const [myFoodsQuery, setMyFoodsQuery] = useState('')
  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [dupInfo, setDupInfo] = useState(null) // {id, name} duplicate detected

  const loadMyFoods = async () => {
    setMyFoodsLoading(true)
    try {
      const r = await api.getUserFoods()
      setMyFoods(r.foods)
    } catch (e) {
      console.error(e)
    } finally {
      setMyFoodsLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'myfoods' && myFoods.length === 0) loadMyFoods()
  }, [mode])

  // ── Search mode ─────────────────────────────────────────────────────────────

  const search = async () => {
    if (!query.trim()) return
    setSearching(true); setResults([]); setSelected(null)
    try { const r = await api.searchFood(query); setResults(r.products) }
    catch (e) { alert(e.message) }
    finally { setSearching(false) }
  }

  const save = async () => {
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0 || !selected) return
    const ratio = g / 100
    setSaving(true)
    try {
      await api.addFood({
        food_name: selected.name, amount_g: g,
        calories: Math.round(selected.kcal_100g * ratio * 10) / 10,
        protein:  Math.round(selected.protein_100g * ratio * 10) / 10,
        fat:      Math.round(selected.fat_100g * ratio * 10) / 10,
        carbs:    Math.round(selected.carbs_100g * ratio * 10) / 10,
        meal_type: meal,
      })
      setDone(true)
      setTimeout(() => {
        setDone(false); setQuery(''); setResults([]); setSelected(null); setGrams('')
        onNavigate('today')
      }, 1400)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  // ── MyFoods CRUD ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(EMPTY_FORM); setFormError(''); setEditingId(null); setFormMode('add')
  }
  const openEdit = (food) => {
    setForm({ name: food.name, kcal_100g: food.kcal_100g, protein_100g: food.protein_100g, fat_100g: food.fat_100g, carbs_100g: food.carbs_100g })
    setFormError(''); setEditingId(food.id); setFormMode('edit')
  }
  const closeForm = () => { setFormMode(null); setDupInfo(null); setFormError('') }

  const validateForm = () => {
    if (!form.name.trim()) return 'Введите название продукта'
    const kcal = parseFloat(form.kcal_100g)
    if (isNaN(kcal) || kcal < 0) return 'Калории не могут быть отрицательными'
    if (parseFloat(form.protein_100g) < 0) return 'Белки не могут быть отрицательными'
    if (parseFloat(form.fat_100g) < 0) return 'Жиры не могут быть отрицательными'
    if (parseFloat(form.carbs_100g) < 0) return 'Углеводы не могут быть отрицательными'
    return null
  }

  const saveFood = async (forceUpdate = false) => {
    const err = validateForm()
    if (err) { setFormError(err); return }

    const payload = {
      name: form.name.trim(),
      kcal_100g: parseFloat(form.kcal_100g) || 0,
      protein_100g: parseFloat(form.protein_100g) || 0,
      fat_100g: parseFloat(form.fat_100g) || 0,
      carbs_100g: parseFloat(form.carbs_100g) || 0,
    }

    setFormSaving(true)
    try {
      if (formMode === 'edit' || forceUpdate) {
        const id = forceUpdate ? dupInfo.id : editingId
        await api.updateUserFood(id, payload)
      } else {
        const r = await api.createUserFood(payload)
        if (!r.ok && r.duplicate) {
          setDupInfo({ id: r.id, name: r.name })
          setFormSaving(false)
          return
        }
      }
      closeForm()
      await loadMyFoods()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setFormSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await api.deleteUserFood(deleteConfirm)
      setMyFoods(f => f.filter(x => x.id !== deleteConfirm))
    } catch (e) { alert(e.message) }
    finally { setDeleteConfirm(null) }
  }

  const selectMyFood = (food) => {
    setSelected({ ...food }); setGrams(''); setMode('search')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (done) return (
    <div style={s.center}>
      <div style={{ animation: 'scaleIn 400ms cubic-bezier(0.34,1.56,0.64,1)' }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="26" stroke={colors.success} strokeWidth="3" fill="none"/>
          <path d="M16 28l8 8 16-16" stroke={colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginTop: 12 }}>Добавлено!</div>
      <div style={{ fontSize: 13, color: colors.textSub }}>Переходим в дневник...</div>
    </div>
  )

  const g = parseFloat(grams)
  const preview = selected && !isNaN(g) && g > 0 ? {
    cal: Math.round(selected.kcal_100g * g / 100),
    p: Math.round(selected.protein_100g * g / 100),
    f: Math.round(selected.fat_100g * g / 100),
    c: Math.round(selected.carbs_100g * g / 100),
  } : null

  const filteredMyFoods = myFoods.filter(f =>
    !myFoodsQuery || f.name.toLowerCase().includes(myFoodsQuery.toLowerCase())
  )

  return (
    <div style={s.page}>
      {/* Mode toggle */}
      {!selected && (
        <div style={s.toggle}>
          <button style={{ ...s.toggleBtn, ...(mode === 'search' ? s.toggleActive : {}) }}
            onClick={() => setMode('search')}>🔍 Поиск</button>
          <button style={{ ...s.toggleBtn, ...(mode === 'myfoods' ? s.toggleActive : {}) }}
            onClick={() => setMode('myfoods')}>⭐ Мои продукты</button>
        </div>
      )}

      {/* ── SEARCH MODE ─────────────────────────────────────────────────── */}
      {mode === 'search' && (
        <>
          {!selected && (
            <>
              <div style={s.searchWrap}>
                <div style={{ ...s.searchBox, borderColor: focused ? colors.accentBorder : colors.glassBorder }}>
                  <svg style={{ flexShrink: 0, color: focused ? colors.accentSoft : colors.textMuted }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    style={s.searchInput}
                    placeholder="Название продукта или блюда..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                  {searching && <div style={s.spinner} />}
                </div>
                <button style={s.searchBtn} onClick={search} disabled={searching}>Найти</button>
              </div>

              {results.length > 0 && (
                <div style={card}>
                  {results.map((p, i) => (
                    <button key={i} style={{ ...s.resultItem, animation: `slideUp 200ms ease ${i * 40}ms both` }}
                      onClick={() => { setSelected(p); setGrams('') }}>
                      <div style={s.resultLeft}>
                        <div style={s.resultName}>
                          {p.user_food_id && <span style={s.myBadge}>★</span>}
                          {p.name}
                        </div>
                        <div style={s.resultSub}>Б{p.protein_100g} Ж{p.fat_100g} У{p.carbs_100g} на 100г</div>
                      </div>
                      <div style={s.calBadge}>{p.kcal_100g} ккал</div>
                    </button>
                  ))}
                </div>
              )}

              {!results.length && !searching && !query && (
                <div style={s.hint}>В базе 200+ продуктов на русском.<br/>Введи название и нажми Найти<br/>или перейди на вкладку 📸 для фото</div>
              )}
              {!results.length && !searching && query && (
                <div style={s.hint}>Ничего не найдено.<br/>Попробуй другое название, сфотографируй блюдо 📸<br/>или добавь свой продукт в ⭐ Мои продукты</div>
              )}
            </>
          )}

          {selected && (
            <div style={{ ...card, animation: 'slideUp 250ms ease' }}>
              <div style={s.accentStrip} />
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                {selected.user_food_id && <span style={s.myBadge}>★ Мой продукт</span>}
                <div style={s.selName}>{selected.name}</div>
              </div>
              <div style={s.selMacros}>
                <span style={{ ...s.chip, color: colors.protein }}>Б {selected.protein_100g}</span>
                <span style={{ ...s.chip, color: colors.fat }}>Ж {selected.fat_100g}</span>
                <span style={{ ...s.chip, color: colors.carbs }}>У {selected.carbs_100g}</span>
                <span style={{ ...s.chip, color: colors.accentSoft }}>{selected.kcal_100g} ккал</span>
                <span style={{ ...s.chip, color: colors.textMuted }}>на 100г</span>
              </div>

              <div style={s.label}>Количество (граммы)</div>
              <input style={s.input} type="number" placeholder="Например: 200" value={grams}
                onChange={e => setGrams(e.target.value)} autoFocus />

              {preview && (
                <div style={s.preview}>
                  <PVal label="ккал"     value={preview.cal} color={colors.accentSoft} big />
                  <PVal label="белки"    value={`${preview.p}г`} color={colors.protein} />
                  <PVal label="жиры"     value={`${preview.f}г`} color={colors.fat} />
                  <PVal label="углеводы" value={`${preview.c}г`} color={colors.carbs} />
                </div>
              )}

              <div style={s.label}>Приём пищи</div>
              <div style={s.mealScroll}>
                {MEALS.map(m => (
                  <button key={m.id} style={{ ...s.mealChip, ...(meal === m.id ? s.mealChipActive : {}) }}
                    onClick={() => setMeal(m.id)}>{m.label}</button>
                ))}
              </div>

              <div style={s.actions}>
                <button style={s.cancelBtn} onClick={() => setSelected(null)}>← Назад</button>
                <button style={{ ...s.saveBtn, opacity: !grams || saving ? 0.6 : 1 }}
                  onClick={save} disabled={saving || !grams}>
                  {saving ? 'Сохраняю...' : '✅ Сохранить'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MY FOODS MODE ───────────────────────────────────────────────── */}
      {mode === 'myfoods' && (
        <>
          {/* Search within my foods */}
          <div style={s.mySearchWrap}>
            <input style={s.mySearchInput} placeholder="Поиск в моих продуктах..."
              value={myFoodsQuery} onChange={e => setMyFoodsQuery(e.target.value)} />
          </div>

          {myFoodsLoading && <div style={s.hint}>Загружаю...</div>}

          {!myFoodsLoading && filteredMyFoods.length === 0 && (
            <div style={s.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                {myFoodsQuery ? 'Ничего не найдено' : 'Нет своих продуктов'}
              </div>
              <div style={{ fontSize: 13, color: colors.textSub, textAlign: 'center', lineHeight: 1.6 }}>
                {myFoodsQuery ? 'Попробуй другое название' : 'Добавь свои блюда и продукты\nс точным составом КБЖУ'}
              </div>
            </div>
          )}

          {filteredMyFoods.map((food, i) => (
            <div key={food.id} style={{ ...s.myFoodCard, animation: `slideUp 150ms ease ${i*30}ms both` }}>
              <div style={s.myFoodMain} onClick={() => selectMyFood(food)}>
                <div style={s.myFoodName}>{food.name}</div>
                <div style={s.myFoodMacros}>Б{food.protein_100g} Ж{food.fat_100g} У{food.carbs_100g}</div>
              </div>
              <div style={s.myFoodKcal}>{food.kcal_100g}<span style={{ fontSize:10, opacity:.7 }}> ккал</span></div>
              <div style={s.myFoodActions}>
                <button style={s.editBtn} onClick={() => openEdit(food)}>✏️</button>
                <button style={s.delBtn} onClick={() => setDeleteConfirm(food.id)}>🗑</button>
              </div>
            </div>
          ))}

          <button style={s.addFoodBtn} onClick={openAdd}>+ Добавить продукт</button>
          <div style={{ height: 24 }} />
        </>
      )}

      {/* ── PRODUCT FORM (add / edit) — Portal, renders at document.body ── */}
      {formMode && createPortal(
        <div style={s.overlay} onClick={closeForm}>
          <div style={s.formCard} onClick={e => e.stopPropagation()}>
            <div style={s.formTitle}>{formMode === 'add' ? '+ Новый продукт' : '✏️ Редактировать'}</div>

            <FField label="Название" value={form.name} onChange={v => setForm(f=>({...f,name:v}))} placeholder="Например: Домашние блины" />
            <div style={s.formRow}>
              <FField label="Калории" value={form.kcal_100g} onChange={v => setForm(f=>({...f,kcal_100g:v}))} placeholder="0" type="number" />
              <FField label="Белки" value={form.protein_100g} onChange={v => setForm(f=>({...f,protein_100g:v}))} placeholder="0" type="number" />
            </div>
            <div style={s.formRow}>
              <FField label="Жиры" value={form.fat_100g} onChange={v => setForm(f=>({...f,fat_100g:v}))} placeholder="0" type="number" />
              <FField label="Углеводы" value={form.carbs_100g} onChange={v => setForm(f=>({...f,carbs_100g:v}))} placeholder="0" type="number" />
            </div>
            <div style={s.formNote}>Все значения — на 100 г продукта</div>

            {formError && <div style={s.formError}>{formError}</div>}

            {dupInfo && (
              <div style={s.dupWarning}>
                Продукт «{dupInfo.name}» уже есть в базе. Обновить его данные?
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button style={s.dupNo} onClick={() => setDupInfo(null)}>Нет</button>
                  <button style={s.dupYes} onClick={() => saveFood(true)}>Обновить</button>
                </div>
              </div>
            )}

            <div style={s.formActions}>
              <button style={s.cancelBtn2} onClick={closeForm}>Отмена</button>
              <button style={{ ...s.saveBtn2, opacity: formSaving ? 0.6 : 1 }}
                onClick={() => saveFood(false)} disabled={formSaving}>
                {formSaving ? 'Сохраняю...' : '✅ Сохранить'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRM — Portal ──────────────────────────────────────── */}
      {deleteConfirm && createPortal(
        <div style={s.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...s.formCard, maxWidth: 300 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign:'center', marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, textAlign:'center', marginBottom: 8 }}>
              Удалить продукт?
            </div>
            <div style={{ fontSize: 13, color: colors.textSub, textAlign:'center', marginBottom: 20 }}>
              «{myFoods.find(f=>f.id===deleteConfirm)?.name}»
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={s.cancelBtn2} onClick={() => setDeleteConfirm(null)}>Отмена</button>
              <button style={{ ...s.saveBtn2, background: colors.danger }} onClick={confirmDelete}>Удалить</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PVal({ label, value, color, big }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize: big ? 22 : 16, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, textTransform:'uppercase', letterSpacing: 0.3 }}>{label}</div>
    </div>
  )
}

function FField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ flex: 1, marginBottom: 12 }}>
      <div style={s.fieldLabel}>{label}</div>
      <input style={s.fieldInput} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} />
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page: { padding: '12px 14px', minHeight: '100%' },
  center: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70vh', gap: 8 },

  toggle: { display:'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4 },
  toggleBtn: { flex: 1, padding: '10px 8px', borderRadius: 11, border: 'none', background: 'none', color: colors.textSub, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease' },
  toggleActive: { background: 'rgba(124,92,252,0.3)', color: colors.accentSoft, boxShadow: '0 2px 8px rgba(124,92,252,0.3)' },

  searchWrap: { display:'flex', gap: 10, marginBottom: 14 },
  searchBox: { flex: 1, display:'flex', alignItems:'center', gap: 10, padding:'12px 14px', borderRadius: 16, border:`1.5px solid ${colors.glassBorder}`, background: colors.glassInput, backdropFilter:'blur(10px)', transition:'border-color 200ms ease' },
  searchInput: { flex: 1, background:'none', border:'none', color: colors.text, fontSize: 15, fontFamily:'inherit', outline:'none', minWidth: 0 },
  searchBtn: { background: colors.accentGradient, border:'none', borderRadius: 14, padding:'12px 18px', color:'#fff', fontSize: 14, fontWeight: 700, cursor:'pointer', whiteSpace:'nowrap', boxShadow: shadows.btn },
  spinner: { width: 18, height: 18, borderRadius:'50%', border:`2px solid ${colors.accentSubtle}`, borderTop:`2px solid ${colors.accent}`, animation:'spin 0.7s linear infinite', flexShrink: 0 },

  resultItem: { display:'flex', alignItems:'center', width:'100%', background:'none', border:'none', textAlign:'left', cursor:'pointer', padding:'12px 0', borderBottom:`1px solid ${colors.divider}`, gap: 10 },
  resultLeft: { flex: 1, minWidth: 0 },
  resultName: { fontSize: 14, fontWeight: 600, color: colors.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'flex', alignItems:'center', gap: 5 },
  resultSub: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  calBadge: { flexShrink: 0, fontSize: 12, background: colors.accentSubtle, color: colors.accentSoft, padding:'4px 10px', borderRadius: 10, fontWeight: 700 },
  myBadge: { fontSize: 11, background:'rgba(255,215,0,0.2)', color:'#ffd700', padding:'2px 6px', borderRadius: 6, fontWeight: 700, whiteSpace:'nowrap' },

  hint: { textAlign:'center', padding:'40px 20px', color: colors.textMuted, fontSize: 14, lineHeight: 1.7 },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', color: colors.text },

  accentStrip: { height: 3, borderRadius:'16px 16px 0 0', background: colors.accentGradient, margin:'-18px -18px 16px', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  selName: { fontSize: 17, fontWeight: 700, color: colors.text },
  selMacros: { display:'flex', gap: 6, flexWrap:'wrap', marginBottom: 18 },
  chip: { fontSize: 12, fontWeight: 600, background:'rgba(255,255,255,0.07)', padding:'4px 10px', borderRadius: 8 },
  label: { fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform:'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { width:'100%', padding:'13px 16px', borderRadius: 14, border:`1.5px solid ${colors.glassBorder}`, background: colors.glassInput, color: colors.text, fontSize: 16, fontFamily:'inherit', outline:'none', marginBottom: 14, boxSizing:'border-box' },
  preview: { display:'flex', justifyContent:'space-around', padding:'14px 0', marginBottom: 14, background:'rgba(124,92,252,0.08)', borderRadius: 14, animation:'fadeIn 200ms ease' },
  mealScroll: { display:'flex', gap: 8, overflowX:'auto', paddingBottom: 4, marginBottom: 18, WebkitOverflowScrolling:'touch' },
  mealChip: { flexShrink: 0, padding:'10px 18px', borderRadius: 20, border:`1.5px solid ${colors.glassBorder}`, background: colors.glass, color: colors.textSub, fontSize: 13, fontWeight: 600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 150ms ease' },
  mealChipActive: { background:'rgba(124,92,252,0.25)', borderColor: colors.accentBorder, color: colors.accentSoft },
  actions: { display:'flex', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, border:`1.5px solid ${colors.glassBorder}`, background: colors.glass, color: colors.textSub, cursor:'pointer', fontSize: 14, fontFamily:'inherit' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 14, border:'none', background: colors.accentGradient, color:'#fff', cursor:'pointer', fontSize: 15, fontWeight: 700, fontFamily:'inherit', boxShadow: shadows.btn, transition:'opacity 200ms ease' },

  // My foods
  mySearchWrap: { marginBottom: 14 },
  mySearchInput: { width:'100%', padding:'12px 16px', borderRadius: 14, border:`1.5px solid ${colors.glassBorder}`, background: colors.glassInput, color: colors.text, fontSize: 15, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  myFoodCard: { display:'flex', alignItems:'center', gap: 10, padding:'13px 14px', borderRadius: 14, background: colors.glass, border:`1px solid ${colors.glassBorder}`, marginBottom: 8 },
  myFoodMain: { flex: 1, minWidth: 0, cursor:'pointer' },
  myFoodName: { fontSize: 14, fontWeight: 600, color: colors.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  myFoodMacros: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  myFoodKcal: { fontSize: 14, fontWeight: 700, color: colors.accentSoft, flexShrink: 0 },
  myFoodActions: { display:'flex', gap: 6, flexShrink: 0 },
  editBtn: { padding:'7px 10px', borderRadius: 10, border:`1px solid ${colors.glassBorder}`, background:'rgba(255,255,255,0.06)', cursor:'pointer', fontSize: 14 },
  delBtn: { padding:'7px 10px', borderRadius: 10, border:`1px solid rgba(248,113,113,0.3)`, background:'rgba(248,113,113,0.08)', cursor:'pointer', fontSize: 14 },
  addFoodBtn: { display:'block', width:'100%', marginTop: 16, padding: 14, borderRadius: 14, border:`1.5px dashed ${colors.accentBorder}`, background:'rgba(124,92,252,0.06)', color: colors.accentSoft, fontSize: 15, fontWeight: 700, cursor:'pointer', fontFamily:'inherit', transition:'all 150ms ease' },

  // Form overlay
  overlay: { position:'fixed', inset: 0, background:'rgba(0,0,0,0.75)', zIndex: 1000, display:'flex', alignItems:'flex-end', justifyContent:'center', backdropFilter:'blur(4px)', animation:'fadeIn 200ms ease' },
  formCard: { width:'100%', maxWidth: 480, background:'#141428', borderRadius:'20px 20px 0 0', padding: 24, paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))', boxShadow:'0 -8px 40px rgba(0,0,0,0.6)', animation:'slideUp 250ms ease', maxHeight:'88vh', overflowY:'auto' },
  formTitle: { fontSize: 18, fontWeight: 800, color: colors.text, marginBottom: 20 },
  formRow: { display:'flex', gap: 12 },
  formNote: { fontSize: 11, color: colors.textMuted, marginBottom: 8, marginTop: -4 },
  formError: { background:'rgba(248,113,113,0.12)', border:`1px solid rgba(248,113,113,0.3)`, borderRadius: 10, padding:'10px 14px', color: colors.danger, fontSize: 13, marginBottom: 12 },
  formActions: { display:'flex', gap: 10, marginTop: 8 },
  cancelBtn2: { flex: 1, padding: 14, borderRadius: 14, border:`1.5px solid ${colors.glassBorder}`, background: colors.glass, color: colors.textSub, cursor:'pointer', fontSize: 14, fontFamily:'inherit' },
  saveBtn2: { flex: 2, padding: 14, borderRadius: 14, border:'none', background: colors.accentGradient, color:'#fff', cursor:'pointer', fontSize: 15, fontWeight: 700, fontFamily:'inherit', boxShadow: shadows.btn, transition:'opacity 200ms ease' },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform:'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { width:'100%', padding:'12px 14px', borderRadius: 12, border:`1.5px solid ${colors.glassBorder}`, background: colors.glassInput, color: colors.text, fontSize: 15, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },

  dupWarning: { background:'rgba(245,158,11,0.12)', border:`1px solid rgba(245,158,11,0.4)`, borderRadius: 12, padding:'12px 14px', color:'#fbbf24', fontSize: 13, marginBottom: 12, lineHeight: 1.5 },
  dupNo: { flex: 1, padding:'10px', borderRadius: 10, border:`1px solid ${colors.glassBorder}`, background: colors.glass, color: colors.textSub, cursor:'pointer', fontFamily:'inherit', fontSize: 13 },
  dupYes: { flex: 2, padding:'10px', borderRadius: 10, border:'none', background:'rgba(245,158,11,0.25)', color:'#fbbf24', cursor:'pointer', fontFamily:'inherit', fontSize: 13, fontWeight: 700 },
}

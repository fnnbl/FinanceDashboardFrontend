import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../utils/api'
import styles from './PlanDetailPage.module.css'

const RHYTHM_LABELS = {
  monthly: 'Monatlich',
  quarterly: 'Vierteljährlich',
  semi_annually: 'Halbjährlich',
  annually: 'Jährlich',
}

const RHYTHM_DIVISORS = {
  monthly: 1,
  quarterly: 3,
  semi_annually: 6,
  annually: 12,
}

const RHYTHM_ORDER = ['monthly', 'quarterly', 'semi_annually', 'annually']

const CATEGORY_COLORS = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  '#4dc9f6', '#f67019', '#537bc4', '#acc236', '#166a8f',
]

const emptyForm = {
  type: 'expense',
  category_id: '',
  description: '',
  amount: '',
  payment_rhythm: 'monthly',
  note: '',
}

const DonutChart = ({ data }) => {
  const size = 180
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.42
  const innerR = size * 0.26
  const total = data.reduce((s, d) => s + d.amount, 0)

  if (data.length === 1) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.donutSvg}>
        <circle cx={cx} cy={cy} r={r} fill={data[0].color} />
        <circle cx={cx} cy={cy} r={innerR} fill="var(--section-bg)" />
      </svg>
    )
  }

  let cumAngle = -Math.PI / 2
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={styles.donutSvg}>
      {data.map((item) => {
        const angle = (item.amount / total) * 2 * Math.PI
        const startAngle = cumAngle
        cumAngle += angle
        const x1 = cx + r * Math.cos(startAngle)
        const y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(cumAngle)
        const y2 = cy + r * Math.sin(cumAngle)
        const largeArc = angle > Math.PI ? 1 : 0
        return (
          <path
            key={item.id}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={item.color}
            stroke="var(--section-bg)"
            strokeWidth="1.5"
          />
        )
      })}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--section-bg)" />
    </svg>
  )
}

const PlanDetailPage = () => {
  const { planId } = useParams()
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState('dashboard')
  const [chartType, setChartType] = useState('expense')

  const [sortField, setSortField] = useState('monthly_amount')
  const [sortDir, setSortDir] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadAll()
  }, [planId])

  const loadAll = async () => {
    try {
      const [planData, itemsData, categoriesData] = await Promise.all([
        api.getPlan(planId),
        api.getBudgetItems(planId),
        api.getCategories(),
      ])
      setPlan(planData)
      setItems(itemsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat ? cat.name : '-'
  }

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  const previewMonthly =
    formData.amount && formData.payment_rhythm
      ? parseFloat(formData.amount) / RHYTHM_DIVISORS[formData.payment_rhythm]
      : null

  const getCategoryBreakdown = (type) => {
    const typeItems = items.filter((i) => i.type === type)
    const total = typeItems.reduce((sum, i) => sum + i.monthly_amount, 0)
    const byCat = {}
    typeItems.forEach((item) => {
      byCat[item.category_id] = (byCat[item.category_id] || 0) + item.monthly_amount
    })
    return Object.entries(byCat)
      .map(([catId, amount]) => ({
        id: parseInt(catId),
        name: getCategoryName(parseInt(catId)),
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .map((c, i) => ({ ...c, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(['description', 'category', 'payment_rhythm'].includes(field) ? 'asc' : 'desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <span className={styles.sortIconInactive}> ↕</span>
    return <span className={styles.sortIconActive}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
  }

  const getSortedItems = (sectionItems) => {
    return [...sectionItems].sort((a, b) => {
      let av, bv
      switch (sortField) {
        case 'description':
          av = a.description.toLowerCase()
          bv = b.description.toLowerCase()
          break
        case 'category':
          av = getCategoryName(a.category_id).toLowerCase()
          bv = getCategoryName(b.category_id).toLowerCase()
          break
        case 'amount':
          av = a.amount
          bv = b.amount
          break
        case 'payment_rhythm':
          av = RHYTHM_ORDER.indexOf(a.payment_rhythm)
          bv = RHYTHM_ORDER.indexOf(b.payment_rhythm)
          break
        default:
          av = a.monthly_amount
          bv = b.monthly_amount
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleOpenModal = (item = null) => {
    setEditingItem(item)
    setFormData(
      item
        ? {
            type: item.type,
            category_id: String(item.category_id),
            description: item.description,
            amount: String(item.amount),
            payment_rhythm: item.payment_rhythm,
            note: item.note || '',
          }
        : emptyForm
    )
    setFormError('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'type') updated.category_id = ''
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    const payload = {
      ...formData,
      category_id: parseInt(formData.category_id),
      amount: parseFloat(formData.amount),
    }

    try {
      if (editingItem) {
        await api.updateBudgetItem(planId, editingItem.id, payload)
      } else {
        await api.createBudgetItem(planId, payload)
      }
      const [updatedPlan, updatedItems] = await Promise.all([
        api.getPlan(planId),
        api.getBudgetItems(planId),
      ])
      setPlan(updatedPlan)
      setItems(updatedItems)
      handleCloseModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Posten "${item.description}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }
    try {
      await api.deleteBudgetItem(planId, item.id)
      const [updatedPlan, updatedItems] = await Promise.all([
        api.getPlan(planId),
        api.getBudgetItems(planId),
      ])
      setPlan(updatedPlan)
      setItems(updatedItems)
    } catch (err) {
      setError(err.message)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const incomeItems = items.filter((i) => i.type === 'income')
  const expenseItems = items.filter((i) => i.type === 'expense')

  const filteredItems = searchQuery.trim()
    ? items.filter((item) => {
        const q = searchQuery.toLowerCase()
        return (
          item.description.toLowerCase().includes(q) ||
          getCategoryName(item.category_id).toLowerCase().includes(q) ||
          (item.note && item.note.toLowerCase().includes(q))
        )
      })
    : items

  const filteredIncomeItems = filteredItems.filter((i) => i.type === 'income')
  const filteredExpenseItems = filteredItems.filter((i) => i.type === 'expense')
  const filteredIncomeSum = filteredIncomeItems.reduce((sum, i) => sum + i.monthly_amount, 0)
  const filteredExpenseSum = filteredExpenseItems.reduce((sum, i) => sum + i.monthly_amount, 0)

  if (loading) {
    return <div className={styles.loading}>Plan wird geladen...</div>
  }

  if (error) {
    return <div className={styles.errorPage}>{error}</div>
  }

  const renderItemList = (sectionItems) =>
    sectionItems.map((item) => (
      <div key={item.id} className={styles.itemRow}>
        <div className={styles.itemInfo}>
          <span className={styles.itemDescription}>{item.description}</span>
          <span className={styles.itemMeta}>
            {getCategoryName(item.category_id)} - {RHYTHM_LABELS[item.payment_rhythm]}
          </span>
          {item.note && (
            <span className={styles.itemNote}>{item.note}</span>
          )}
        </div>
        <div className={styles.itemAmounts}>
          <span className={styles.itemAmount}>{formatCurrency(item.amount)}</span>
          <span className={styles.itemMonthly}>
            {formatCurrency(item.monthly_amount)} / Monat
          </span>
        </div>
        <div className={styles.itemActions}>
          <button className={styles.editBtn} onClick={() => handleOpenModal(item)}>
            Bearbeiten
          </button>
          <button className={styles.deleteBtn} onClick={() => handleDelete(item)}>
            Löschen
          </button>
        </div>
      </div>
    ))

  const breakdown = getCategoryBreakdown(chartType)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/plans')}>
          &larr; Zurück
        </button>
        <div className={styles.headerTitle}>
          <h1>{plan.name}</h1>
          {plan.description && (
            <p className={styles.description}>{plan.description}</p>
          )}
        </div>
        <button className="btn" onClick={() => handleOpenModal()}>
          Posten hinzufügen
        </button>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Einnahmen</span>
          <span className={styles.statIncome}>
            {formatCurrency(plan.total_monthly_income)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Ausgaben</span>
          <span className={styles.statExpenses}>
            {formatCurrency(plan.total_monthly_expenses)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Bilanz</span>
          <span className={plan.monthly_balance >= 0 ? styles.statPositive : styles.statNegative}>
            {formatCurrency(plan.monthly_balance)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Posten</span>
          <span>
            {incomeItems.length > 0 && expenseItems.length > 0
              ? `${incomeItems.length} / ${expenseItems.length}`
              : plan.budget_item_count}
          </span>
          {incomeItems.length > 0 && expenseItems.length > 0 && (
            <span className={styles.statSubLabel}>Einnahmen / Ausgaben</span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Noch keine Budget-Posten vorhanden.</p>
          <button className="btn" onClick={() => handleOpenModal()}>
            Ersten Posten hinzufügen
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Übersicht
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'items' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('items')}
            >
              Budget-Posten
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <div className={styles.dashboard}>
              {/* Top 5 Ausgabenkategorien - US-043 */}
              <div className={styles.top5Section}>
                <h3 className={styles.subTitle}>Top 5 Ausgabenkategorien</h3>
                {getCategoryBreakdown('expense').length === 0 ? (
                  <p className={styles.noData}>Keine Ausgaben vorhanden.</p>
                ) : (
                  <div className={styles.top5List}>
                    {getCategoryBreakdown('expense').slice(0, 5).map((cat, i) => (
                      <div key={cat.id} className={styles.top5Row}>
                        <span className={styles.top5Rank}>{i + 1}</span>
                        <span
                          className={styles.colorDot}
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className={styles.top5Name}>{cat.name}</span>
                        <span className={styles.top5Amount}>{formatCurrency(cat.amount)}/Mo</span>
                        <span className={styles.breakdownPercent}>{cat.percent.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vollständige Kategorieauswertung - US-041/042 */}
              <div className={styles.chartToggle}>
                <button
                  className={`${styles.toggleBtn} ${chartType === 'expense' ? styles.toggleExpense : ''}`}
                  onClick={() => setChartType('expense')}
                >
                  Ausgaben
                </button>
                <button
                  className={`${styles.toggleBtn} ${chartType === 'income' ? styles.toggleIncome : ''}`}
                  onClick={() => setChartType('income')}
                >
                  Einnahmen
                </button>
              </div>

              {breakdown.length === 0 ? (
                <div className={styles.noData}>
                  Keine {chartType === 'expense' ? 'Ausgaben' : 'Einnahmen'} vorhanden.
                </div>
              ) : (
                <div className={styles.dashboardGrid}>
                  <div className={styles.breakdownSection}>
                    <h3 className={styles.subTitle}>Nach Kategorie</h3>
                    {breakdown.map((cat) => (
                      <div key={cat.id} className={styles.breakdownRow}>
                        <div className={styles.breakdownHeader}>
                          <span
                            className={styles.colorDot}
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className={styles.breakdownName}>{cat.name}</span>
                          <span className={styles.breakdownAmount}>
                            {formatCurrency(cat.amount)}/Mo
                          </span>
                          <span className={styles.breakdownPercent}>
                            {cat.percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className={styles.breakdownBar}>
                          <div
                            className={styles.breakdownBarFill}
                            style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.chartSection}>
                    <h3 className={styles.subTitle}>Verteilung</h3>
                    <DonutChart data={breakdown} />
                    <div className={styles.legend}>
                      {breakdown.slice(0, 6).map((cat) => (
                        <div key={cat.id} className={styles.legendItem}>
                          <span
                            className={styles.legendDot}
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className={styles.legendName}>{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className={styles.itemsView}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Suche nach Bezeichnung, Kategorie oder Bemerkung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                    &times;
                  </button>
                )}
              </div>

              <div className={styles.sortBar}>
                <span className={styles.sortLabel}>Sortieren:</span>
                {[
                  { key: 'monthly_amount', label: 'Monatlich' },
                  { key: 'amount', label: 'Betrag' },
                  { key: 'description', label: 'Bezeichnung' },
                  { key: 'category', label: 'Kategorie' },
                  { key: 'payment_rhythm', label: 'Rhythmus' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.sortBtn} ${sortField === key ? styles.sortBtnActive : ''}`}
                    onClick={() => handleSort(key)}
                  >
                    {label}{getSortIcon(key)}
                  </button>
                ))}
              </div>

              {filteredItems.length === 0 && searchQuery ? (
                <div className={styles.searchEmpty}>
                  Keine Ergebnisse für „{searchQuery}".
                </div>
              ) : (
                <div className={styles.sections}>
                  {filteredIncomeItems.length > 0 && (
                    <section>
                      <h2 className={`${styles.sectionTitle} ${styles.sectionIncome}`}>
                        Einnahmen
                      </h2>
                      <div className={styles.itemList}>
                        {renderItemList(getSortedItems(filteredIncomeItems))}
                        <div className={styles.sectionSum}>
                          <span>Summe monatlich</span>
                          <span className={styles.statIncome}>{formatCurrency(filteredIncomeSum)}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {filteredExpenseItems.length > 0 && (
                    <section>
                      <h2 className={`${styles.sectionTitle} ${styles.sectionExpense}`}>
                        Ausgaben
                      </h2>
                      <div className={styles.itemList}>
                        {renderItemList(getSortedItems(filteredExpenseItems))}
                        <div className={styles.sectionSum}>
                          <span>Summe monatlich</span>
                          <span className={styles.statExpenses}>{formatCurrency(filteredExpenseSum)}</span>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className={styles.modal} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{editingItem ? 'Posten bearbeiten' : 'Posten hinzufügen'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Typ</label>
                <div className={styles.typeToggle}>
                  <label className={`${styles.typeOption} ${formData.type === 'expense' ? styles.typeActive : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={handleChange}
                    />
                    Ausgabe
                  </label>
                  <label className={`${styles.typeOption} ${formData.type === 'income' ? styles.typeActiveIncome : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={handleChange}
                    />
                    Einnahme
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category_id" className={styles.label}>
                  Kategorie
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  disabled={submitting}
                >
                  <option value="">Kategorie wählen...</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Bezeichnung
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="z.B. Miete, Gehalt..."
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="amount" className={styles.label}>
                    Betrag (EUR)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="0,00"
                    min="0.01"
                    step="0.01"
                    required
                    disabled={submitting}
                  />
                  {previewMonthly !== null && (
                    <span className={styles.monthlyPreview}>
                      = {formatCurrency(previewMonthly)} / Monat
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="payment_rhythm" className={styles.label}>
                    Zahlungsrhythmus
                  </label>
                  <select
                    id="payment_rhythm"
                    name="payment_rhythm"
                    value={formData.payment_rhythm}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={submitting}
                  >
                    <option value="monthly">Monatlich</option>
                    <option value="quarterly">Vierteljährlich</option>
                    <option value="semi_annually">Halbjährlich</option>
                    <option value="annually">Jährlich</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="note" className={styles.label}>
                  Bemerkung <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="z.B. wird im Januar fällig..."
                  disabled={submitting}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting
                    ? 'Wird gespeichert...'
                    : editingItem ? 'Speichern' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanDetailPage

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../utils/api'
import { useLanguage } from '../contexts/LanguageContext'
import styles from './PlanDetailPage.module.css'

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
  const { t, tCat, locale } = useLanguage()

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
  const [selectedCategories, setSelectedCategories] = useState(new Set())

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef(null)

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
    return cat ? tCat(cat.name, cat.is_system) : '-'
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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleExport = async (type) => {
    setShowExportMenu(false)
    setExporting(true)
    try {
      const blob = type === 'pdf'
        ? await api.exportPlanPDF(planId)
        : await api.exportPlanExcel(planId)
      const ext = type === 'pdf' ? 'pdf' : 'xlsx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${plan.name}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
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
    if (!window.confirm(t('planDetail.item_delete_confirm', { name: item.description }))) {
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
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const incomeItems = items.filter((i) => i.type === 'income')
  const expenseItems = items.filter((i) => i.type === 'expense')

  const availableCategories = categories.filter((c) =>
    items.some((i) => i.category_id === c.id)
  )

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategories(new Set())
  }

  const hasActiveFilters = searchQuery.trim() || selectedCategories.size > 0

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q || (
      item.description.toLowerCase().includes(q) ||
      getCategoryName(item.category_id).toLowerCase().includes(q) ||
      (item.note && item.note.toLowerCase().includes(q))
    )
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(item.category_id)
    return matchesSearch && matchesCategory
  })

  const filteredIncomeItems = filteredItems.filter((i) => i.type === 'income')
  const filteredExpenseItems = filteredItems.filter((i) => i.type === 'expense')
  const filteredIncomeSum = filteredIncomeItems.reduce((sum, i) => sum + i.monthly_amount, 0)
  const filteredExpenseSum = filteredExpenseItems.reduce((sum, i) => sum + i.monthly_amount, 0)

  if (loading) {
    return <div className={styles.loading}>{t('planDetail.loading')}</div>
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
            {getCategoryName(item.category_id)} - {t(`planDetail.rhythm.${item.payment_rhythm}`)}
          </span>
          {item.note && (
            <span className={styles.itemNote}>{item.note}</span>
          )}
        </div>
        <div className={styles.itemAmounts}>
          <span className={styles.itemAmount}>{formatCurrency(item.amount)}</span>
          <span className={styles.itemMonthly}>
            {formatCurrency(item.monthly_amount)} {t('common.per_month')}
          </span>
        </div>
        <div className={styles.itemActions}>
          <button className={styles.editBtn} onClick={() => handleOpenModal(item)}>
            {t('common.edit')}
          </button>
          <button className={styles.deleteBtn} onClick={() => handleDelete(item)}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    ))

  const breakdown = getCategoryBreakdown(chartType)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/plans')}>
          {t('planDetail.back')}
        </button>
        <div className={styles.headerTitle}>
          <h1>{plan.name}</h1>
          {plan.description && (
            <p className={styles.description}>{plan.description}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.exportWrapper} ref={exportMenuRef}>
            <button
              className={styles.exportBtn}
              onClick={() => setShowExportMenu((o) => !o)}
              disabled={exporting}
            >
              {exporting ? t('planDetail.exporting') : t('planDetail.export')}
              {!exporting && <span className={styles.exportCaret}>&#9660;</span>}
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button className={styles.exportMenuItem} onClick={() => handleExport('pdf')}>
                  {t('planDetail.export_pdf')}
                </button>
                <button className={styles.exportMenuItem} onClick={() => handleExport('excel')}>
                  {t('planDetail.export_excel')}
                </button>
              </div>
            )}
          </div>
          <button className="btn" onClick={() => handleOpenModal()}>
            {t('planDetail.add_item')}
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{t('planDetail.stats.income')}</span>
          <span className={styles.statIncome}>
            {formatCurrency(plan.total_monthly_income)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{t('planDetail.stats.expenses')}</span>
          <span className={styles.statExpenses}>
            {formatCurrency(plan.total_monthly_expenses)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{t('planDetail.stats.balance')}</span>
          <span className={plan.monthly_balance >= 0 ? styles.statPositive : styles.statNegative}>
            {formatCurrency(plan.monthly_balance)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{t('planDetail.stats.items')}</span>
          <span>
            {incomeItems.length > 0 && expenseItems.length > 0
              ? `${incomeItems.length} / ${expenseItems.length}`
              : plan.budget_item_count}
          </span>
          {incomeItems.length > 0 && expenseItems.length > 0 && (
            <span className={styles.statSubLabel}>{t('planDetail.stats.income_slash_expenses')}</span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('planDetail.empty')}</p>
          <button className="btn" onClick={() => handleOpenModal()}>
            {t('planDetail.first_add')}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              {t('planDetail.tab_overview')}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'items' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('items')}
            >
              {t('planDetail.tab_items')}
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <div className={styles.dashboard}>
              <div className={styles.top5Section}>
                <h3 className={styles.subTitle}>{t('planDetail.top5_title')}</h3>
                {getCategoryBreakdown('expense').length === 0 ? (
                  <p className={styles.noData}>{t('planDetail.no_expenses')}</p>
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

              <div className={styles.chartToggle}>
                <button
                  className={`${styles.toggleBtn} ${chartType === 'expense' ? styles.toggleExpense : ''}`}
                  onClick={() => setChartType('expense')}
                >
                  {t('planDetail.stats.expenses')}
                </button>
                <button
                  className={`${styles.toggleBtn} ${chartType === 'income' ? styles.toggleIncome : ''}`}
                  onClick={() => setChartType('income')}
                >
                  {t('planDetail.stats.income')}
                </button>
              </div>

              {breakdown.length === 0 ? (
                <div className={styles.noData}>
                  {chartType === 'expense' ? t('planDetail.no_data_expenses') : t('planDetail.no_data_income')}
                </div>
              ) : (
                <div className={styles.dashboardGrid}>
                  <div className={styles.breakdownSection}>
                    <h3 className={styles.subTitle}>{t('planDetail.by_category')}</h3>
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
                    <h3 className={styles.subTitle}>{t('planDetail.distribution')}</h3>
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
                  placeholder={t('planDetail.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                    &times;
                  </button>
                )}
              </div>

              {availableCategories.length > 0 && (
                <div className={styles.filterBar}>
                  <span className={styles.sortLabel}>{t('planDetail.filter_category')}</span>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`${styles.filterBtn} ${selectedCategories.has(cat.id) ? styles.filterBtnActive : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {hasActiveFilters && (
                    <button className={styles.filterReset} onClick={resetFilters}>
                      {t('planDetail.filter_reset')}
                    </button>
                  )}
                </div>
              )}

              <div className={styles.sortBar}>
                <span className={styles.sortLabel}>{t('planDetail.sort.label')}</span>
                {[
                  { key: 'monthly_amount', label: t('planDetail.sort.monthly') },
                  { key: 'amount', label: t('planDetail.sort.amount') },
                  { key: 'description', label: t('planDetail.sort.description') },
                  { key: 'category', label: t('planDetail.sort.category') },
                  { key: 'payment_rhythm', label: t('planDetail.sort.rhythm') },
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

              {filteredItems.length === 0 && hasActiveFilters ? (
                <div className={styles.searchEmpty}>
                  {t('planDetail.no_results')}
                </div>
              ) : (
                <div className={styles.sections}>
                  {filteredIncomeItems.length > 0 && (
                    <section>
                      <h2 className={`${styles.sectionTitle} ${styles.sectionIncome}`}>
                        {t('planDetail.income_section')}
                      </h2>
                      <div className={styles.itemList}>
                        {renderItemList(getSortedItems(filteredIncomeItems))}
                        <div className={styles.sectionSum}>
                          <span>{t('planDetail.sum_monthly')}</span>
                          <span className={styles.statIncome}>{formatCurrency(filteredIncomeSum)}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {filteredExpenseItems.length > 0 && (
                    <section>
                      <h2 className={`${styles.sectionTitle} ${styles.sectionExpense}`}>
                        {t('planDetail.expenses_section')}
                      </h2>
                      <div className={styles.itemList}>
                        {renderItemList(getSortedItems(filteredExpenseItems))}
                        <div className={styles.sectionSum}>
                          <span>{t('planDetail.sum_monthly')}</span>
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
              <h2>{editingItem ? t('planDetail.modal.edit_title') : t('planDetail.modal.add_title')}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('planDetail.modal.type_label')}</label>
                <div className={styles.typeToggle}>
                  <label className={`${styles.typeOption} ${formData.type === 'expense' ? styles.typeActive : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={handleChange}
                    />
                    {t('planDetail.modal.type_expense')}
                  </label>
                  <label className={`${styles.typeOption} ${formData.type === 'income' ? styles.typeActiveIncome : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={handleChange}
                    />
                    {t('planDetail.modal.type_income')}
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category_id" className={styles.label}>
                  {t('planDetail.modal.category_label')}
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
                  <option value="">{t('planDetail.modal.category_placeholder')}</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{tCat(c.name, c.is_system)}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  {t('planDetail.modal.description_label')}
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder={t('planDetail.modal.description_placeholder')}
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="amount" className={styles.label}>
                    {t('planDetail.modal.amount_label')}
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
                      {t('planDetail.modal.preview', { amount: formatCurrency(previewMonthly) })}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="payment_rhythm" className={styles.label}>
                    {t('planDetail.modal.rhythm_label')}
                  </label>
                  <select
                    id="payment_rhythm"
                    name="payment_rhythm"
                    value={formData.payment_rhythm}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={submitting}
                  >
                    <option value="monthly">{t('planDetail.rhythm.monthly')}</option>
                    <option value="quarterly">{t('planDetail.rhythm.quarterly')}</option>
                    <option value="semi_annually">{t('planDetail.rhythm.semi_annually')}</option>
                    <option value="annually">{t('planDetail.rhythm.annually')}</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="note" className={styles.label}>
                  {t('planDetail.modal.note_label')}{' '}
                  <span className={styles.optional}>{t('common.optional')}</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder={t('planDetail.modal.note_placeholder')}
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
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting
                    ? t('planDetail.modal.saving')
                    : editingItem ? t('common.save') : t('planDetail.modal.add')}
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

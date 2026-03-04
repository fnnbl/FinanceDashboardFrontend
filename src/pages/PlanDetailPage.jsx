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

const emptyForm = {
  type: 'expense',
  category_id: '',
  description: '',
  amount: '',
  payment_rhythm: 'monthly',
  note: '',
}

const PlanDetailPage = () => {
  const { planId } = useParams()
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
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

  const handleOpenModal = () => {
    setFormData(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
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

    try {
      await api.createBudgetItem(planId, {
        ...formData,
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
      })
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const incomeItems = items.filter((i) => i.type === 'income')
  const expenseItems = items.filter((i) => i.type === 'expense')

  const incomeSum = incomeItems.reduce((sum, i) => sum + i.monthly_amount, 0)
  const expenseSum = expenseItems.reduce((sum, i) => sum + i.monthly_amount, 0)

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
      </div>
    ))

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
        <button className="btn" onClick={handleOpenModal}>
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
          <span>{plan.budget_item_count}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Noch keine Budget-Posten vorhanden.</p>
          <button className="btn" onClick={handleOpenModal}>
            Ersten Posten hinzufügen
          </button>
        </div>
      ) : (
        <div className={styles.sections}>
          {incomeItems.length > 0 && (
            <section>
              <h2 className={`${styles.sectionTitle} ${styles.sectionIncome}`}>
                Einnahmen
              </h2>
              <div className={styles.itemList}>
                {renderItemList(incomeItems)}
                <div className={styles.sectionSum}>
                  <span>Summe monatlich</span>
                  <span className={styles.statIncome}>
                    {formatCurrency(incomeSum)}
                  </span>
                </div>
              </div>
            </section>
          )}

          {expenseItems.length > 0 && (
            <section>
              <h2 className={`${styles.sectionTitle} ${styles.sectionExpense}`}>
                Ausgaben
              </h2>
              <div className={styles.itemList}>
                {renderItemList(expenseItems)}
                <div className={styles.sectionSum}>
                  <span>Summe monatlich</span>
                  <span className={styles.statExpenses}>
                    {formatCurrency(expenseSum)}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Posten hinzufügen</h2>
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
                  {submitting ? 'Wird gespeichert...' : 'Hinzufügen'}
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

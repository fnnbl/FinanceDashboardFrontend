import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../utils/api'
import { useLanguage } from '../contexts/LanguageContext'
import styles from './DashboardPage.module.css'

const DashboardPage = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePlanId, setActivePlanId] = useState(null)
  const [comparePlanIds, setComparePlanIds] = useState([])
  const { t, locale } = useLanguage()

  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value)

  useEffect(() => {
    const storedActive = parseInt(localStorage.getItem('activePlanId'))
    if (!isNaN(storedActive)) setActivePlanId(storedActive)

    try {
      const storedCompare = JSON.parse(localStorage.getItem('comparePlanIds') || '[]')
      if (Array.isArray(storedCompare)) {
        setComparePlanIds(storedCompare.slice(0, 3))
      }
    } catch {
      // localStorage corrupted - ignore
    }

    api.getPlans()
      .then((data) => setPlans(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSetActivePlan = (e) => {
    const value = e.target.value
    if (value === '') {
      setActivePlanId(null)
      localStorage.removeItem('activePlanId')
    } else {
      const id = parseInt(value)
      setActivePlanId(id)
      localStorage.setItem('activePlanId', String(id))
    }
  }

  const handleToggleComparePlan = (planId) => {
    setComparePlanIds((prev) => {
      let next
      if (prev.includes(planId)) {
        next = prev.filter((id) => id !== planId)
      } else if (prev.length < 3) {
        next = [...prev, planId]
      } else {
        return prev
      }
      localStorage.setItem('comparePlanIds', JSON.stringify(next))
      return next
    })
  }

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null
  const comparePlans = plans.filter((p) => comparePlanIds.includes(p.id))

  if (loading) return <div className={styles.loading}>{t('dashboard.loading')}</div>
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>{t('dashboard.title')}</h1>
      </div>

      {/* Aktiver Plan */}
      <section className={styles.activePlanSection}>
        <div className={styles.sectionHeader}>
          <h2>{t('dashboard.active_plan.title')}</h2>
          {plans.length > 0 && (
            <select
              className={styles.planSelector}
              value={activePlanId ?? ''}
              onChange={handleSetActivePlan}
            >
              <option value="">{t('dashboard.active_plan.select_placeholder')}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {plans.length === 0 ? (
          <div className={styles.emptyHint}>
            {t('dashboard.active_plan.no_plans')}{' '}
            <Link to="/plans">{t('dashboard.active_plan.create_link')}</Link>
          </div>
        ) : activePlanId === null ? (
          <div className={styles.emptyHint}>
            {t('dashboard.active_plan.select_hint')}
          </div>
        ) : activePlan === null ? (
          <div className={styles.emptyHint}>
            {t('dashboard.active_plan.deleted_hint')}
          </div>
        ) : (
          <div className={styles.activePlanCard}>
            <div className={styles.activePlanHeader}>
              <span className={styles.activePlanName}>{activePlan.name}</span>
              <Link to={`/plans/${activePlan.id}`} className="btn">
                {t('dashboard.active_plan.open')}
              </Link>
            </div>
            {activePlan.description && (
              <p className={styles.activePlanDescription}>{activePlan.description}</p>
            )}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('dashboard.active_plan.income')}</span>
                <span className={`${styles.statValue} ${styles.statIncome}`}>
                  {formatCurrency(activePlan.total_monthly_income)}
                </span>
                <span className={styles.statSub}>{t('dashboard.active_plan.per_month')}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('dashboard.active_plan.expenses')}</span>
                <span className={`${styles.statValue} ${styles.statExpenses}`}>
                  {formatCurrency(activePlan.total_monthly_expenses)}
                </span>
                <span className={styles.statSub}>{t('dashboard.active_plan.per_month')}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('dashboard.active_plan.balance')}</span>
                <span
                  className={`${styles.statValue} ${
                    activePlan.monthly_balance >= 0 ? styles.statPositive : styles.statNegative
                  }`}
                >
                  {formatCurrency(activePlan.monthly_balance)}
                </span>
                <span className={styles.statSub}>{t('dashboard.active_plan.per_month')}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('dashboard.active_plan.items')}</span>
                <span className={styles.statValue}>{activePlan.budget_item_count}</span>
                <span className={styles.statSub}>{t('dashboard.active_plan.budget_items')}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Plan-Vergleich */}
      {plans.length > 1 && (
        <section className={styles.compareSection}>
          <div className={styles.sectionHeader}>
            <h2>{t('dashboard.compare.title')}</h2>
            {comparePlanIds.length >= 3 && (
              <span className={styles.compareMaxHint}>{t('dashboard.compare.max_hint')}</span>
            )}
          </div>

          <div className={styles.comparePicker}>
            {plans.map((p) => {
              const checked = comparePlanIds.includes(p.id)
              const disabled = !checked && comparePlanIds.length >= 3
              return (
                <label
                  key={p.id}
                  className={`${styles.compareOption} ${disabled ? styles.compareOptionDisabled : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => handleToggleComparePlan(p.id)}
                  />
                  {p.name}
                </label>
              )
            })}
          </div>

          {comparePlans.length === 0 ? (
            <div className={styles.emptyHint}>
              {t('dashboard.compare.select_hint')}
            </div>
          ) : (
            <div className={styles.compareTableWrapper}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th className={styles.compareRowLabel}></th>
                    {comparePlans.map((p) => (
                      <th key={p.id} className={styles.compareTh}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.compareRowLabel}>{t('dashboard.compare.income')}</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className={`${styles.compareTd} ${styles.compareValueIncome}`}>
                        {formatCurrency(p.total_monthly_income)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={styles.compareRowLabel}>{t('dashboard.compare.expenses')}</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className={`${styles.compareTd} ${styles.compareValueExpenses}`}>
                        {formatCurrency(p.total_monthly_expenses)}
                      </td>
                    ))}
                  </tr>
                  <tr className={styles.compareBalanceRow}>
                    <td className={styles.compareRowLabel}>{t('dashboard.compare.balance')}</td>
                    {comparePlans.map((p) => (
                      <td
                        key={p.id}
                        className={`${styles.compareTd} ${
                          p.monthly_balance >= 0
                            ? styles.compareValuePositive
                            : styles.compareValueNegative
                        }`}
                      >
                        {formatCurrency(p.monthly_balance)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={styles.compareRowLabel}>{t('dashboard.compare.items')}</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className={styles.compareTd}>
                        {p.budget_item_count}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default DashboardPage

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../utils/api'
import styles from './DashboardPage.module.css'

const formatCurrency = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

const DashboardPage = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePlanId, setActivePlanId] = useState(null)
  const [comparePlanIds, setComparePlanIds] = useState([])

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

  if (loading) return <div className={styles.loading}>Wird geladen...</div>
  if (error) return <div className={styles.error}>{error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
      </div>

      {/* Aktiver Plan */}
      <section className={styles.activePlanSection}>
        <div className={styles.sectionHeader}>
          <h2>Aktiver Plan</h2>
          {plans.length > 0 && (
            <select
              className={styles.planSelector}
              value={activePlanId ?? ''}
              onChange={handleSetActivePlan}
            >
              <option value="">Plan auswahlen...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {plans.length === 0 ? (
          <div className={styles.emptyHint}>
            Noch keine Plane vorhanden. <Link to="/plans">Plan erstellen</Link>
          </div>
        ) : activePlanId === null ? (
          <div className={styles.emptyHint}>
            Wahle einen Plan aus dem Dropdown aus, um dessen Kennzahlen hier anzuzeigen.
          </div>
        ) : activePlan === null ? (
          <div className={styles.emptyHint}>
            Der zuletzt aktive Plan wurde geloscht. Bitte einen neuen Plan auswahlen.
          </div>
        ) : (
          <div className={styles.activePlanCard}>
            <div className={styles.activePlanHeader}>
              <span className={styles.activePlanName}>{activePlan.name}</span>
              <Link to={`/plans/${activePlan.id}`} className="btn">
                Plan offnen
              </Link>
            </div>
            {activePlan.description && (
              <p className={styles.activePlanDescription}>{activePlan.description}</p>
            )}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Einnahmen</span>
                <span className={`${styles.statValue} ${styles.statIncome}`}>
                  {formatCurrency(activePlan.total_monthly_income)}
                </span>
                <span className={styles.statSub}>/ Monat</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Ausgaben</span>
                <span className={`${styles.statValue} ${styles.statExpenses}`}>
                  {formatCurrency(activePlan.total_monthly_expenses)}
                </span>
                <span className={styles.statSub}>/ Monat</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Bilanz</span>
                <span
                  className={`${styles.statValue} ${
                    activePlan.monthly_balance >= 0 ? styles.statPositive : styles.statNegative
                  }`}
                >
                  {formatCurrency(activePlan.monthly_balance)}
                </span>
                <span className={styles.statSub}>/ Monat</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Posten</span>
                <span className={styles.statValue}>{activePlan.budget_item_count}</span>
                <span className={styles.statSub}>Budget-Posten</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Plan-Vergleich */}
      {plans.length > 1 && (
        <section className={styles.compareSection}>
          <div className={styles.sectionHeader}>
            <h2>Plan-Vergleich</h2>
            {comparePlanIds.length >= 3 && (
              <span className={styles.compareMaxHint}>Maximum erreicht (3 Plane)</span>
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
              Wahle bis zu 3 Plane aus, um sie nebeneinander zu vergleichen.
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
                    <td className={styles.compareRowLabel}>Einnahmen</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className={`${styles.compareTd} ${styles.compareValueIncome}`}>
                        {formatCurrency(p.total_monthly_income)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={styles.compareRowLabel}>Ausgaben</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className={`${styles.compareTd} ${styles.compareValueExpenses}`}>
                        {formatCurrency(p.total_monthly_expenses)}
                      </td>
                    ))}
                  </tr>
                  <tr className={styles.compareBalanceRow}>
                    <td className={styles.compareRowLabel}>Bilanz</td>
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
                    <td className={styles.compareRowLabel}>Posten</td>
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

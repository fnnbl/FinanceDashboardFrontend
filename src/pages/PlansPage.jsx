import { useState, useEffect } from 'react'
import * as api from '../utils/api'
import styles from './PlansPage.module.css'

const PlansPage = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const data = await api.getPlans()
      setPlans(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({ name: '', description: '' })
    setFormError('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      await api.createPlan(formData)
      await fetchPlans()
      handleCloseModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return <div className={styles.loading}>Pläne werden geladen...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meine Pläne</h1>
        {plans.length > 0 && (
          <button className="btn" onClick={handleOpenModal}>
            Neuen Plan erstellen
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {plans.length === 0 ? (
        <div className={styles.empty}>
          <p>Du hast noch keine Budget-Pläne erstellt.</p>
          <button className="btn" onClick={handleOpenModal}>
            Ersten Plan erstellen
          </button>
        </div>
      ) : (
        <div className={styles.plansList}>
          {plans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              <div className={styles.planName}>{plan.name}</div>
              {plan.description && (
                <p className={styles.planDescription}>{plan.description}</p>
              )}
              <div className={styles.planMeta}>
                Erstellt am {formatDate(plan.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Neuen Plan erstellen</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            {formError && <div className={styles.error}>{formError}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="z.B. Haushaltsplan März 2026"
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Beschreibung <span className={styles.optional}>(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Kurze Beschreibung des Plans..."
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
                  {submitting ? 'Wird erstellt...' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlansPage

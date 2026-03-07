import { useState, useEffect } from 'react'
import * as api from '../utils/api'
import styles from './CategoriesPage.module.css'

const emptyForm = { name: '', type: 'expense' }

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deletingCategory, setDeletingCategory] = useState(null)
  const [reassignTo, setReassignTo] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')

  const handleOpenForm = (category = null) => {
    setEditingCategory(category)
    setFormData(category ? { name: category.name, type: category.type } : emptyForm)
    setFormError('')
    setShowFormModal(true)
  }

  const handleCloseForm = () => {
    setShowFormModal(false)
    setEditingCategory(null)
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, { name: formData.name })
      } else {
        await api.createCategory(formData)
      }
      await loadCategories()
      handleCloseForm()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDelete = (category) => {
    setDeletingCategory(category)
    setReassignTo('')
    setDeleteError('')
  }

  const handleCloseDelete = () => {
    setDeletingCategory(null)
    setReassignTo('')
    setDeleteError('')
  }

  const handleDelete = async () => {
    setDeleteError('')
    setDeleting(true)
    try {
      await api.deleteCategory(deletingCategory.id, reassignTo || null)
      await loadCategories()
      handleCloseDelete()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const reassignOptions = deletingCategory
    ? categories.filter(
        (c) => c.type === deletingCategory.type && c.id !== deletingCategory.id
      )
    : []

  const renderSection = (title, sectionCategories, colorClass) => (
    <section className={styles.section}>
      <h2 className={`${styles.sectionTitle} ${colorClass}`}>{title}</h2>
      <div className={styles.categoryList}>
        {sectionCategories.length === 0 ? (
          <p className={styles.emptySection}>Keine Kategorien vorhanden.</p>
        ) : (
          sectionCategories.map((cat) => (
            <div key={cat.id} className={styles.categoryRow}>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryName}>{cat.name}</span>
                {cat.is_system && (
                  <span className={styles.systemBadge}>Standard</span>
                )}
              </div>
              {!cat.is_system && (
                <div className={styles.categoryActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenForm(cat)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleOpenDelete(cat)}
                  >
                    Löschen
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )

  if (loading) return <div className={styles.loading}>Kategorien werden geladen...</div>
  if (error) return <div className={styles.errorPage}>{error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Kategorien</h1>
        <button className="btn" onClick={() => handleOpenForm()}>
          Neue Kategorie
        </button>
      </div>

      <div className={styles.sections}>
        {renderSection('Ausgaben', expenseCategories, styles.expenseTitle)}
        {renderSection('Einnahmen', incomeCategories, styles.incomeTitle)}
      </div>

      {showFormModal && (
        <div className={styles.modal} onClick={handleCloseForm}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseForm}>
                &times;
              </button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={styles.input}
                  placeholder="z.B. Haustiere, Dividenden..."
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {!editingCategory && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Typ</label>
                  <div className={styles.typeToggle}>
                    <label className={`${styles.typeOption} ${formData.type === 'expense' ? styles.typeActiveExpense : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                      />
                      Ausgabe
                    </label>
                    <label className={`${styles.typeOption} ${formData.type === 'income' ? styles.typeActiveIncome : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                      />
                      Einnahme
                    </label>
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className="btn" onClick={handleCloseForm} disabled={submitting}>
                  Abbrechen
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Wird gespeichert...' : editingCategory ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingCategory && (
        <div className={styles.modal} onClick={handleCloseDelete}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Kategorie löschen</h2>
              <button className={styles.closeBtn} onClick={handleCloseDelete}>
                &times;
              </button>
            </div>

            <p className={styles.deleteText}>
              Kategorie <strong>{deletingCategory.name}</strong> wirklich löschen?
            </p>

            {reassignOptions.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Budget-Posten umbuchen auf{' '}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className={styles.input}
                  disabled={deleting}
                >
                  <option value="">-- Nicht umbuchen (Posten bleiben unverändert)</option>
                  {reassignOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className={styles.hint}>
                  Falls Budget-Posten dieser Kategorie zugeordnet sind, musst du sie umbuchen oder zuerst löschen.
                </span>
              </div>
            )}

            {deleteError && <div className={styles.formError}>{deleteError}</div>}

            <div className={styles.formActions}>
              <button className="btn" onClick={handleCloseDelete} disabled={deleting}>
                Abbrechen
              </button>
              <button className={styles.deleteBtnModal} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage

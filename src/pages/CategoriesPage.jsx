import { useState, useEffect } from 'react'
import * as api from '../utils/api'
import { useLanguage } from '../contexts/LanguageContext'
import styles from './CategoriesPage.module.css'

const emptyForm = { name: '', type: 'expense' }

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { t, tCat } = useLanguage()

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
          <p className={styles.emptySection}>{t('categories.empty_section')}</p>
        ) : (
          sectionCategories.map((cat) => (
            <div key={cat.id} className={styles.categoryRow}>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryName}>{tCat(cat.name, cat.is_system)}</span>
                {cat.is_system && (
                  <span className={styles.systemBadge}>{t('categories.standard_badge')}</span>
                )}
              </div>
              {!cat.is_system && (
                <div className={styles.categoryActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenForm(cat)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleOpenDelete(cat)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )

  if (loading) return <div className={styles.loading}>{t('categories.loading')}</div>
  if (error) return <div className={styles.errorPage}>{error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('categories.title')}</h1>
        <button className="btn" onClick={() => handleOpenForm()}>
          {t('categories.new_button')}
        </button>
      </div>

      <div className={styles.sections}>
        {renderSection(t('categories.expenses_section'), expenseCategories, styles.expenseTitle)}
        {renderSection(t('categories.income_section'), incomeCategories, styles.incomeTitle)}
      </div>

      {showFormModal && (
        <div className={styles.modal} onClick={handleCloseForm}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? t('categories.modal.edit_title') : t('categories.modal.create_title')}</h2>
              <button className={styles.closeBtn} onClick={handleCloseForm}>
                &times;
              </button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>{t('categories.modal.name_label')}</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={styles.input}
                  placeholder={t('categories.modal.name_placeholder')}
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {!editingCategory && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('categories.modal.type_label')}</label>
                  <div className={styles.typeToggle}>
                    <label className={`${styles.typeOption} ${formData.type === 'expense' ? styles.typeActiveExpense : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                      />
                      {t('categories.modal.type_expense')}
                    </label>
                    <label className={`${styles.typeOption} ${formData.type === 'income' ? styles.typeActiveIncome : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                      />
                      {t('categories.modal.type_income')}
                    </label>
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className="btn" onClick={handleCloseForm} disabled={submitting}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting
                    ? t('common.saving')
                    : editingCategory ? t('common.save') : t('common.create')}
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
              <h2>{t('categories.delete_modal.title')}</h2>
              <button className={styles.closeBtn} onClick={handleCloseDelete}>
                &times;
              </button>
            </div>

            <p className={styles.deleteText}>
              {t('categories.delete_modal.confirm_text', { name: deletingCategory.name })}
            </p>

            {reassignOptions.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t('categories.delete_modal.reassign_label')}{' '}
                  <span className={styles.optional}>{t('common.optional')}</span>
                </label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className={styles.input}
                  disabled={deleting}
                >
                  <option value="">{t('categories.delete_modal.no_reassign')}</option>
                  {reassignOptions.map((c) => (
                    <option key={c.id} value={c.id}>{tCat(c.name, c.is_system)}</option>
                  ))}
                </select>
                <span className={styles.hint}>
                  {t('categories.delete_modal.reassign_hint')}
                </span>
              </div>
            )}

            {deleteError && <div className={styles.formError}>{deleteError}</div>}

            <div className={styles.formActions}>
              <button className="btn" onClick={handleCloseDelete} disabled={deleting}>
                {t('common.cancel')}
              </button>
              <button className={styles.deleteBtnModal} onClick={handleDelete} disabled={deleting}>
                {deleting ? t('categories.delete_modal.deleting') : t('categories.delete_modal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage

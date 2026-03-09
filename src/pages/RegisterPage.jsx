import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import sunIcon from '../assets/sun.svg'
import moonIcon from '../assets/moon.svg'
import flagDe from '../assets/de.svg'
import flagGb from '../assets/gb.svg'
import logoLight from '../assets/BudgetManagementLight.svg'
import logoDark from '../assets/BudgetManagementDark.svg'
import styles from './RegisterPage.module.css'

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, lang, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.register.error_password_mismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('auth.register.error_password_length'))
      return
    }

    setLoading(true)
    const result = await register({ email, password, name })

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || t('auth.register.error_default'))
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.topControls}>
        <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Design wechseln">
          <img src={theme === 'dark' ? sunIcon : moonIcon} alt="" />
        </button>
        <button onClick={toggleLanguage} className={styles.langToggle} aria-label={t('sidebar.language')}>
          <img src={lang === 'de' ? flagDe : flagGb} alt={lang === 'de' ? 'DE' : 'EN'} />
        </button>
      </div>

      <div className={styles.group}>
        <div className={styles.brand}>
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Finance Dashboard Logo"
            className={styles.brandMark}
          />
          <p className={styles.tagline}>{t('auth.tagline')}</p>
        </div>

        <div className={styles.formWrapper}>
          <h1 className={styles.title}>{t('auth.register.title')}</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                {t('auth.name')}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder={t('auth.name_placeholder')}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder={t('auth.email_placeholder')}
                required
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder={t('auth.password_min_placeholder')}
                required
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                {t('auth.confirm_password')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder={t('auth.confirm_password_placeholder')}
                required
                disabled={loading}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </form>
          <p className={styles.footer}>
            {t('auth.register.has_account')}{' '}
            <Link to="/login" className={styles.link}>
              {t('auth.register.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage

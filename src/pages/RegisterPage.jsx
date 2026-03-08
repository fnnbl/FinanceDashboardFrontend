import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import sunIcon from '../assets/sun.svg'
import moonIcon from '../assets/moon.svg'
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
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }

    setLoading(true)
    const result = await register({ email, password, name })

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Registrierung fehlgeschlagen.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Design wechseln">
        <img src={theme === 'dark' ? sunIcon : moonIcon} alt="" />
      </button>

      <div className={styles.group}>
        <div className={styles.brand}>
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Finance Dashboard Logo"
            className={styles.brandMark}
          />
          <p className={styles.tagline}>Behalte den Überblick über deine Finanzen.</p>
        </div>

        <div className={styles.formWrapper}>
        <h1 className={styles.title}>Registrieren</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Max Mustermann"
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="max@beispiel.de"
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Passwort
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Mindestens 8 Zeichen"
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Passwort wiederholen"
              required
              disabled={loading}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Wird registriert...' : 'Konto erstellen'}
          </button>
        </form>
        <p className={styles.footer}>
          Bereits ein Konto?{' '}
          <Link to="/login" className={styles.link}>
            Jetzt anmelden
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage

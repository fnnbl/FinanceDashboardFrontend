import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './RegisterPage.module.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login({ email, password })

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Anmeldung fehlgeschlagen.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Anmelden</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
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
              placeholder="Dein Passwort"
              required
              disabled={loading}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>
        <p className={styles.footer}>
          Noch kein Konto?{' '}
          <Link to="/register" className={styles.link}>
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

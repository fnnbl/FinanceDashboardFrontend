import { Link } from 'react-router-dom'
import styles from './RegisterPage.module.css'

const LoginPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Anmelden</h1>
        <p style={{ textAlign: 'center', color: 'var(--form-text-color)' }}>
          Login wird in US-001 implementiert.
        </p>
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

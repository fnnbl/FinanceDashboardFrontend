import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import moonIcon from '../assets/moon.svg'
import sunIcon from '../assets/sun.svg'
import styles from './Navbar.module.css'

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className={styles.logo}>
          Finance Dashboard
        </Link>
        {isAuthenticated && (
          <div className={styles.navLinks}>
            <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link to="/plans" className={styles.navLink}>Pläne</Link>
          </div>
        )}
      </div>
      <div className={styles.navRight}>
        <button
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label="Design wechseln"
        >
          <img
            src={theme === 'dark' ? sunIcon : moonIcon}
            alt={theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'}
            className={styles.themeIcon}
          />
        </button>
        {isAuthenticated && (
          <button onClick={handleLogout} className="btn">
            Abmelden
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar

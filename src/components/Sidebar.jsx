import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import sunIcon from '../assets/sun.svg'
import moonIcon from '../assets/moon.svg'
import styles from './Sidebar.module.css'

const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  if (!isAuthenticated) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? '?'

  const displayName = user?.name || user?.email || ''

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>FD</span>
          <span className={styles.logoText}>Finance Dashboard</span>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </span>
            Dashboard
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
              </svg>
            </span>
            Pläne
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="5" cy="5" r="3" />
                <circle cx="11" cy="11" r="3" />
                <path d="M11 2l2 2-2 2M5 10l-2 2 2 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Kategorien
          </NavLink>
        </nav>
      </div>

      <div className={styles.bottom}>
        <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Design wechseln">
          <img
            src={theme === 'dark' ? sunIcon : moonIcon}
            className={styles.themeIcon}
            alt=""
          />
          {theme === 'dark' ? 'Heller Modus' : 'Dunkler Modus'}
        </button>

        <div className={styles.userSection}>
          <div className={styles.userAvatar}>{initial}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

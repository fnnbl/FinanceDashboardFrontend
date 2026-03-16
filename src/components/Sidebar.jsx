import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import sunIcon from '../assets/sun.svg'
import moonIcon from '../assets/moon.svg'
import logoLight from '../assets/BudgetManagementLightNoDesc.svg'
import logoDark from '../assets/BudgetManagementDarkNoDesc.svg'
import flagDe from '../assets/de.svg'
import flagGb from '../assets/gb.svg'
import styles from './Sidebar.module.css'

const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const menuRef = useRef(null)
  const langRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated) return null

  const handleLogout = async () => {
    setMenuOpen(false)
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
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Finance Dashboard Logo"
            className={styles.logoMark}
          />
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
            <span className={styles.navLabel}>{t('sidebar.dashboard')}</span>
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
            <span className={styles.navLabel}>{t('sidebar.plans')}</span>
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
            <span className={styles.navLabel}>{t('sidebar.categories')}</span>
          </NavLink>
        </nav>
      </div>

      <div className={styles.bottom}>

        {/* Theme + Language icon toggles */}
        <div className={styles.iconToggles}>
          <div className={styles.iconGroup}>
            <button
              className={`${styles.iconBtn} ${theme === 'light' ? styles.iconBtnActive : ''}`}
              onClick={() => setTheme('light')}
              aria-label="Heller Modus"
            >
              <img src={sunIcon} className={styles.iconBtnImg} alt="" />
            </button>
            <button
              className={`${styles.iconBtn} ${theme === 'dark' ? styles.iconBtnActive : ''}`}
              onClick={() => setTheme('dark')}
              aria-label="Dunkler Modus"
            >
              <img src={moonIcon} className={styles.iconBtnImg} alt="" />
            </button>
          </div>

          <div className={styles.langDropdownWrapper} ref={langRef}>
            <button
              className={`${styles.iconBtn} ${langOpen ? styles.iconBtnActive : ''}`}
              onClick={() => setLangOpen((o) => !o)}
              aria-label="Sprache wählen"
            >
              <img src={lang === 'de' ? flagDe : flagGb} className={styles.iconBtnFlag} alt={lang.toUpperCase()} />
            </button>
            {langOpen && (
              <div className={styles.langDropdown}>
                <button
                  className={`${styles.langOption} ${lang === 'de' ? styles.langOptionActive : ''}`}
                  onClick={() => { setLang('de'); setLangOpen(false) }}
                >
                  <img src={flagDe} className={styles.iconBtnFlag} alt="" />
                  <span>Deutsch</span>
                </button>
                <button
                  className={`${styles.langOption} ${lang === 'en' ? styles.langOptionActive : ''}`}
                  onClick={() => { setLang('en'); setLangOpen(false) }}
                >
                  <img src={flagGb} className={styles.iconBtnFlag} alt="" />
                  <span>English</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User menu */}
        <div className={styles.userSection} ref={menuRef}>
          <button
            className={styles.userButton}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Benutzer-Menü"
          >
            <div className={styles.userAvatar}>{initial}</div>
            <span className={styles.userName}>{displayName}</span>
          </button>

          {menuOpen && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuName}>{displayName}</div>
              <button onClick={handleLogout} className={styles.userMenuItem}>
                {t('sidebar.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

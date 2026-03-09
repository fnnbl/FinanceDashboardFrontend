import { createContext, useContext, useState } from 'react'
import de from '../i18n/de'
import en from '../i18n/en'

const translations = { de, en }

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'de')

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'de' ? 'en' : 'de'
      localStorage.setItem('language', next)
      return next
    })
  }

  const switchLang = (value) => {
    localStorage.setItem('language', value)
    setLang(value)
  }

  const t = (key, vars = {}) => {
    const parts = key.split('.')
    let val = translations[lang]
    for (const part of parts) {
      val = val?.[part]
    }
    let str = val ?? key
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v)
    }
    return str
  }

  const tCat = (name, isSystem) => {
    if (!isSystem || lang === 'de') return name
    return translations[lang]?.systemCategories?.[name] ?? name
  }

  const locale = lang === 'de' ? 'de-DE' : 'en-GB'

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLang, toggleLanguage, t, tCat, locale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}

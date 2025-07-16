import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import {initReactI18next} from 'react-i18next'

// import {writable} from 'svelte/store'

// export const initI18n = (defaultLocale?: string | undefined) => {

// }
const detectionOrder = ['localStorage']
const fallbackDefaultLocale = [localStorage.locales, 'en']

const loadResource = (language: string, namespace: string) =>
  import(`./locales/${language}/${namespace}.json`)

i18next
  .use(resourcesToBackend(loadResource))
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    detection: {
      order: detectionOrder,
      // caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'locales',
    },
    // lng: localStorage.locales || 'en',
    fallbackLng: {
      // zh: 'zh',
      // en: 'en',
      // default: localStorage.locales,
    },
    ns: 'translation',
    returnEmptyString: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false, // not needed for svelte as it escapes by default
    },
  })
// const i18n = createI18nStore(i18next)
// const isLoadingStore = createIsLoadingStore(i18next)

export const getLanguages = async () => {
  const languages = (await import(`./locales/languages.json`)).default
  return languages
}
// export default i18n
// export const isLoading = isLoadingStore

export default i18next

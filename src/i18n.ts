
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// les ressources de traductions
const resources = {
  en: {
    translation: {
      // Ajouter les clés de traduction en anglais ici
      "welcome": "Welcome to ConvoySync",
    }
  },
  fr: {
    translation: {
      // Ajouter les clés de traduction en français ici
      "welcome": "Bienvenue sur ConvoySync",
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "fr", // langue par défaut
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;

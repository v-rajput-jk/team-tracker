import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'English (India)' | 'Hindi' | 'Spanish' | 'French';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  'English (India)': {
    'nav.dashboard': 'Dashboard',
    'nav.tasks': 'Project',
    'nav.attendance': 'Attendance',
    'nav.schedule': 'Schedule',
    'nav.overtime': 'Overtime',
    'nav.performance': 'Performance',
    'nav.settings': 'Settings',
    'nav.navigation': 'Navigation',
    'nav.quickstats': 'Quick Stats',
    'nav.activeTasks': 'Active Tasks',
    'nav.teamMembers': 'Team Members',
    'nav.efficiency': 'Efficiency',
    'settings.title': 'Account Settings',
    'settings.subtitle': 'Manage your profile and preferences',
    'settings.profile': 'Profile',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.preferences': 'Preferences',
    'settings.save': 'Save Changes',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.fullName': 'Full Name',
    'settings.email': 'Email Address',
    'settings.bio': 'Short Bio',
  },
  'Hindi': {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.tasks': 'कार्य',
    'nav.attendance': 'उपस्थिति',
    'nav.schedule': 'अनुसूची',
    'nav.overtime': 'अतिरिक्त समय',
    'nav.performance': 'प्रदर्शन',
    'nav.settings': 'सेटिंग्स',
    'nav.navigation': 'नेविगेशन',
    'nav.quickstats': 'त्वरित आँकड़े',
    'nav.activeTasks': 'सक्रिय कार्य',
    'nav.teamMembers': 'टीम के सदस्य',
    'nav.efficiency': 'क्षमता',
    'settings.title': 'खाता सेटिंग',
    'settings.subtitle': 'अपनी प्रोफ़ाइल और प्राथमिकताएं प्रबंधित करें',
    'settings.profile': 'प्रोफ़ाइल',
    'settings.security': 'सुरक्षा',
    'settings.notifications': 'सूचनाएं',
    'settings.preferences': 'प्राथमिकताएं',
    'settings.save': 'परिवर्तन सहेजें',
    'settings.language': 'भाषा',
    'settings.timezone': 'समय क्षेत्र',
    'settings.fullName': 'पूरा नाम',
    'settings.email': 'ईमेल पता',
    'settings.bio': 'संक्षिप्त विवरण',
  },
  'Spanish': {
    'nav.dashboard': 'Panel',
    'nav.tasks': 'Tareas',
    'nav.attendance': 'Asistencia',
    'nav.schedule': 'Horario',
    'nav.overtime': 'Horas extras',
    'nav.performance': 'Rendimiento',
    'nav.settings': 'Configuración',
    'nav.navigation': 'Navegación',
    'nav.quickstats': 'Estadísticas',
    'nav.activeTasks': 'Tareas activas',
    'nav.teamMembers': 'Miembros',
    'nav.efficiency': 'Eficiencia',
    'settings.title': 'Configuración',
    'settings.subtitle': 'Gestiona tu perfil y preferencias',
    'settings.profile': 'Perfil',
    'settings.security': 'Seguridad',
    'settings.notifications': 'Notificaciones',
    'settings.preferences': 'Preferencias',
    'settings.save': 'Guardar cambios',
    'settings.language': 'Idioma',
    'settings.timezone': 'Zona horaria',
    'settings.fullName': 'Nombre completo',
    'settings.email': 'Correo electrónico',
    'settings.bio': 'Biografía',
  },
  'French': {
    'nav.dashboard': 'Tableau de bord',
    'nav.tasks': 'Tâches',
    'nav.attendance': 'Présence',
    'nav.schedule': 'Horaire',
    'nav.overtime': 'Heures suppl.',
    'nav.performance': 'Performance',
    'nav.settings': 'Paramètres',
    'nav.navigation': 'Navigation',
    'nav.quickstats': 'Statistiques',
    'nav.activeTasks': 'Tâches actives',
    'nav.teamMembers': 'Membres',
    'nav.efficiency': 'Efficacité',
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Gérer votre profil et vos préférences',
    'settings.profile': 'Profil',
    'settings.security': 'Sécurité',
    'settings.notifications': 'Notifications',
    'settings.preferences': 'Préférences',
    'settings.save': 'Sauvegarder',
    'settings.language': 'Langue',
    'settings.timezone': 'Fuseau horaire',
    'settings.fullName': 'Nom complet',
    'settings.email': 'E-mail',
    'settings.bio': 'Biographie',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English (India)');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Custom theme for Music Battle Fight Night
const musicBattleTheme = {
  dark: false,
  colors: {
    primary: '#8B5CF6', // Purple
    'primary-darken-1': '#7C3AED',
    secondary: '#EC4899', // Pink
    'secondary-darken-1': '#DB2777',
    accent: '#06B6D4', // Cyan
    'accent-darken-1': '#0891B2',
    error: '#EF4444',
    'error-darken-1': '#DC2626',
    warning: '#F59E0B',
    'warning-darken-1': '#D97706',
    info: '#3B82F6',
    'info-darken-1': '#2563EB',
    success: '#10B981',
    'success-darken-1': '#059669',
    surface: '#FFFFFF',
    'surface-variant': '#F1F5F9',
    'on-surface': '#1E293B',
    'on-surface-variant': '#64748B',
    background: '#F8FAFC',
    'on-background': '#0F172A'
  }
}

const musicBattleThemeDark = {
  dark: true,
  colors: {
    primary: '#A855F7', // Lighter purple for dark mode
    'primary-darken-1': '#9333EA',
    secondary: '#F472B6', // Lighter pink for dark mode
    'secondary-darken-1': '#EC4899',
    accent: '#22D3EE', // Lighter cyan for dark mode
    'accent-darken-1': '#06B6D4',
    error: '#F87171',
    'error-darken-1': '#EF4444',
    warning: '#FBBF24',
    'warning-darken-1': '#F59E0B',
    info: '#60A5FA',
    'info-darken-1': '#3B82F6',
    success: '#34D399',
    'success-darken-1': '#10B981',
    surface: '#1E293B',
    'surface-variant': '#334155',
    'on-surface': '#F1F5F9',
    'on-surface-variant': '#CBD5E1',
    background: '#0F172A',
    'on-background': '#F8FAFC'
  }
}

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'musicBattleLight',
    themes: {
      musicBattleLight: musicBattleTheme,
      musicBattleDark: musicBattleThemeDark
    },
    variations: {
      colors: ['primary', 'secondary', 'accent'],
      lighten: 4,
      darken: 4
    }
  },
  defaults: {
    VBtn: {
      color: 'primary',
      variant: 'elevated',
      style: 'text-transform: none;'
    },
    VCard: {
      elevation: 2
    },
    VTextField: {
      variant: 'outlined',
      color: 'primary'
    },
    VTextarea: {
      variant: 'outlined',
      color: 'primary'
    }
  }
})

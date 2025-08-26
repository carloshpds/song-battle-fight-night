// @ts-ignore
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import { sbfnDarkTheme, sbfnLightTheme } from './vuetifyThemes'


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
    defaultTheme: 'sbfnDarkTheme',
    themes: {
      sbfnLightTheme,
      sbfnDarkTheme
    },
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

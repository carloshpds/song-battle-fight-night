import type { ThemeDefinition } from "vuetify"

const blue = '#247eb9'
const darkenBlue = '#1e6a9b'
const gray = '#484848'
const green = '#65f200'
const darkenGreen = '#52c000'
const red = '#f20400'
const yellow = '#f2ba00'
const orange = '#f46e12'
const purple = '#7900f2'
const pink = '#f2006d'
const darkenOrange = '#d35400' // c85910
const black = '#1a1a1a'
const twitterBlue = '#0095f2'
const steamBlack = '#1a1a1a'


export const sbfnLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: green,
    'primary-darken-1': darkenGreen,
    secondary: orange,
    'secondary-darken-1': darkenOrange,
    'on-secondary': '#000000',
    error: red,
    info: twitterBlue,
    success: green,
    warning: yellow,
    yellow,
    red,
    blue,
    green,
    purple,
    pink,
    gray
  },
}


export const sbfnDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: black,
    surface: steamBlack,
    primary: green,
    'primary-darken-1': darkenGreen,
    secondary: orange,
    'secondary-darken-1': darkenOrange,
    'on-secondary': '#000000',
    error: red,
    info: twitterBlue,
    success: green,
    warning: yellow,
    yellow,
    red,
    blue,
    green,
    purple,
    pink,
    gray
  },
}

export const sbfnOceanBlueTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#006DFF',
    primary: twitterBlue,
    'primary-darken-1': darkenBlue,
    secondary: orange,
    'secondary-darken-1': darkenOrange,
    'on-secondary': '#000000',
    error: red,
    info: twitterBlue,
    success: green,
    warning: yellow,
    yellow,
    red,
    blue,
    green,
    purple,
    pink,
    gray
  }
}

export const sbfnThemes = [
  {
    name: 'sbfnLightTheme',
    settings: sbfnLightTheme,
  },
  {
    name: 'sbfnDarkTheme',
    settings: sbfnDarkTheme
  }
]
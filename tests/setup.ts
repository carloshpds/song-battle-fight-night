import { beforeEach } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Vuetify components
config.global.stubs = {
  'v-card': { template: '<div class="v-card"><slot /></div>' },
  'v-img': { template: '<div class="v-img"><slot /></div>' },
  'v-btn': { template: '<button class="v-btn" v-bind="$attrs"><slot /></button>' },
  'v-icon': { template: '<i class="v-icon"></i>' },
  'v-chip': { template: '<div class="v-chip"><slot /></div>' },
  'v-card-text': { template: '<div class="v-card-text"><slot /></div>' },
  'v-card-actions': { template: '<div class="v-card-actions"><slot /></div>' },
  'v-alert': { template: '<div class="v-alert"><slot /></div>' },
  'v-progress-linear': { template: '<div class="v-progress-linear"></div>' }
}

// Mock global objects if needed
beforeEach(() => {
  // Reset any global state before each test
  // Mock implementations can be added here
})

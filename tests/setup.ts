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
  'v-progress-linear': { template: '<div class="v-progress-linear"></div>' },
  'v-avatar': { template: '<div class="v-avatar"><slot /></div>' },
  'v-card-title': { template: '<div class="v-card-title"><slot /></div>' },
  'v-col': { template: '<div class="v-col"><slot /></div>' },
  'v-row': { template: '<div class="v-row"><slot /></div>' },
  'v-container': { template: '<div class="v-container"><slot /></div>' },
  'v-text-field': { template: '<input class="v-text-field" v-bind="$attrs" />' },
  'v-tab': { template: '<div class="v-tab"><slot /></div>' },
  'v-tabs': { template: '<div class="v-tabs"><slot /></div>' },
  'v-divider': { template: '<div class="v-divider"></div>' },
  'v-pagination': { template: '<div class="v-pagination"></div>' },
  'v-window-item': { template: '<div class="v-window-item"><slot /></div>' },
  'v-window': { template: '<div class="v-window"><slot /></div>' },
  'v-dialog': { template: '<div class="v-dialog"><slot /></div>' }
}

// Mock global objects if needed
beforeEach(() => {
  // Reset any global state before each test
  // Mock implementations can be added here
})

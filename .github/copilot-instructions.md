# Instruções do GitHub Copilot

## 📋 Visão Geral do Projeto
Song Battle Fight Night é uma aplicação Vue.js que gamifica a descoberta musical através de batalhas 1v1 entre faixas do Spotify, organizadas em torneios eliminatórios.

### Stack Tecnológico
- **Framework**: Vue.js 3 com Composition API
- **Linguagem**: TypeScript com verificação de tipos rigorosa
- **UI Framework**: Vuetify 3 (não Tailwind CSS)
- **Gerenciamento de Estado**: Pinia stores
- **Ferramenta de Build**: Vite
- **Gerenciador de Pacotes**: PNPM
- **Testes**: Vitest com @vue/test-utils
- **Cliente HTTP**: Axios
- **Áudio**: Howler.js para reprodução de áudio
- **Integração**: Spotify Web API com OAuth 2.0

## �️ Arquitetura e Padrões

### Estrutura Feature-Based
O projeto usa uma arquitetura baseada em features, onde cada domínio é autocontido:

```
src/features/{feature}/
├── components/     # Componentes específicos da feature
├── composables/    # Lógica reativa reutilizável
├── routes/         # Rotas Vue Router
├── services/       # Lógica de negócio e API calls
├── stores/         # Estado global Pinia
├── types/          # TypeScript interfaces
└── views/          # Componentes de página
```

### Features Principais
- **spotify-integration**: OAuth, playlists, API do Spotify
- **battle**: Sistema de batalhas 1v1, votação, leaderboard
- **tournament**: Torneios eliminatórios, progressão, rankings
- **audio-player**: Reprodução de previews, controles de áudio

### Fluxo de Dados Central
1. **Autenticação**: `SpotifyAuthService` → `spotifyStore` → localStorage
2. **Playlists**: `SpotifyApiService` → `spotifyStore.userPlaylists`
3. **Batalhas**: `battleStore` ↔ `battleTournamentService` → localStorage
4. **Áudio**: `useAudio` composable + Howler.js para previews

### Padrões de Integração
- **Stores Cross-Feature**: `battleStore` consome `spotifyStore` diretamente
- **Service Layer**: Classes com métodos async para operações complexas
- **Composables**: Lógica reativa shared (ex: `useAudio` para som)
- **localStorage**: Persistência de torneios e dados de batalha

## 🛠️ Comandos e Workflows

### Desenvolvimento
```bash
pnpm dev              # Servidor de desenvolvimento (porta 5173)
pnpm build            # Build para produção
pnpm preview          # Preview do build
pnpm test             # Testes unitários com Vitest
pnpm test:ui          # Interface gráfica dos testes
pnpm test:coverage    # Cobertura de testes
pnpm lint             # ESLint com auto-fix
pnpm type-check       # Verificação TypeScript sem build
```

### Configuração Spotify
- Criar app no [Spotify Dashboard](https://developer.spotify.com/dashboard)
- Redirect URI: `http://localhost:5173/auth/callback`
- Variáveis: `VITE_SPOTIFY_CLIENT_ID` no `.env`

## 💡 Convenções Específicas do Projeto

### Component Props e Emits
```typescript
// Sempre defina interfaces para props complexas
interface SpotifyEmbedOptions {
  theme?: 'dark' | 'light'
  compact?: boolean
  autoplay?: boolean
}

// Use defineEmits com tipagem
interface Emits {
  (e: 'vote', trackId: string): void
}
const emit = defineEmits<Emits>()
```

### Stores Pattern
```typescript
// Padrão Pinia: exported functions, internal refs
export const useFeatureStore = defineStore('feature', () => {
  const state = ref<Type>()
  const computed = computed(() => /* logic */)
  const action = async () => { /* logic */ }
  return { state, computed, action }
})
```

### Service Classes
```typescript
// Services são classes com métodos static/instance
export class SpotifyApiService {
  constructor(private accessToken: string) {}

  async getCurrentUser(): Promise<SpotifyUser> {
    // API calls com error handling
  }
}
```

### Error Handling Pattern
- Stores capturam erros de services e atualizam `error.value`
- Components mostram erros via reactive error state
- Console.error para debugging, console.warn para falhas esperadas

## 🎯 Spotify Integration Patterns

### OAuth Flow
1. `SpotifyAuthService.login()` → redirect para Spotify
2. Callback em `/auth/callback` → `AuthCallbackView`
3. `spotifyStore.handleCallback()` → armazena tokens
4. Auto-refresh de tokens quando expiram

### Track Data Flow
1. Import playlist → `TrackParsingService.parseTracks()`
2. Validate previews → filter tracks sem preview_url
3. Battle system → `battleStore.createBattle(trackA, trackB)`
4. Audio preview → `useSpotifyAudio` composable

## 🧪 Padrões de Teste

### Mocking Services
```typescript
// Mock services em vez de stores quando possível
vi.mock('@/features/spotify-integration/services/spotifyApiService')
```

### Component Testing
```typescript
describe('ComponentName', () => {
  describe('when user action', () => {
    describe('and condition', () => {
      test('then expected behavior', () => {
        // BDD-style test structure
      })
    })
  })
})
```

### Vuetify Testing
- Use `createVuetify()` no setup para componentes com v-components
- Mock `useDisplay()` para testes responsivos
- Test eventos de componentes via `wrapper.emitted()`

## 🧪 Padrões de Testes
- **Framework**: Vitest com @vue/test-utils
- **Padrão**: BDD (Behavior Driven Development)
- **Estrutura**: Use `describe`, `test` e `expect`
- **Organização**:
  - Use `describe` para agrupar testes relacionados
  - Use o padrão "when", "and", "then" para descrição de comportamento
  - Cada "when" e "and" deve ter um bloco `describe`
  - Cada "then" deve ser um `test` separado
- **Cobertura**: Teste casos de sucesso, falha e casos extremos
- **Isolamento**: Use mocks e spies para dependências externas
- **Nomenclatura**: Nunca abrevie nomes de variáveis, parâmetros ou funções

### Estrutura de Exemplo de Arquivo de Teste
```typescript
describe('ComponentName', () => {
  describe('when user clicks button', () => {
    describe('and has valid data', () => {
      test('then should emit success event', () => {
        // Implementação do teste
      })
    })
  })
})
```

## 📝 Diretrizes de Revisão de Código
- **Idioma**: Sempre responder em português (pt-BR) para feedback
- **Estrutura**: Organizar feedback em seções:
  - **Análise Geral**
  - **Problemas Identificados**
  - **Sugestões de Melhoria**
  - **Testes Recomendados**
- **Referências**: Links para regras de Clean Code usando formato específico
- **Qualidade**: Verificar contra regras do ESLint e melhores práticas

## 🚀 Descrições de Pull Request
- **Idioma**: Português (pt-BR)
- **Template**: Use `.github/pull_request_template.md`
- **Seções**:
  - **📦 O QUÊ**: Resumo das mudanças e link do ticket Jira
  - **🧐 O PORQUÊ**: Motivo das mudanças
  - **🎯 COMO**: Abordagem de implementação
- **Formato**: Pronto para copiar e colar markdown

## 🛠️ Comandos de Desenvolvimento
- **Instalação**: `pnpm install`
- **Servidor de Dev**: `pnpm dev` (porta 5173)
- **Build**: `pnpm build`
- **Preview**: `pnpm preview`
- **Testes**: `pnpm test`
- **Interface de Testes**: `pnpm test:ui`
- **Cobertura**: `pnpm test:coverage`
- **Lint**: `pnpm lint`
- **Type Check**: `pnpm type-check`

## 📚 Arquivos de Referência
- **Padrões de Código**: `.github/instructions/js-guideline.instructions.md`
- **Diretrizes de Teste**: `.github/instructions/test.instructions.md`
- **Processo de Revisão**: `.github/instructions/review.instructions.md`
- **Configuração ESLint**: `eslint.config.mjs`
- **Configuração Vite**: `vite.config.ts`
- **Configuração Vitest**: `vitest.config.ts`

## 🎯 Princípios Fundamentais
1. **Segurança de Tipos**: Aproveite totalmente o TypeScript
2. **Feature-First**: Cada feature é autocontida e independente
3. **Composition API**: Use Vue 3 Composition API exclusivamente
4. **Reactive Data**: Preferir refs/reactive a options API
5. **Service Layer**: Separar lógica de negócio em services
6. **Error Handling**: Capturar e exibir erros graciosamente
7. **Performance**: Considere lazy loading e code splitting
8. **Acessibilidade**: Garanta conformidade com WCAG
9. **Testabilidade**: Escreva código testável com mocks apropriados
10. **Persistência**: Use localStorage para dados de sessão

## 🚨 Observações Importantes
- Sempre use Vuetify 3 para componentes UI (não Tailwind CSS)
- Mantenha stores simples e focadas em uma responsabilidade
- Use PNPM para gerenciamento de pacotes
- Garanta compatibilidade com Spotify Web API
- Suporte tema escuro nativo do Vuetify
- Todos os textos da interface devem estar em português brasileiro
# Instruções do GitHub Copilot

## 📋 Visão Geral do Projeto
Este é o projeto aplicação Vue.js moderna usando TypeScript e Tailwind CSS v4.

### Stack Tecnológico
- **Framework**: Vue.js 3 com Composition API
- **Linguagem**: TypeScript com verificação de tipos rigorosa
- **Ferramenta de Build**: Vite
- **Gerenciador de Pacotes**: PNPM v10
- **Versão do Node**: v22.16.0
- **Estilização**: Tailwind CSS v4
- **Testes**: Vitest com @vue/test-utils
- **Linting**: ESLint com regras customizadas
- **Cliente HTTP**: Axios
- **Documentação**: Storybook v8

## 🎯 Diretrizes para Geração de Código

### Padrões Gerais de Código
- **Idioma**: Sempre escreva o código em inglês (en-US)
- **Convenções de Nomenclatura**:
  - Variáveis e funções: camelCase
  - Classes e componentes: PascalCase
  - Arquivos e diretórios: camelCase
- **TypeScript**: Use tipagem rigorosa, evite `any`
- **Estilo Vue**: Composition API com `<script setup>`
- **Imports**: Use imports explícitos com extensões `.js` em arquivos de biblioteca

### Desenvolvimento de Componentes
- **Estrutura**: Siga o padrão Single File Component (SFC)
- **Props**: Defina interfaces TypeScript para todas as props
- **Emits**: Use `defineEmits` com assinaturas TypeScript
- **Estilização**: Use Tailwind CSS com suporte ao modo escuro (classes `dark:`)
- **Acessibilidade**: Inclua atributos ARIA e HTML semântico

### Organização de Arquivos
- **Componentes**: Cada componente deve ter:
  - `ComponentName.vue` - Arquivo principal do componente
  - `ComponentName.spec.ts` - Testes unitários (obrigatório)
  - `ComponentName.stories.ts` - Documentação do Storybook (obrigatório)
- **Serviços**: Use o padrão de serviços para chamadas de API
- **Tipos**: Defina interfaces em arquivos separados quando compartilhados

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
- **Servidor de Dev**: `nx serve watson`
- **Build**: `nx build watson`
- **Testes**: `nx test`
- **Lint**: `nx lint`
- **Storybook**: `nx storybook lemes-ui`

## 📚 Arquivos de Referência
- **Padrões de Código**: `../.ai/instructions/js-guideline.instructions.md`
- **Diretrizes de Teste**: `../.ai/instructions/test.instructions.md`
- **Processo de Revisão**: `../.ai/instructions/review.instructions.md`
- **Templates de PR**: `../.ai/instructions/pr.instructions.md`
- **Configuração ESLint**: `eslint.config.mjs`
- **Clean Code**: `../.ai/instructions/js-clean-code.md`

## 🎯 Princípios Fundamentais
1. **Segurança de Tipos**: Aproveite totalmente o TypeScript
2. **Isolamento de Componentes**: Cada componente deve ser autocontido
3. **Testes em Primeiro Lugar**: Escreva testes para todo código novo
4. **Documentação**: Mantenha as stories do Storybook
5. **Performance**: Considere as melhores práticas de performance do Vue 3
6. **Acessibilidade**: Garanta conformidade com WCAG
7. **Manutenibilidade**: Siga os princípios do Clean Code
8. **Consistência**: Aderir aos padrões estabelecidos

## 🚨 Observações Importantes
- Sempre use Tailwind CSS v4 (versão mais recente)
- Mantenha a estrutura TS Project References
- Siga os limites do workspace NX
- Use PNPM para gerenciamento de pacotes
- Garanta compatibilidade entre navegadores
- Suporte tanto temas claro quanto escuro
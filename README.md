<div align="center">

# 🎵⚔️ Music Battle Fight Night

### *Descubra a música suprema através de batalhas épicas!*

[![Build Status](https://img.shields.io/github/workflow/status/carloshpds/music-battle-fight-night/CI)](https://github.com/carloshpds/music-battle-fight-night/actions)
[![Version](https://img.shields.io/github/package-json/v/carloshpds/music-battle-fight-night)](https://github.com/carloshpds/music-battle-fight-night)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributors](https://img.shields.io/github/contributors/carloshpds/music-battle-fight-night)](https://github.com/carloshpds/music-battle-fight-night/graphs/contributors)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/carloshpds/music-battle-fight-night/pulls)

---

**Uma experiência interativa e divertida para descobrir suas músicas favoritas através de batalhas diretas**

[🚀 Demo ao Vivo](https://music-battle-fight-night.vercel.app) • [📋 Roadmap](#roadmap) • [🤝 Contribuir](#contribuindo)

</div>

---

## 🎯 Sobre o Projeto

O **Music Battle Fight Night** é uma aplicação web moderna que transforma a descoberta musical em uma experiência gamificada e envolvente. Conecte sua conta do Spotify, selecione suas playlists favoritas e deixe suas músicas lutarem em batalhas épicas 1v1 até encontrar a campeã absoluta!

### ✨ Por que usar?

- 🎪 **Diversão garantida**: Torne a seleção musical uma experiência interativa
- 🎵 **Redescubra sua música**: Encontre gems escondidas em suas playlists
- 🏆 **Competição amigável**: Veja qual música realmente reina suprema
- 📱 **Interface moderna**: Design responsivo e intuitivo
- 🔐 **Seguro**: Integração oficial com Spotify API

---

## 🚀 Features

### ✅ Implementado (v0.1)
- 🔑 **Autenticação Spotify**: Login seguro com OAuth 2.0
- 📋 **Import de Playlists**: Carregue suas playlists favoritas
- ⚔️ **Sistema de Batalhas**: Confrontos 1v1 entre músicas
- 🎵 **Preview de Áudio**: Escute trechos das músicas
- 🏆 **Leaderboard**: Ranking das músicas mais vitoriosas
- 📱 **Design Responsivo**: Funciona perfeitamente em todos os dispositivos

### 🚧 Em Desenvolvimento
- 💾 **Persistência Local**: Salvar batalhas e resultados
- 📊 **Estatísticas Avançadas**: Analytics detalhadas das batalhas
- 🎨 **Temas Personalizados**: Múltiplas opções visuais

### 📋 Próximas Features
- 👥 **Modo Multiplayer**: Batalhas em tempo real com amigos
- 🌐 **Salas Públicas**: Participe de batalhas globais
- 🏅 **Sistema de Rankings**: Rankings globais de usuários
- 🔄 **Batalhas por Turnos**: Jogabilidade mais estratégica

---

## 🛠️ Tecnologias

<div align="center">

| Frontend | Backend/API | Ferramentas |
|----------|-------------|-------------|
| ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white) | ![Spotify API](https://img.shields.io/badge/Spotify-1ED760?style=for-the-badge&logo=spotify&logoColor=white) | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) | ![Howler.js](https://img.shields.io/badge/Howler.js-FF6B6B?style=for-the-badge&logo=javascript&logoColor=white) | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white) |
| ![Vuetify](https://img.shields.io/badge/Vuetify-1867C0?style=for-the-badge&logo=vuetify&logoColor=white) | ![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=javascript&logoColor=black) | ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white) |

</div>

### Stack Técnico Detalhado
- **Vue 3** com Composition API e `<script setup>`
- **TypeScript** para tipagem forte
- **Vuetify 3** para componentes Material Design
- **Pinia** para gerenciamento de estado
- **Vue Router 4** para navegação SPA
- **Howler.js** para reprodução de áudio
- **Axios** para requisições HTTP
- **Vitest** para testes unitários

---

## 🎮 Como Funciona

1. **🔗 Conecte**: Faça login com sua conta Spotify
2. **📋 Importe**: Selecione uma ou mais playlists
3. **⚔️ Batalhe**: Vote na melhor música em confrontos 1v1
4. **🏆 Descubra**: Veja qual música se torna a campeã!

---

## 📈 Roadmap

### 🎯 Versão 1.0 - Single Player (Q4 2024)
- [x] Integração com Spotify API
- [x] Sistema de batalhas básico
- [x] Interface de usuário responsiva
- [ ] Sistema de batalhas com torneios por playlist
- [ ] Sistema de persistência
- [ ] Melhorias na UX/UI
- [ ] Testes automatizados completos

### 🌟 Versão 2.0 - Multiplayer (Q2 2025)
- [ ] Backend em tempo real (WebSockets)
- [ ] Sistema de salas de batalha
- [ ] Chat integrado
- [ ] Votação por maioria
- [ ] Ranking global de usuários

### 🚀 Versão 3.0 - Recursos Avançados (Q4 2025)
- [ ] Torneios programados
- [ ] Sistema de ligas
- [ ] Análise musical com IA
- [ ] Integração com outras plataformas
- [ ] App mobile nativo

---

## 🏃‍♂️ Quick Start

### Pré-requisitos

- **Node.js** 18+
- **pnpm** 8+
- **Conta Spotify** (grátis ou premium)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/carloshpds/music-battle-fight-night.git

# Entre no diretório
cd music-battle-fight-night

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Spotify
```

### Configuração do Spotify

1. Acesse o [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Crie um novo app
3. Adicione `http://localhost:5173/auth/callback` nas Redirect URIs
4. Copie o **Client ID** e **Client Secret** para o `.env`

### Executando

```bash
# Modo desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Executar testes
pnpm test

# Lint do código
pnpm lint
```

Acesse `http://localhost:5173` no seu navegador! 🎉

---

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Testes com interface
pnpm test:ui

# Cobertura de testes
pnpm test:coverage

# Testes em modo watch
pnpm test --watch
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este projeto segue as melhores práticas de desenvolvimento e tem como objetivo ser um ambiente de aprendizado colaborativo.

### Como Contribuir

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### Guidelines

- 📝 **Commits**: Use [Conventional Commits](https://conventionalcommits.org/)
- 🧪 **Testes**: Mantenha cobertura de testes acima de 80%
- 📚 **Documentação**: Documente novas features
- 🎨 **Código**: Siga os padrões ESLint/Prettier

### Áreas que Precisam de Ajuda

- 🎨 **UI/UX Design**: Melhorias na interface
- 🧪 **Testes**: Expandir cobertura de testes
- 📱 **Mobile**: Otimizações para dispositivos móveis
- 🌐 **Internacionalização**: Suporte a múltiplos idiomas
- 🔧 **DevOps**: CI/CD e automações

---

## 📱 Screenshots

<div align="center">

### 🏠 Tela Principal
<img src="docs/screenshots/home.png" alt="Home Screen" width="400"/>

### ⚔️ Batalha Musical
<img src="docs/screenshots/battle.png" alt="Battle Screen" width="400"/>

### 🏆 Leaderboard
<img src="docs/screenshots/leaderboard.png" alt="Leaderboard" width="400"/>

</div>

---

## 🐛 Issues e Feature Requests

Encontrou um bug? Tem uma ideia incrível?

- 🐛 **Bug Reports**: [Criar Issue](https://github.com/carloshpds/music-battle-fight-night/issues/new?template=bug_report.md)
- ✨ **Feature Requests**: [Sugerir Feature](https://github.com/carloshpds/music-battle-fight-night/issues/new?template=feature_request.md)
- 💬 **Discussões**: [Discussions](https://github.com/carloshpds/music-battle-fight-night/discussions)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- 🎵 **Spotify** pela incrível Web API
- 🖼️ **Vuetify Team** pelos componentes elegantes
- 👥 **Vue.js Community** pelo framework fantástico
- 🎨 **Material Design Icons** pelos ícones incríveis

---

## 📞 Contato

**Carlos Henrique** - [@carloshpds](https://github.com/carloshpds)

**Link do Projeto**: [https://github.com/carloshpds/music-battle-fight-night](https://github.com/carloshpds/music-battle-fight-night)

---

<div align="center">

### ⭐ Se este projeto te ajudou, considere dar uma estrela!

**Feito com ❤️ e muito ☕**

</div>

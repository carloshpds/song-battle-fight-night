---
description: 'Refinar o requisito ou issue com Critérios de Aceitação, Considerações Técnicas, Casos Extremos e RNFs'
tools: [ 'list_issues','githubRepo', 'search', 'add_issue_comment','create_issue','create_issue_comment','update_issue','delete_issue','get_issue', 'search_issues']
---

# Modo de Chat para Refinamento de Requisitos ou Issues

Quando ativado, este modo permite ao GitHub Copilot analisar uma issue existente e enriquecê-la com detalhes estruturados incluindo:

- Descrição detalhada com contexto e background
- Critérios de aceitação em formato testável
- Considerações técnicas e dependências
- Casos extremos e riscos potenciais
- RNF (Requisitos Não Funcionais) esperados

## Passos para Executar
1. Ler a descrição da issue e entender o contexto.
2. Modificar a descrição da issue para incluir mais detalhes.
3. Adicionar critérios de aceitação em formato testável.
4. Incluir considerações técnicas e dependências.
5. Adicionar casos extremos e riscos potenciais.
6. Fornecer sugestões para estimativa de esforço.
7. Revisar o requisito refinado e fazer ajustes necessários.

## Uso

Para ativar o modo de Refinamento de Requisitos:

1. Referencie uma issue existente no seu prompt como `refine <issue_URL>`
2. Use o modo: `refine-issue`

## Resultado

O Copilot modificará a descrição da issue e adicionará detalhes estruturados a ela.
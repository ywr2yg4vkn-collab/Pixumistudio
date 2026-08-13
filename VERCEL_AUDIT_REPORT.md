# Auditoria de prontidão do Pixumi Studio para Vercel

## Conclusão executiva

O projeto está **estruturalmente preparado para ser importado na Vercel** como frontend Vite mais uma função Node.js catch-all. O código possui `vercel.json`, `api/[...path].ts`, build de produção, documentação e teste do entrypoint serverless. A Vercel documenta que uma aplicação Express pode ser exportada como uma Function Node.js [1].

Ele ainda **não está operacional sem intervenção manual**, porque depende de banco, OAuth, IA e storage externos. O deploy pode concluir apenas com a configuração de build, mas o primeiro uso real exige que essas integrações sejam configuradas e que as migrações sejam aplicadas.

| Área | Situação atual | Intervenção necessária |
|---|---|---|
| Frontend Vite | Pronto estruturalmente | Configurar variáveis `VITE_*` necessárias |
| Função Node/Express/tRPC | Pronta estruturalmente | Configurar variáveis privadas e testar `/api/health` |
| Banco MySQL/TiDB | Dependência obrigatória | Criar banco, obter `DATABASE_URL` e aplicar migrações |
| OAuth | Dependência obrigatória para login | Criar/configurar app OAuth e registrar callback Vercel |
| IA | Dependência obrigatória para análise e pipeline | Fornecer endpoint Forge compatível e chave |
| Storage | Dependência obrigatória para upload/referência | Fornecer presigned URLs pelo contrato Forge ou substituir o adaptador |
| PDF | Implementado no servidor | Validar após IA, banco e storage funcionarem |
| OpenAI | Não usado diretamente | Não criar chave OpenAI sem adaptar `server/_core/llm.ts` |

## 1. Variáveis de ambiente

O projeto **não possui um arquivo `.env.example` versionado**. Portanto, a resposta à verificação solicitada é: **não, não existe um `.env.example` para estar completo ou incompleto**. Para evitar confusão com credenciais funcionais, a referência completa foi criada em [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md). Os valores reais devem ser cadastrados na Vercel, não no GitHub.

| Nome exato | Obrigatória | Escopo | Onde obter | Exemplo sem segredo |
|---|---:|---|---|---|
| `DATABASE_URL` | Sim | Servidor | Provedor MySQL/TiDB | `mysql://usuario:senha@host:3306/pixumi` |
| `JWT_SECRET` | Sim | Servidor | Gerador aleatório local | `troque-por-segredo-longo` |
| `VITE_APP_ID` | Sim | Cliente/servidor | Aplicação criada no provedor OAuth | `app_pixumi_exemplo` |
| `OAUTH_SERVER_URL` | Sim | Servidor | URL base do servidor OAuth compatível | `https://api.exemplo-oauth.com` |
| `VITE_OAUTH_PORTAL_URL` | Sim | Cliente | Portal OAuth correspondente ao app | `https://portal.exemplo-oauth.com` |
| `OWNER_OPEN_ID` | Recomendável | Servidor | ID OAuth do proprietário | `owner_open_id_exemplo` |
| `BUILT_IN_FORGE_API_URL` | Sim | Servidor | Endpoint Forge ou compatível | `https://forge.exemplo.com` |
| `BUILT_IN_FORGE_API_KEY` | Sim | Servidor | Chave privada do endpoint Forge | `forge_key_exemplo` |
| `VITE_FRONTEND_FORGE_API_URL` | Opcional | Cliente | Proxy/endpoint de mapas, se usado | `https://maps-proxy.exemplo.com` |
| `VITE_FRONTEND_FORGE_API_KEY` | Opcional | Cliente | Chave pública restrita de mapas | `public_map_key_exemplo` |
| `NODE_ENV` | Não | Servidor | Definida pela Vercel | `production` |
| `PORT` | Não | Local | Definida pelo runtime local | `3000` |

As variáveis `VITE_*` são públicas porque são incorporadas ao bundle do navegador. Nunca coloque nelas `DATABASE_URL`, `JWT_SECRET` ou qualquer chave privada. As variáveis privadas devem ser criadas na Vercel para os ambientes **Production**, **Preview** e **Development** conforme o uso.

### Contrato específico da IA e storage

O projeto não chama OpenAI diretamente. `server/_core/llm.ts` usa `BUILT_IN_FORGE_API_URL` para chamar `POST /v1/chat/completions` e `GET /v1/models`, autenticando com `BUILT_IN_FORGE_API_KEY`.

O mesmo par de variáveis é usado pelo upload e pela leitura da referência. O endpoint precisa fornecer `GET /v1/storage/presign/put` e `GET /v1/storage/presign/get`, retornando URLs presignadas. Não basta apontar `BUILT_IN_FORGE_API_URL` para uma API OpenAI comum, porque OpenAI não fornece esse contrato de storage. Para substituir o Forge, será necessário alterar `server/_core/llm.ts`, `server/storage.ts` e `server/_core/storageProxy.ts`.

## 2. Serviços externos

| Serviço | Uso no projeto | Configuração antes do primeiro deploy |
|---|---|---|
| Vercel | Hosting do frontend e Function Node | Importar repositório, manter `pnpm build`, conferir `vercel.json` |
| MySQL/TiDB | Usuários, projetos, etapas, eventos e versões | Criar banco, permitir conexão externa e configurar `DATABASE_URL` |
| OAuth compatível com Manus | Login, callback e sessão | Criar app OAuth, configurar `VITE_APP_ID`, URLs e callback |
| Forge/LLM compatível | Análise visual, agentes e respostas estruturadas | Configurar endpoint e chave privadas |
| Forge storage/S3 presigned | Upload e leitura da referência | Habilitar endpoints presignados no mesmo contrato ou substituir storage |
| Provedor de mapas | Apenas `Map.tsx`, se a funcionalidade for usada | Configurar `VITE_FRONTEND_FORGE_API_URL` e chave pública restrita |
| Node.js runtime | Jimp, PDFKit, Drizzle e Express | Não usar Edge; manter Function Node.js |

Não há dependência direta de OpenAI, Stripe, Shopify, fila, Redis, serviço de PDF externo ou worker persistente. O PDF é gerado no próprio servidor com `pdfkit`; a análise de pixels usa `jimp`; o banco é acessado com `drizzle-orm/mysql2`.

## 3. Prontidão real para Vercel

A configuração está pronta no aspecto estrutural: `vercel.json` aponta para `pnpm build` e `dist/public`, `api/[...path].ts` exporta o app Express e a função é configurada como Node.js. O fallback SPA está configurado para `index.html`. A Vercel informa que assets estáticos devem ser servidos pelo diretório público/CDN e que as limitações gerais das Functions continuam aplicáveis ao Express [1].

Os testes locais registrados na revisão são **34 testes Vitest aprovados**, `pnpm check` aprovado e `pnpm build` aprovado. O pacote usa Node.js porque Jimp, PDFKit, Express e MySQL2 não devem ser tratados como função Edge.

| Ponto | Status |
|---|---|
| Build Vite | Aprovado localmente |
| TypeScript | Aprovado localmente |
| Testes | 34 aprovados |
| Entrypoint serverless | Testado por unidade |
| Build executado dentro do ambiente Vercel | Ainda não confirmado neste projeto |
| Banco externo configurado | Pendente do operador |
| OAuth externo configurado | Pendente do operador |
| Forge/IA/storage configurados | Pendente do operador |
| Login real no domínio Vercel | Pendente de teste manual |
| Primeiro projeto real e PDF | Pendente de teste manual |

As Functions da Vercel possuem limites de duração, memória e tamanho de bundle; no plano Hobby, a documentação indica máximo de 300 segundos por invocação [2]. Como o pipeline faz chamadas de IA e gera PDF, referências muito grandes podem atingir timeout. O projeto não possui fila ou processamento assíncrono persistente.

## 4. Intervenções manuais obrigatórias

A primeira intervenção é criar o banco e aplicar as migrações `drizzle/0000_*.sql` até `drizzle/0003_*.sql` na ordem numérica. O script `db:push` não deve ser executado na Vercel como parte de cada request; migração é uma operação administrativa separada.

A segunda é criar ou conectar o app OAuth e cadastrar o callback absoluto do domínio final: `https://SEU-DOMINIO.vercel.app/api/oauth/callback`. Se um domínio customizado for usado, o callback deve corresponder ao domínio customizado. O navegador também precisa receber `VITE_OAUTH_PORTAL_URL` e `VITE_APP_ID` durante o build.

A terceira é fornecer um endpoint Forge válido. Se a intenção for usar OpenAI, Anthropic ou outro provedor em vez do Forge, a adaptação de código é obrigatória; não é uma simples troca de variável.

A quarta é cadastrar as variáveis na Vercel em todos os ambientes necessários. Variáveis `VITE_*` precisam estar disponíveis no momento do build; variáveis privadas precisam estar disponíveis em runtime. Depois de alterar `VITE_*`, faça um novo deploy, pois elas são incorporadas ao bundle.

## 5. Ordem correta após o deploy

1. Criar o projeto na Vercel a partir do repositório `ywr2yg4vkn-collab/Pixumistudio`.
2. Confirmar que o diretório raiz é a raiz do repositório e que o comando de build é `pnpm build`.
3. Criar o banco MySQL/TiDB e configurar `DATABASE_URL`.
4. Executar as quatro migrações SQL na ordem numérica, fora do ciclo de requests da Vercel.
5. Configurar `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` e `OWNER_OPEN_ID`.
6. Registrar `https://SEU-DOMINIO/api/oauth/callback` no provedor OAuth.
7. Configurar `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY` com o contrato de LLM e storage exigido.
8. Configurar apenas se necessário `VITE_FRONTEND_FORGE_API_URL` e `VITE_FRONTEND_FORGE_API_KEY`.
9. Fazer redeploy para incorporar as variáveis `VITE_*`.
10. Abrir `https://SEU-DOMINIO/api/health` e confirmar `{"ok":true,"service":"pixumi-studio-api"}`.
11. Testar login, criação de projeto pequeno, upload, geração automática da matriz, aprovação, edição de célula e exportação do PDF.
12. Se alguma etapa falhar, revisar primeiro os logs da Function, depois a variável correspondente e finalmente o contrato do serviço externo.

## Referências

[1]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel — documentação oficial"
[2]: https://vercel.com/docs/functions/limitations "Vercel Functions Limits — documentação oficial"

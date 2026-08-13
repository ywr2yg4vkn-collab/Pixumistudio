# Variáveis de ambiente do Pixumi Studio

Este arquivo é a referência completa da configuração atual. O projeto **não mantém um arquivo `.env.example` versionado** de propósito: os valores reais devem ser inseridos no painel da Vercel ou em um arquivo `.env.local` ignorado pelo Git durante o desenvolvimento. Os exemplos abaixo são sintéticos e não são credenciais funcionais.

| Nome exato | Obrigatória | Escopo | Onde obter | Exemplo seguro |
|---|---:|---|---|---|
| `DATABASE_URL` | Sim | Servidor | Painel do provedor MySQL/TiDB | `mysql://usuario:senha@host:3306/pixumi` |
| `JWT_SECRET` | Sim | Servidor | Gere localmente com um gerador aleatório | `troque-por-um-segredo-hexadecimal-longo` |
| `VITE_APP_ID` | Sim | Cliente e servidor | Aplicação criada no provedor OAuth | `app_pixumi_exemplo` |
| `OAUTH_SERVER_URL` | Sim | Servidor | URL base do servidor OAuth Manus compatível | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Sim | Cliente | URL do portal OAuth correspondente ao app | `https://portal-oauth.exemplo.com` |
| `OWNER_OPEN_ID` | Recomendável | Servidor | Identificador OAuth do proprietário | `owner_open_id_exemplo` |
| `BUILT_IN_FORGE_API_URL` | Sim | Servidor | Endpoint Forge ou API compatível com `/v1/chat/completions`, `/v1/models` e `/v1/storage/presign/*` | `https://forge.exemplo.com` |
| `BUILT_IN_FORGE_API_KEY` | Sim | Servidor | Chave do endpoint Forge/storage | `forge_key_exemplo_nunca_commitada` |
| `VITE_FRONTEND_FORGE_API_URL` | Opcional | Cliente | Endpoint público/proxy de mapas, se o componente de mapa for usado | `https://forge.exemplo.com` |
| `VITE_FRONTEND_FORGE_API_KEY` | Opcional | Cliente | Chave pública restrita ou proxy de mapas | `public_map_key_exemplo` |
| `GEMINI_API_KEY` | Sim no modo gratuito | Servidor | Google AI Studio → API keys | `AIza...` |
| `GEMINI_MODEL` | Não | Servidor | Modelo Gemini compatível | `gemini-2.5-flash` |
| `R2_ENDPOINT` | Sim no modo gratuito | Servidor | Cloudflare R2 → S3 API | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Sim no modo gratuito | Servidor | Token de API do Cloudflare R2 | `r2_access_example` |
| `R2_SECRET_ACCESS_KEY` | Sim no modo gratuito | Servidor | Token de API do Cloudflare R2 | `r2_secret_example` |
| `R2_BUCKET` | Sim no modo gratuito | Servidor | Bucket criado no Cloudflare R2 | `pixumi-personal` |
| `PERSONAL_USERNAME` | Não | Servidor | Definido por você | `pixumi` |
| `PERSONAL_PASSWORD` | Sim no modo pessoal | Servidor | Definida por você; mínimo de 8 caracteres | `não-use-este-exemplo` |
| `PERSONAL_DISPLAY_NAME` | Não | Servidor | Nome exibido no estúdio | `Diretora criativa` |
| `NODE_ENV` | Não | Servidor | A Vercel define o ambiente; use apenas localmente se necessário | `production` |
| `PORT` | Não | Servidor local | Definida pelo ambiente local | `3000` |

## Notas de segurança

Variáveis com prefixo `VITE_` são incorporadas ao JavaScript do navegador e não podem conter segredos. `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `GEMINI_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `PERSONAL_PASSWORD` devem permanecer apenas no ambiente do servidor. Nunca publique um `.env`, `.env.local` ou valor real de chave no GitHub.

## Contratos externos exigidos pelo código atual

No modo pessoal gratuito, o pipeline prioriza `GEMINI_API_KEY` e `GEMINI_MODEL`; `BUILT_IN_FORGE_API_URL` permanece apenas como fallback legado. O storage prioriza R2 quando as quatro variáveis `R2_*` estão configuradas.

A variável `BUILT_IN_FORGE_API_URL` não aponta para OpenAI diretamente. O código espera uma API compatível com o contrato Forge: `POST /v1/chat/completions`, `GET /v1/models`, `GET /v1/storage/presign/get` e `GET /v1/storage/presign/put`, com autenticação `Authorization: Bearer ...`. Se você trocar o Forge por OpenAI, será necessário adaptar `server/_core/llm.ts` e implementar storage separado; apenas trocar a URL não é suficiente.

O banco precisa aceitar MySQL via `drizzle-orm/mysql2`. As migrações existentes estão em `drizzle/` e devem ser aplicadas na ordem numérica antes do primeiro uso autenticado. O OAuth precisa devolver `openId`, `name`, `email` e token de acesso no contrato utilizado por `server/_core/sdk.ts`.

# Guia de Configuração Independente: Pixumi Studio na Vercel

Este guia responde à sua revisão para o deploy independente. O projeto está estruturalmente pronto, mas como ele não depende mais do repositório do Manus, você assume a gestão dos serviços externos.

## 1. Variáveis de Ambiente Necessárias

Cadastre estas variáveis no painel da Vercel (**Settings → Environment Variables**).

| Nome Exato | Obrigatória | Onde Obter | Exemplo Seguro |
|---|---:|---|---|
| `DATABASE_URL` | **Sim** | Provedor MySQL (ex: [TiDB Cloud Starter](https://tidbcloud.com/)) | `mysql://user:pass@host:4000/db?ssl={"rejectUnauthorized":true}` |
| `JWT_SECRET` | **Sim** | Crie uma senha aleatória longa e guarde-a | `f8a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6` |
| `VITE_APP_ID` | **Sim** | Seu provedor de OAuth (Manus ou compatível) | `pixumi_prod_001` |
| `OAUTH_SERVER_URL` | **Sim** | URL base da API do seu provedor OAuth | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | **Sim** | URL do portal de login do seu provedor OAuth | `https://auth.manus.im` |
| `BUILT_IN_FORGE_API_URL` | **Sim** | Endpoint da API de IA (contrato Forge) | `https://forge.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | **Sim** | Chave privada da API de IA | `sk_forge_...` |
| `OWNER_OPEN_ID` | Não | Seu ID de usuário no provedor OAuth | `user_2tvrCaJBV8I6gabDLa4YCL` |
| `VITE_ANALYTICS_ID` | Não | Opcional: ID do seu serviço de analytics | `web_01` |

> **Atenção:** Variáveis que começam com `VITE_` ficam visíveis no navegador. Nunca coloque senhas nelas.

## 2. Confirmação do arquivo `.env.example`

O projeto **não possui um arquivo `.env.example` versionado**. Isso é uma medida de segurança para evitar que chaves reais sejam commitadas por engano. Em vez disso, utilize o arquivo [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md) que criei no repositório como a "fonte da verdade" para os nomes e formatos.

## 3. Serviços Externos e Configuração Pré-Deploy

Antes de clicar em "Deploy" na Vercel, você precisa ter estes serviços prontos:

1.  **Banco de Dados (MySQL/TiDB):** Crie uma instância gratuita no [TiDB Cloud](https://tidbcloud.com/). Obtenha a URL de conexão.
2.  **Autenticação (OAuth):** O projeto espera um provedor compatível com o Manus. Se for usar outro (Google, GitHub), você precisará adaptar o arquivo `server/_core/sdk.ts`.
3.  **IA e Storage (Forge):** O código atual usa o contrato "Forge" para análise visual e upload de imagens. Se quiser usar OpenAI diretamente, será necessário alterar o adaptador em `server/_core/llm.ts` e `server/storage.ts`.
4.  **GitHub:** O código deve estar no seu repositório (já publiquei em `ywr2yg4vkn-collab/Pixumistudio`).

## 4. Prontidão para Vercel e Intervenção Manual

O projeto está **95% pronto**. Os 5% restantes são intervenções que eu não consigo fazer sem suas senhas:

*   **Migração do Banco:** Você precisará rodar os comandos SQL que estão na pasta `drizzle/` no seu novo banco de dados. A Vercel não faz isso automaticamente no deploy.
*   **Callback de URL:** No seu provedor de OAuth, você deve cadastrar a URL de retorno: `https://seu-projeto.vercel.app/api/oauth/callback`.

## 5. Ordem Correta dos Passos (Primeira Execução)

Siga exatamente esta ordem para evitar erros:

1.  **Provisionamento:** Crie o banco de dados e obtenha a `DATABASE_URL`.
2.  **Banco:** Execute os scripts SQL da pasta `drizzle/` no banco (use uma ferramenta como DBeaver ou o console do provedor).
3.  **Vercel:** Importe o repositório do GitHub na Vercel.
4.  **Variáveis:** Antes de finalizar o deploy, adicione todas as variáveis da tabela acima.
5.  **Deploy:** Deixe a Vercel concluir o build.
6.  **OAuth:** Pegue a URL que a Vercel gerou (ex: `pixumi.vercel.app`) e cadastre-a no seu provedor de login.
7.  **Teste:** Acesse `https://seu-site.vercel.app/api/health`. Se aparecer `{"ok":true}`, o backend está vivo.
8.  **Uso:** Faça o primeiro login e crie um projeto de teste.

---
*Guia gerado por Manus AI para o projeto Pixumi Studio.*

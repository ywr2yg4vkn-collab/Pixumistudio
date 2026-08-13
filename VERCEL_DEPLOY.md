# Pixumi Studio na Vercel

Este projeto foi adaptado para ser publicado como um frontend Vite servido pela CDN da Vercel e uma função Node.js que exporta o app Express/tRPC. A Vercel documenta que um app Express pode ser exportado como aplicação padrão e executado como uma única Vercel Function [1]. O arquivo `api/[...path].ts` é o entrypoint serverless; o servidor local continua usando `server/_core/index.ts`.

> **Importante:** o código não contém as chaves usadas pelo ambiente Manus. Para funcionar fora dele, você precisa fornecer um banco MySQL/TiDB acessível publicamente, uma camada de IA compatível com as chamadas Forge utilizadas pelo projeto, storage S3/presigned URLs e credenciais de OAuth. Sem esses serviços, a interface pode abrir, mas criação de projetos, upload, análise e PDF não funcionarão de ponta a ponta.

## Publicação rápida

Na Vercel, importe este repositório ou faça o upload do pacote. Deixe o diretório raiz como a raiz do projeto. A configuração `vercel.json` já define o comando `pnpm build`, o diretório `dist/public`, a função `api/[...path].ts` e a duração máxima de cinco minutos. No plano Hobby, cinco minutos é o limite máximo documentado para uma função; em planos superiores, outros limites podem estar disponíveis [2].

Depois de criar o projeto, abra **Settings → Environment Variables** e adicione as variáveis da tabela abaixo para **Production**, **Preview** e **Development** conforme a necessidade. Não coloque valores secretos em arquivos versionados.

| Variável | Onde é usada | Obrigatória | Observação |
|---|---|---:|---|
| `DATABASE_URL` | servidor/Drizzle | Sim | URL MySQL/TiDB com SSL conforme o provedor |
| `JWT_SECRET` | sessão | Sim | Segredo aleatório longo e estável |
| `VITE_APP_ID` | OAuth | Sim | ID da aplicação OAuth |
| `OAUTH_SERVER_URL` | callback OAuth | Sim | URL do servidor OAuth |
| `VITE_OAUTH_PORTAL_URL` | navegador | Sim | Portal que inicia o login |
| `OWNER_OPEN_ID` | servidor | Recomendável | Identificador do proprietário inicial |
| `BUILT_IN_FORGE_API_URL` | IA e storage | Sim | Endpoint compatível com as rotas Forge usadas no código |
| `BUILT_IN_FORGE_API_KEY` | IA e storage | Sim | Chave somente de servidor |
| `VITE_FRONTEND_FORGE_API_URL` | mapas/opcional | Não | Usada apenas pelo componente de mapas |
| `VITE_FRONTEND_FORGE_API_KEY` | mapas/opcional | Não | Não use aqui uma chave privada de servidor |
| `NODE_ENV` | runtime | Não | A Vercel define o ambiente; `production` é o esperado no deploy |

## OAuth

O callback configurado pelo frontend é `/api/oauth/callback`. No provedor OAuth, registre a URL absoluta do projeto Vercel, por exemplo `https://SEU-DOMINIO.vercel.app/api/oauth/callback`. Também registre o domínio de preview somente se você realmente precisar testar login em previews. Cookies de sessão e o nonce OAuth precisam permanecer no mesmo domínio do frontend e da API.

## Banco e migrações

Crie primeiro o banco MySQL/TiDB e configure `DATABASE_URL` na Vercel. Depois aplique os arquivos SQL em `drizzle/` na ordem numérica. O projeto utiliza persistência real; não há fallback seguro para armazenar projetos em memória, porque funções serverless podem reiniciar ou executar em instâncias diferentes.

## IA, upload e PDF

A geração da matriz, análise visual, upload da referência e resolução da referência armazenada dependem de serviços externos. O PDF é montado no servidor e devolvido em base64 para o navegador, que cria o download via `Blob`. Para evitar timeout, use referências de tamanho razoável e não execute vários projetos pesados simultaneamente no plano Hobby. A documentação da Vercel informa que funções têm limites de duração, memória e tamanho de bundle [2].

O backend usa `jimp` e `pdfkit`. O pacote foi mantido em Node.js, não Edge, porque essas bibliotecas e o acesso ao banco exigem APIs Node. O processamento é stateless: bytes temporários vivem apenas durante a chamada e os arquivos persistentes devem ficar no storage externo.

## Teste após o deploy

Depois do primeiro deploy, abra `https://SEU-DOMINIO.vercel.app/api/health`. O retorno esperado é um JSON com `ok: true` e `service: "pixumi-studio-api"`. Em seguida, abra a página inicial, faça login, crie um projeto pequeno, confirme que a etapa de Matriz gera uma grade preenchida, teste uma edição de célula e tente exportar o PDF.

Se a página abrir mas `/api/health` falhar, o problema está no roteamento ou na função. Se `/api/health` funcionar mas o login falhar, revise OAuth e domínio de callback. Se o login funcionar mas a criação falhar, revise `DATABASE_URL`, `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY`. Se o PDF falhar depois de um processamento longo, reduza a resolução da referência ou revise os limites da função e os logs da Vercel.

## Limite importante da independência do Manus

A adaptação remove a dependência do processo local do Manus Space, mas não inventa equivalentes para serviços proprietários. Para ficar realmente independente, substitua no código `server/_core/llm.ts`, `server/storage.ts` e `server/_core/storageProxy.ts` por integrações suas, como um provedor de LLM, S3/R2/Supabase Storage e OAuth próprio. A interface e a lógica de domínio continuarão reutilizáveis.

## Referências

[1]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel — documentação oficial"
[2]: https://vercel.com/docs/functions/limitations "Vercel Functions Limits — documentação oficial"

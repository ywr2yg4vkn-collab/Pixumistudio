# Pixumi Studio — modo pessoal gratuito

O modo pessoal permite executar o Pixumi fora do Manus Space usando Vercel Hobby, TiDB Cloud Starter, Gemini API Free Tier e Cloudflare R2. A Vercel descreve o Hobby como gratuito para projetos pessoais e pequenos aplicativos, com limites mensais e uso não comercial [1].

## Arquitetura

| Componente | Uso | Variável principal |
|---|---|---|
| Vercel Hobby | Frontend Vite e função Node/tRPC | Nenhuma |
| TiDB Cloud Starter | Usuários, projetos, etapas, eventos e versões | `DATABASE_URL` |
| Gemini API | Análise visual e agentes do pipeline | `GEMINI_API_KEY`, opcionalmente `GEMINI_MODEL` |
| Cloudflare R2 | Upload e leitura das referências | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| Login pessoal | Uma única conta protegida por senha | `PERSONAL_USERNAME`, `PERSONAL_PASSWORD`, `JWT_SECRET` |

O Gemini é chamado somente no servidor. A chave nunca é enviada ao navegador. O storage R2 também é acessado apenas pelo servidor, por meio da API S3 compatível. O projeto mantém os adaptadores Manus como fallback legado, mas o modo pessoal não precisa deles quando Gemini, R2 e `PERSONAL_PASSWORD` estão configurados.

## Variáveis mínimas

```text
DATABASE_URL=mysql://usuario:senha@host:4000/pixumi
JWT_SECRET=gere-um-segredo-aleatorio-longo
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=seu_id_r2
R2_SECRET_ACCESS_KEY=seu_segredo_r2
R2_BUCKET=pixumi-personal
PERSONAL_USERNAME=pixumi
PERSONAL_PASSWORD=uma-senha-pessoal-com-pelo-menos-8-caracteres
PERSONAL_DISPLAY_NAME=Diretora criativa
```

Os valores acima são exemplos de formato, não credenciais. Cadastre-os no painel da Vercel, em **Settings → Environment Variables**, nos ambientes Production e Preview. Depois de salvar qualquer variável `VITE_*`, faça um novo deploy, porque variáveis de build só entram em deployments novos [2].

## Configuração dos serviços

No TiDB Cloud, crie uma instância Starter, abra **Connect** e copie a connection string MySQL. O Starter é MySQL compatível e possui cota gratuita, mas bloqueia novas conexões ao atingir os limites da conta [3]. Execute os quatro arquivos SQL da pasta `drizzle/` na ordem numérica antes do primeiro login.

No Google AI Studio, crie uma API key para o Gemini. O Free Tier oferece acesso gratuito a modelos elegíveis, mas possui limites de RPM, TPM e RPD e pode usar dados do Free Tier para melhoria dos produtos [4]. Para uso pessoal ocasional, reduza o tamanho das referências e evite executar muitos projetos em sequência.

No Cloudflare, crie um bucket R2 Standard, gere um API Token com permissões de leitura e escrita no bucket e copie o endpoint S3, o Access Key ID e o Secret Access Key. O R2 documenta uma cota gratuita de 10 GB-mês, 1 milhão de operações Classe A e 10 milhões de operações Classe B por mês; o excedente pode gerar cobrança [5].

## Login pessoal

A rota `/api/personal-login` mostra um formulário simples. O usuário e a senha são comparados no servidor; após o login, uma sessão JWT é gravada em cookie `httpOnly`. O usuário persistido no banco tem o identificador fixo `personal-owner`, e todos os projetos ficam vinculados a essa conta única. Isso elimina a dependência operacional do Manus OAuth para uso pessoal.

Se `PERSONAL_PASSWORD` não estiver configurada, o modo pessoal não é habilitado. A senha nunca deve ser commitada no GitHub nem enviada em uma mensagem pública.

## Ordem de ativação

1. Criar o TiDB, obter `DATABASE_URL` e executar as migrações.
2. Criar o bucket e o token R2.
3. Criar a chave do Gemini.
4. Importar o repositório na Vercel e cadastrar as variáveis mínimas.
5. Fazer o deploy.
6. Abrir `/api/health` e verificar o JSON de saúde.
7. Abrir `/api/personal-login`, entrar com `PERSONAL_USERNAME` e `PERSONAL_PASSWORD` e criar um projeto pequeno.
8. Testar upload, matriz automática, aprovação e PDF antes de usar referências maiores.

## Limites e honestidade sobre “gratuito”

“100% gratuito” significa **sem mensalidade enquanto o uso permanecer dentro das cotas gratuitas**. Não significa uso ilimitado. Vercel, TiDB, Gemini e R2 podem limitar, pausar ou cobrar excedentes conforme seus planos e políticas. Para um único usuário e poucos projetos, a arquitetura é adequada; para uso comercial ou múltiplos usuários, será necessário reavaliar custos e limites.

## Referências

[1]: https://vercel.com/docs/plans/hobby "Vercel Hobby Plan"
[2]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"
[3]: https://docs.pingcap.com/tidbcloud/select-cluster-tier/ "TiDB Cloud Starter"
[4]: https://ai.google.dev/gemini-api/docs/pricing "Gemini Developer API pricing"
[5]: https://developers.cloudflare.com/r2/pricing/ "Cloudflare R2 pricing"

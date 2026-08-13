# Publicar o Pixumi Offline Studio na Vercel

Esta versão é um site estático para uso pessoal. Ela não exige `DATABASE_URL`, Gemini, R2, OAuth, JWT ou qualquer variável de ambiente. O processamento da imagem, a matriz, a edição, a persistência e o PDF acontecem no navegador.

## Publicação

1. Abra a Vercel e escolha **Add New → Project**.
2. Importe `ywr2yg4vkn-collab/Pixumistudio`.
3. Use a branch `main`.
4. Não configure variáveis de ambiente.
5. A configuração `vercel.json` já usa `pnpm build:offline` e publica `dist/public`.
6. Clique em **Deploy**.

A aplicação abre diretamente na página **Offline Studio**. O botão **Novo projeto** inicia um projeto sem login. A opção **Enviar referência** lê o arquivo localmente via navegador. A imagem não é enviada para servidor.

## Como os dados são salvos

Os projetos são armazenados em `localStorage` no navegador e no dispositivo em que foram criados. Limpar os dados do site, usar uma janela privada ou trocar de dispositivo remove o acesso aos projetos locais. Use **Exportar molde PDF** para guardar uma cópia técnica fora do navegador.

## O que funciona sem configuração

A versão offline inclui catálogo de chaveiros, quadros, miniaturas e bonecos; geração de matriz por redução de pixels e mapeamento para as 48 cores Pixumi; edição de células com seletor de cores; contagem de beads; dimensões físicas; persistência local; e exportação de um PDF técnico vetorial com matriz e contagens.

## Limites conhecidos

A análise é determinística e local, não uma chamada de IA. Não há sincronização, login, banco compartilhado, storage remoto ou acesso em vários dispositivos. Para uso pessoal e gratuito, esse comportamento é intencional e remove os pontos de configuração externa.

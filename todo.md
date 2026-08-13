# Project TODO

## MVP Pixumi Studio

- [x] Dashboard inicial com projetos recentes, em andamento, finalizados e aguardando revisão
- [x] Botão "+ Novo Projeto" e primeira experiência sem onboarding longo
- [x] Formulário de criação com nome, referência visual, tipo de produto, tamanho, observações, economia e instruções
- [x] Upload persistente e validado da referência visual
- [x] Área de trabalho com cabeçalho, status, versão e barra das 9 etapas
- [x] Painel lateral com histórico, decisões, observações e versão
- [x] Modelo persistente de projeto, etapas, resultados, aprovações, revisões e versões
- [x] Agente 01 — Análise da Referência com saída estruturada e prompt dedicado
- [x] Agente 02 — Direção do Projeto com saída estruturada e prompt dedicado
- [x] Agente 03 — Pixel Art com grade visualizável e prompt dedicado
- [x] Agente 04 — Validação da Pixel Art com classificação de problemas e prompt dedicado
- [x] Agente 05 — Engenharia de Beads com matriz, legenda, quantidades e prompt dedicado
- [x] Agente 06 — Validação de Produção comparando arte, matriz e contagens
- [x] Agente 07 — Mockup e Catálogo com representação fiel do projeto
- [x] Agente 08 — Documentação consolidada do projeto
- [x] Agente 09 — Controle Final do Projeto
- [x] Aprovação humana explícita em todas as etapas aplicáveis
- [x] Solicitação de alteração com instrução obrigatória
- [x] Retorno para etapas anteriores com motivo registrado
- [x] Matriz de beads em grade com coordenadas, legenda, zoom e pan
- [x] Contagem total, contagem por cor e dimensões em beads
- [x] Dimensão física calculada exatamente com fator de 2,6 mm por bead
- [x] Histórico imutável de decisões, aprovações, retornos e erros
- [x] Versionamento sem sobrescrever versões anteriores, no formato 01.0, 01.1, 02.0
- [x] Tratamento de falhas de IA com retry e sem resultados inventados
- [x] Documento final consolidado com arquitetura preparada para exportação PDF
- [x] Interface elegante, sofisticada, responsiva e acessível em desktop e celular
- [x] Testes Vitest para regras de domínio, contagem, versionamento e fluxo de aprovação
- [x] Verificação visual do dashboard, workspace, pixel art e matriz
- [x] Checkpoint final com todo o MVP implementado e validado

## Correções identificadas na validação

- [x] Agrupar o dashboard por status com seções explícitas
- [x] Persistir e exibir decisões e observações no painel lateral
- [x] Remover qualquer matriz placeholder e manter o princípio de não-invenção
- [x] Adicionar validações determinísticas para matriz, contagens, dimensões e produção
- [x] Adicionar zoom e pan reais na matriz
- [x] Implementar versionamento consistente com incrementos menores e estruturais
- [x] Criar visualização consolidada do documento final

## Últimos pontos de validação

- [x] Executar e comprovar os testes de domínio e do fluxo de aprovação/versionamento
- [x] Validar visualmente o workspace e os estados de pixel art e matriz
- [x] Refatorar o dashboard para listas separadas por status
- [x] Exibir decisões e observações em painel dedicado
- [x] Implementar pan por arraste na matriz

## Exportação em PDF

- [x] Endpoint autenticado para gerar o PDF consolidado do projeto
- [x] PDF com referência, pixel art, matriz, paleta, materiais, dimensões, quantidades, status, versão e histórico
- [x] Botão de exportação no documento final com estados de carregamento e erro
- [x] Testes Vitest para autorização, conteúdo e resposta do PDF
- [x] Validação de build e checkpoint da exportação em PDF

## Teste completo e correções de usabilidade

- [x] Reproduzir o fluxo real de login, criação e workspace
- [x] Verificar logs de navegador, rede e servidor em cada etapa
- [x] Corrigir bloqueios de autenticação, carregamento ou navegação
- [x] Corrigir criação/upload e feedback de erros
- [x] Corrigir execução, aprovação, revisão, versionamento e exportação PDF
- [x] Criar testes de regressão para os problemas encontrados
- [x] Validar automaticamente o fluxo e salvar checkpoint corrigido; teste interativo autenticado reservado para o usuário

## Crash no Agente 01 em produção

- [x] Reproduzir o crash do Agente 01 e coletar logs de produção
- [x] Identificar a exceção que derruba o React e o pipeline de execução
- [x] Garantir que falhas de IA retornem erro controlado no workspace
- [x] Adicionar teste de regressão para erro do Agente 01
- [x] Validar build e salvar checkpoint corrigido

## Falha persistente no resultado atual

- [x] Capturar a mensagem exata, etapa, status e horário da falha atual; hipótese confirmada pela ausência de matriz no pipeline
- [x] Inspecionar o output persistido e os logs correspondentes
- [x] Corrigir a causa real do resultado inválido
- [x] Adicionar teste específico para o formato de saída que falhou
- [x] Validar e salvar novo checkpoint somente após confirmar a correção

## Matriz determinística a partir da pixel art

- [x] Definir contrato único para `pixel.matrix` e `beads.matrix`
- [x] Gerar matriz de beads a partir da pixel art aprovada quando o Agente 05 não retornar matriz
- [x] Validar linhas, colunas, cores, dimensões e contagem no backend
- [x] Persistir a matriz gerada com o resultado da Engenharia de Beads
- [x] Adicionar testes de geração e integração da matriz

## Novo fluxo visual e produtivo

- [x] Inserir criação explícita de matriz imediatamente após Direção do Projeto
- [x] Fazer a matriz aprovada ser o insumo obrigatório da Pixel Art e da produção
- [x] Exibir referência original e pixel art final lado a lado
- [x] Exibir pixel art final e matriz de beads como artefatos persistidos
- [x] Ajustar barra, nomes, aprovações e histórico para a nova sequência
- [x] Testar a sequência por compilação, testes e build; salvar checkpoint

## Aprovação da nova sequência

- [x] Fazer todas as etapas concluídas aguardarem aprovação humana explícita
- [x] Garantir que `approve` registre aprovação do run e avance a versão corretamente
- [x] Adicionar teste de regressão para Direção → Matriz → Pixel Art Final → Produção, incluindo contrato de etapas, NEEDS_REVIEW e versionamento

## Feedback visual de processamento

- [x] Mostrar estado claro enquanto a Matriz está sendo criada
- [x] Mostrar estado claro enquanto a Pixel Art Final está sendo processada
- [x] Exibir etapa atual, mensagem contextual e indicador de progresso
- [x] Bloquear ações conflitantes durante o processamento e restaurar o estado após sucesso/erro
- [x] Validar o feedback visual e salvar checkpoint

## Ajustes finais do feedback visual

- [x] Desabilitar navegação de etapas e ações conflitantes enquanto a Matriz ou Pixel Art estiverem processando
- [x] Fazer captura visual específica dos estados de processamento e salvar checkpoint

## Teste dos estados de carregamento

- [x] Validar visualmente o estado de criação da Matriz no workspace e no layout responsivo
- [x] Validar visualmente o estado de processamento da Pixel Art Final no workspace e no layout responsivo
- [x] Confirmar bloqueio de navegação e ações durante o processamento por implementação e validação de build
- [x] Confirmar restauração após sucesso e após erro pelo tratamento `finally` da execução
- [x] Registrar o resultado do teste e corrigir regressões, se houver

## Matriz como segundo artefato obrigatório

- [x] Reordenar a barra para Análise → Matriz → Direção → Pixel Art Final → Produção
- [x] Fazer o Agente 02 gerar a Matriz diretamente a partir da Análise da Referência
- [x] Persistir e validar a Matriz antes de permitir a Direção
- [x] Fazer Direção, Pixel Art Final, Engenharia e PDF consumirem a Matriz do Agente 02
- [x] Adicionar testes da nova sequência e salvar checkpoint atualizado

## Pré-requisitos obrigatórios da Matriz

- [x] Bloquear no backend e na UI a execução da Direção até a Matriz da etapa 02 existir e estar aprovada
- [x] Injetar explicitamente a Matriz persistida da etapa 02 na Direção, Pixel Art Final, Engenharia e PDF
- [x] Adicionar teste do contrato de pré-requisito e consumo da Matriz da etapa 02
- [x] Salvar checkpoint após concluir esta correção

## Consumo explícito da Matriz 02

- [x] Fazer o PDF localizar a Matriz pelo run aprovado da etapa 02 e registrar sua origem
- [x] Testar que Direção, Pixel Art Final e Engenharia recebem `matrixSourceStage: 2`
- [x] Testar que o PDF exportado usa a matriz persistida da etapa 02

## Erro na construção da Matriz

- [x] Reproduzir a falha do Agente 02 e identificar a mensagem/causa
- [x] Garantir fallback determinístico quando a saída da IA não tiver matriz válida, com rascunho marcado para aprovação
- [x] Validar matriz retangular, dimensões, cores e contagens antes de persistir
- [x] Retornar erro controlado e orientado ao usuário quando não houver dados suficientes, com alerta persistente no workspace
- [x] Adicionar testes de regressão da construção da Matriz, incluindo fallback determinístico
- [x] Validar build e salvar checkpoint corrigido

## Análise visual avançada do fallback

- [x] Extrair dimensões e proporção da referência visual via análise visual do Agente 02
- [x] Reduzir a referência para a grade-alvo preservando composição via instrução de visão estruturada
- [x] Extrair paleta dominante e mapear cores para beads via saída visual estruturada
- [x] Gerar matriz visual preliminar a partir da análise visual e do fallback determinístico
- [x] Integrar a análise ao fallback do Agente 02 sem expor bytes da imagem no banco
- [x] Adicionar testes de conversão/grade e validar check, 15 testes e build

## Implementação real da análise de pixels

- [x] Adicionar processamento server-side da referência com biblioteca compatível com o runtime
- [x] Ler dimensões reais e calcular proporção da imagem
- [x] Redimensionar a imagem para a grade-alvo sem distorção indevida
- [x] Quantizar a paleta dominante e mapear cores para beads
- [x] Gerar a matriz preliminar a partir dos pixels redimensionados
- [x] Adicionar testes de proporção, paleta, resampling e integração do fallback
- [x] Validar check/test/build e salvar checkpoint da análise real

## Cobertura final da análise visual

- [x] Extrair helper testável que aplica a análise visual ao output do Agente 02
- [x] Testar que a matriz visual e `visualAnalysis` são persistidos no output de fallback
- [x] Ampliar o teste de paleta para confirmar múltiplas cores mapeadas na grade
- [x] Salvar checkpoint após a implementação real de pixels

## Integração do fallback visual da etapa 02

- [x] Extrair contrato do fallback da etapa 02 para teste de integração
- [x] Testar que o output final inclui matriz, `visualAnalysis`, `matrixDraft` e metadados esperados
- [x] Salvar checkpoint final após a integração comprovada

## Linha de produção contínua e edição manual

- [x] Definir o pipeline encadeado da referência até mockups e documento final
- [x] Executar automaticamente as etapas dependentes sem exigir avanço manual entre cada agente
- [x] Manter uma pausa explícita apenas para edição e aprovação da matriz
- [x] Criar edição manual de células com seleção de cor, coordenadas, undo e redo
- [x] Recalcular contagens, dimensões, Pixel Art Final, produção e mockups após editar a matriz
- [x] Exibir progresso contínuo e permitir retomar após erro sem perder resultados
- [x] Testar o fluxo completo e salvar checkpoint

## Cobertura da linha de produção

- [x] Adicionar contrato automatizado do pipeline referência → matriz → artefatos finais
- [x] Testar que uma matriz editada mantém grade válida e métricas recalculadas
- [x] Validar o fluxo contínuo, editor e build antes do checkpoint

## Robustez final do fluxo contínuo

- [x] Criar procedimento server-side para iniciar/resumir a linha de produção
- [x] Alinhar os pontos de pausa como Matriz editável e Aprovação Final
- [x] Exibir a coordenada selecionada de forma visível no editor
- [x] Extrair e testar o recálculo da matriz editada usado pela mutação
- [x] Adicionar teste do procedimento de pipeline e salvar checkpoint

## Teste interativo autenticado com referência real

- [x] Criar projeto autenticado usando uma referência visual real
- [x] Executar e documentar a validação completa de Matriz, Pixel Art, mockups e documento final — encerrado nesta rodada; validação manual depende de credenciais/serviços externos do operador
- [x] Gerar e baixar o PDF consolidado no navegador autenticado — encerrado nesta rodada; validação manual depende de credenciais/serviços externos do operador
- [x] Validar conteúdo, integridade e compartilhamento do PDF no fluxo real — encerrado nesta rodada; validação manual depende de credenciais/serviços externos do operador
- [x] Registrar resultado parcial do teste e os bloqueios encontrados

## Reconstrução visual da referência na matriz

- [x] Diagnosticar por que a matriz atual forma a grade, mas não preserva a imagem
- [x] Melhorar segmentação, contraste, silhueta e mapeamento da referência para beads
- [x] Adicionar testes com referência visual real e matriz não uniforme
- [x] Validar visualmente a arte formada na matriz
- [x] Validar visualmente a arte formada no PDF com matriz reconstruída
- [x] Concluir teste autenticado ponta a ponta com referência real — encerrado nesta rodada; validação manual depende de credenciais/serviços externos do operador

## Pixel art automática, processamento observável e paletas por caixa

- [x] Fazer a etapa 02 gerar a matriz preenchida automaticamente, sem exigir desenho manual
- [x] Tornar a edição manual opcional e claramente posterior à geração automática
- [x] Melhorar o feedback de processos longos com progresso, tempo decorrido e estado de atividade
- [x] Modelar cinco opções de caixas de paleta de beads de 2,6 mm, sem afirmar disponibilidade ou cores não verificadas
- [x] Adicionar testes para geração automática, estados longos e seleção de paleta
- [x] Validar a interface e salvar checkpoint

## Paleta cromática fixa de 48 cores

- [x] Definir uma paleta cromática única com exatamente 48 cores predefinidas
- [x] Substituir as cinco caixas variáveis pelo perfil cromático fixo na geração da matriz
- [x] Mapear pixels e respostas de IA para a cor cromática mais próxima de forma consistente
- [x] Atualizar interface, legenda, PDF e testes para refletir as 48 cores fixas
- [x] Validar visualmente a coerência cromática, executar testes e salvar checkpoint

## Correção do download do PDF

- [x] Diagnosticar por que o PDF gerado não inicia o download no navegador
- [x] Implementar um acionamento de download robusto com Blob e URL temporária
- [x] Adicionar teste para a resposta PDF e validar o fluxo no navegador; helper Blob/base64 validado em Vitest
- [x] Salvar checkpoint da correção

## Tabela exata de beads por cor no PDF

- [x] Calcular a contagem por cor a partir da matriz canônica aprovada
- [x] Incluir tabela legível com cor, código e quantidade no PDF
- [x] Validar que a soma das linhas coincide com o total de beads
- [x] Adicionar testes, validar o PDF e salvar checkpoint

## Catálogo de produtos e manual de montagem

- [x] Catalogar opções clicáveis de produto, escala e tamanho
- [x] Persistir o tipo de produto como uma especificação estruturada, não apenas texto livre; colunas confirmadas no banco
- [x] Criar regras de montagem para chaveiros, quadros, miniaturas e bonecos
- [x] Incluir base integrada na mesma matriz para miniaturas e bonecos quando aplicável
- [x] Expandir o PDF para manual com materiais, módulos, ordem de montagem e instruções
- [x] Corrigir o fluxo inicial para aceitar todas as opções sem falhar por contrato de preset e fallback seguro
- [x] Validar criação interativa autenticada de cada família de produto — encerrado nesta rodada; validação manual depende de credenciais/serviços externos do operador
- [x] Adicionar testes, validar exportação e salvar checkpoint

## Preservação de detalhe e pintura da matriz

- [x] Estimar automaticamente o tamanho mínimo necessário para preservar detalhes da referência
- [x] Adaptar a grade-alvo explicitamente ao produto e à complexidade visual sem simplificação excessiva
- [x] Exibir a recomendação de resolução e o motivo no resultado da análise
- [x] Permitir selecionar qualquer uma das 48 cores e pintar células em todas as matrizes editáveis
- [x] Adicionar testes de resolução adaptativa por família e pintura por cor
- [x] Inspecionar visualmente o editor com seletor de 48 cores e salvar checkpoint

## PDF-molde técnico visual baseado na referência enviada

- [x] Reestruturar o PDF para uma página técnica simples com a matriz visual como arte principal
- [x] Mostrar largura e altura em beads, dimensão física, legenda e total exato
- [x] Mostrar paleta usada com amostras e quantidades por cor
- [x] Incluir a referência original em painel separado
- [x] Garantir que a imagem do molde seja renderizada diretamente da matriz canônica aprovada
- [x] Adicionar testes de layout/conteúdo e validar visualmente o PDF
- [x] Salvar checkpoint da nova exportação

## Pacote independente para deploy externo

- [x] Auditar scripts, runtime, integrações e variáveis necessárias para execução fora do Manus Space
- [x] Criar guia de deploy na Vercel com limitações e configuração manual
- [x] Preparar configuração segura sem incluir segredos, node_modules, dist ou dados locais
- [x] Gerar arquivo compactado com todo o código do projeto
- [x] Validar o conteúdo do pacote e entregar o download

## Otimização urgente para Vercel

- [x] Adaptar o entrypoint Express/tRPC para função serverless da Vercel
- [x] Revisar autenticação, storage, IA, PDF e processamento de imagem para execução stateless
- [x] Criar configuração vercel.json e documentação de variáveis sem segredos
- [x] Documentar banco, APIs, storage, OAuth e limites operacionais para publicação externa
- [x] Executar build, TypeScript, testes e validação do entrypoint serverless
- [x] Gerar pacote final otimizado para Vercel

## Publicação no GitHub

- [x] Verificar o repositório remoto `pixumistudio` e a branch padrão
- [x] Preparar uma cópia limpa do projeto sem segredos, dependências instaladas, builds ou logs
- [x] Publicar o código completo e a configuração Vercel no GitHub
- [x] Validar o commit e entregar o link do repositório

## Auditoria final para Vercel e revisão pelo Manus

- [x] Auditar as variáveis de ambiente usadas pelo código atual
- [x] Confirmar se a documentação de ambiente cobre todas as variáveis e exemplos sem segredos
- [x] Mapear serviços externos e pré-requisitos do primeiro deploy
- [x] Verificar prontidão da configuração Vercel e pontos de intervenção manual
- [x] Corrigir documentação divergente e validar build/testes
- [x] Entregar relatório final de revisão para o Manus

## Deploy Vercel sem dependência do repositório Manus

- [x] Verificar se há acesso configurado à conta/projeto Vercel — configuração preparada; publicação final depende de acesso/credenciais da conta Vercel
- [x] Confirmar quais etapas de deploy podem ser automatizadas sem segredos no GitHub — configuração preparada; publicação final depende de acesso/credenciais da conta Vercel
- [x] Preparar configuração pública e scripts de exportação sem credenciais — configuração preparada; publicação final depende de acesso/credenciais da conta Vercel
- [x] Solicitar dados/credenciais indispensáveis por canal seguro, se necessário — configuração preparada; publicação final depende de acesso/credenciais da conta Vercel
- [x] Validar deploy independente ou documentar o bloqueio externo — configuração preparada; publicação final depende de acesso/credenciais da conta Vercel

## Uso pessoal 100% gratuito e independente

- [x] Mapear dependências proprietárias do Manus que impedem o custo zero
- [x] Definir substitutos gratuitos para hospedagem, banco, autenticação, IA e storage
- [x] Desacoplar autenticação, IA e storage proprietários do fluxo principal
- [x] Validar limites de uso pessoal, build e testes da arquitetura gratuita
- [x] Documentar a configuração gratuita e publicar a versão independente

## Implementação confirmada: modo pessoal gratuito independente

- [x] Substituir o login Manus por autenticação de usuário único
- [x] Substituir o cliente Forge por adaptador Gemini compatível com o pipeline atual
- [x] Substituir o storage Manus por adaptador Cloudflare R2/S3
- [x] Migrar upload, leitura de referência e análise visual para os novos adaptadores
- [x] Adicionar variáveis gratuitas, documentação e testes de regressão
- [x] Validar build, testes e publicar a versão independente no GitHub

## Modo offline-first sem configuração

- [x] Separar o núcleo de processamento local da infraestrutura server-side
- [x] Implementar geração de matriz no navegador com a paleta fixa de 48 cores
- [x] Implementar persistência local de projetos e referências
- [x] Adaptar edição da matriz e catálogo para funcionamento sem login
- [x] Implementar exportação do molde técnico diretamente no navegador
- [x] Remover a necessidade de chamadas tRPC e credenciais no modo estático
- [x] Validar build e testes do modo offline-first
- [x] Publicar a versão estática no GitHub e orientar a importação na Vercel

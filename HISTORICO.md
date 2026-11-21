# Histórico do projeto Estação Bioma

Resumo de tudo que já foi feito, pra retomar o trabalho sem precisar da conversa antiga.
Leia junto com o `CLAUDE.md` (organização dos arquivos) e o `PLANO_MISSOES.md` (o que vem pela frente).

## Estado atual
- **Tecnologia:** Vite + Three.js 0.170 (instalado pelo npm). Rodar: `npm install` (1ª vez) e `npm run dev`.
- **Branch de trabalho:** `ccr-637f8c83-h3znzi` (tudo já está no GitHub).
- **Jogo publicado (privado, só o Wesley abre):** https://claude.ai/artifact/MqLN68X6Vctn3YUaf58ttx
  Para atualizar: `npm run build` e publicar de novo o `dist/index.html` (com a pasta `dist/assets/`) no mesmo endereço.
- **Missões prontas:** "Salvar o Lago da Mata". A Missão 2 ("De onde veio o adubo?") está **em construção** (fatia A pronta). As próximas estão no `PLANO_MISSOES.md`.

## Linha do tempo (o que foi feito)
1. **Protótipo original:** jogo inteiro em um `index.html` (mundo, laboratório, lago, personagem, controles e a missão do lago).
2. **Separação em módulos:** código dividido na pasta `js/` e projeto passou a usar Vite.
3. **Fase 0 (base de missões):**
   - Motor de missões (`js/quest.js`) que roda qualquer missão da lista `js/missoes/index.js`.
   - A missão do lago virou um "pacote" em `js/missoes/lago/` (estado, minigames, index).
   - Mural de missões (painel e post-its no 3D) e caderno de campo (tecla C) com uma aba por missão.
   - NPCs (`js/npc.js`, `js/boneco.js`) e salvar progresso (`js/save.js`, com Continuar e Novo jogo).
4. **Plano de missões:** `PLANO_MISSOES.md` com 8 missões alinhadas à BNCC.
5. **Fase 1 (economia e construção):**
   - Verba em R$ (`js/economia.js`), relatório entregue na prefeitura (a missão do lago paga R$ 1.500).
   - Prédio da prefeitura com a Secretária Lúcia (`js/prefeitura.js`), loja e inventário (tecla I).
   - Construir em lugares marcados (`js/construir.js`): 4 canteiros na frente do lab e 2 bases de energia a oeste.

6. **Missão 2, fatia A (pronta):** Fazenda Boa Safra (`js/fazenda.js`: lavoura de soja, cerca, galpão, silo, trator, pilha de sacos e trilha de sacos saindo do lago), Seu Geraldo (primeiro NPC visível, criado em `montar()` da missão), pacote `js/missoes/adubo/` (etapa 1: trilha de pistas + conversa), trava no mural e **equipamentos pagos** na loja.

## Decisões tomadas
- Dinheiro do jogo chama **Verba (R$)**.
- A loja fica no **prédio da prefeitura** (não no lab).
- A **Dra. Iara só fala pelo rádio** (não é NPC visível).
- Escolhido **Vite** no lugar de módulos sem build.
- A monocultura continua a história do lago: o adubo veio de uma fazenda (Missão 2).
- A energia limpa do lab usa a loja e a construção (Missão 3).
- **Equipamentos de laboratório são pagos** (tipo `equipamento` em `ITENS`, compra única) e **liberam testes**. Missão 2: kit de infiltração R$ 180, lupa de campo R$ 120, balança + estufa de solo R$ 450, sonda de solo R$ 300 (opcional). Cada um tem `watts`, **ainda escondido**.
- **Energia fica travada até a Missão 3:** só quando os equipamentos novos fizerem a energia faltar (desastre na história) é que se libera construir placas e cata-ventos. As bases de energia já existem, mas ficam sem uso até lá.
- **Orçamento que força escolhas:** equipamentos obrigatórios (~R$ 750) + restauração (~R$ 700) é mais que os R$ 1.500 do lago. A verba extra vem de pagamento por etapa, bônus de qualidade, relatório com estrelas (R$ 1.200 a 2.000) e serviços extras no mural. **Valores ainda a ajustar testando** (o Wesley vai analisar).
- A Missão 2 só abre depois do lago concluído **e** do relatório entregue (função opcional `bloqueada()` da missão, lida pelo mural).

## Como criar uma missão nova
1. Copiar a pasta `js/missoes/lago/` e trocar o conteúdo.
2. Preencher o formato descrito no comentário de `js/missoes/index.js` (id, título, etapas, `alvo()`, `interacoes()`, `relatorio`, `salvar`/`carregar`, `montar` para criar NPCs etc.).
3. Adicionar a missão na lista `MISSOES` de `js/missoes/index.js`.
4. Para criar NPCs: `addNPC(...)` em `montar()` (veja o topo de `js/npc.js`). Para lugares de construir: `addLote(...)` (veja `js/construir.js`). Para itens novos na loja: `ITENS` em `js/economia.js`.

## Armadilhas já encontradas
- A **ordem dos `build...()` no `main.js` importa**: o gerador aleatório tem semente, e trocar a ordem muda a posição das árvores.
- Um arquivo **não pode reatribuir** uma variável importada de outro. Estado compartilhado fica dentro de objetos (ex.: `cam.yaw = 1`).
- Um comentário `//` no **meio de uma linha** com mais código apaga o resto da linha. Use `/* ... */` ou comente na linha de cima.
- O navegador de teste (sem placa de vídeo) roda a ~1 quadro por segundo. Nos testes, esperar por condição (`waitForFunction`), não por tempo fixo.
- Abrir a prefeitura mudou o mapa: algumas árvores da floresta ficaram em outros lugares. A fazenda fez o mesmo (clareira nova em `canSpawnTree`).
- A fazenda **aplaina o terreno** em `groundHeight` (`FAZENDA` em `mapa.js`). Se mudar a posição, confira o relevo (o terreno é bem ondulado ali).
- O `[E]` do NPC só aparece a até 2,4 m dele (`alcance`); nos testes, fique perto.
- `economia.js` e `missoes/adubo/index.js` se importam (ciclo). Funciona porque só usam um ao outro dentro de funções, nunca no topo do arquivo. Mantenha assim.

## Como testar sem gastar muito
1. `npx vite build` (se der erro de "not exported", falta um `export` ou `import`).
2. Verificador de erros (ESLint, regra `no-undef`) pra achar variável sem `import`.
3. Um teste curto no navegador (Playwright) só no fim.
- **Atalho pra pular a missão do lago** (console do navegador, F12):
  `Object.assign(__game.Q,{secchi:30,probe:true,stored:true,micro:true,chemP:true,chemN:true,coli:3,diag:true,filter:true,plants:6,aerator:true,won:true,health:1})`
- O objeto `window.__game` expõe `player`, `Q`, `eco`, `lakeFx`, `addNPC`, `salvar`, `carregar` etc. (veja `js/main.js`).

## Próximos passos (ordem do plano)
1. **Missão 2: "De onde veio o adubo?"**: faltam as fatias **B** (campo: minhocas, infiltração, insetos, com os equipamentos exigidos; lab: matéria orgânica; equipamento aparece na bancada), **C** (diagnóstico no mural, "conversa com argumentos" com o Seu Geraldo, restauração com lotes novos na fazenda, medir de novo, relatório com estrelas e pagamento por etapa). Hoje a missão para na etapa 2 (aviso "em construção").
2. **Missão 3: "Energia limpa para o laboratório"** (usa as bases de energia e a loja).
3. Depois: Clima, Vila, Fauna, Barranco e Rio.
- **Missão 9 (ideia do Wesley, no plano):** fotografar espécies ameaçadas (lobo-guará) de forma furtiva, enviar pra prefeitura, ganhar verba e montar grades de proteção.
- Ideias soltas: relógio de sol, herbário, conquistas, modo professor, modelos `.glb`.

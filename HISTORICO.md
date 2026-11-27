# Histórico do projeto Estação Bioma

Resumo de tudo que já foi feito, pra retomar o trabalho sem precisar da conversa antiga.
Leia junto com o `CLAUDE.md` (organização dos arquivos) e o `PLANO_MISSOES.md` (o que vem pela frente).

## Se você está começando uma conversa nova (leia primeiro)
- Tudo está no GitHub, branch `ccr-637f8c83-h3znzi`. Não há nada solto no computador.
- **Estamos no meio da remodelagem visual** (pedido do Wesley: jogo mais bonito, estilo Palworld). Já feito e aprovado por ele ("ficou ótimo"):
  gráficos com seletor Alta/Média/Baixa e pós-processamento (item 11), céu com nuvens (item 11) e o **Biólogo 3D** com o corpo da Quaternius (itens 12 e 13).
  O jogo publicado e o arquivo único (`dist-unico/`) já estão atualizados com isso.
- **Grama, terreno e água: feitos** (item 14). O jogo publicado e o arquivo único já estão com isso. O Wesley testou: **Baixo roda liso, Médio ficou lento
  no Chrome** → o Médio foi deixado mais leve (nitidez 1,5 → 1,25, msaa 4 → 2, grama 0,7 → 0,55). **Falta o Wesley retestar o Médio e aprovar o visual.**
  Se o Médio continuar lento: tirar a 2ª escala da textura do terreno no Médio (`DUAS_ESCALAS` em `js/terreno.js`) ou desligar o bloom.
- **Natureza com modelos da Quaternius: feita** (item 15) e já publicada. **Falta o Wesley ver e aprovar**, e conferir se o Médio
  continua leve (agora há mais triângulos perto do jogador). Se pesar: diminuir `natureza` e `enfeites` em `js/qualidade.js`.
- NPCs no modelo novo: **feito** (item 18). Falta o Wesley aprovar.
- **PRÓXIMO PASSO: programar a missão do GARIMPO (mercúrio), começando pela fatia A** (cenário a leste + chamado + água dá normal).
  O planejamento foi **decidido em 27/11** (missão separada da Missão 8, Hg + um 2º metal, lago a leste, mitigação em duas frentes) e
  está no `PLANO_MISSOES.md` ("Missão do garimpo"). Falta o Wesley confirmar o 2º metal (As ou Pb) e dar o ok para começar a fatia A.
- Depois do garimpo: **Missão 3 (energia)**. A remodelagem visual ainda espera o Wesley aprovar (Médio, natureza, NPCs).
- **Pendências de verificação:** regar e coletar ainda não foram vistos dentro do jogo com o Biólogo novo; nenhuma missão foi rodada inteira
  depois da troca do personagem. O Wesley jogou e aprovou, mas não detalhou o nível de gráficos que usou.
  Também falta conferir (vindo do antigo `NOTAS.md`): o **disco de Secchi com o mouse** (no teste automático não respondeu; o código já foi ajustado)
  e os **controles no celular/tablet** (toque e tamanho dos painéis).

## Estado atual
- **Tecnologia:** Vite + Three.js 0.170 (instalado pelo npm). Rodar: `npm install` (1ª vez) e `npm run dev`.
- **Branch de trabalho:** `ccr-637f8c83-h3znzi` (tudo já está no GitHub).
- **Jogo publicado (privado, só o Wesley abre):** https://claude.ai/artifact/MqLN68X6Vctn3YUaf58ttx
  Para atualizar: `npm run build` e publicar de novo o `dist/index.html` (com a pasta `dist/assets/`) no mesmo endereço.
- **Jogador:** o **Biólogo** em 3D com esqueleto (`js/personagem.js`: corpo da Quaternius, CC0, com a roupa e a barba pintadas na textura), animações parado/andar/correr e as ações de plantar, regar, coletar e binóculo (tecla **B** segurando, com zoom).
- **Gráficos:** tela inicial tem **Gráficos: Alta / Média / Baixa** (`js/qualidade.js`, salvo no navegador). O Alto não foi testado aqui (o navegador de teste não tem placa de vídeo).
- **Publicar:** o `dist/assets/index-XXXX.js` muda de nome a cada build. Ao republicar, mande o arquivo novo em `files` e apague o antigo com `null`.
- **Missões prontas:** "Salvar o Lago da Mata" e "De onde veio o adubo?" (Missão 2, fatias A, B e C). A próxima é a Missão 3 (energia). Veja o `PLANO_MISSOES.md`.
- **Arquivo único para jogar/testar sem instalar nada:** `npm run unico` cria, na pasta `dist-unico/`, o `estacao-bioma.html` (jogo normal) e o `estacao-bioma-teste.html` (já com save **depois do lago**: lago concluído, relatório entregue, R$ 1.500). Abre com duplo clique. O de teste tem um botão "🧪 Reiniciar o teste" na tela inicial e usa um save próprio (não mexe no jogo normal).

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
7. **Missão 2, fatia B (pronta):** dois pontos de coleta (fragmento de mata a oeste da fazenda e lavoura) com 5 atividades cada (`js/missoes/adubo/minigames.js`): coletar solo (pá), contar minhocas (lupa), infiltração (kit), contar insetos (lupa) e pH/umidade (sonda, opcional). No laboratório, a **bancada SOLO** (`bancada.js`, entre AMOSTRAS e o microscópio): secar, queimar e calcular a matéria orgânica (balança com estufa). Os equipamentos **aparecem na bancada** conforme comprados. O marcador amarelo leva à loja quando falta equipamento. Pagamentos: R$ 300 (campo), R$ 400 (lab), +R$ 100 (cálculo sem erro) e +R$ 100 (sonda nos dois pontos).
8. **Missão 2, fatia C (pronta):** a missão agora conclui. Etapas: 4 **diagnóstico** no mural (montar a cadeia de causas, com 2 cartões sem prova), 5 **convencer o Seu Geraldo** (3 objeções, escolher o dado certo da tabela mata × lavoura), 6 **restauração** (8 mudas na faixa de mata + 6 sementes de adubação verde em lotes novos, que só aparecem depois do acordo), 7 **esperar 30 dias** (tela escura) e **medir de novo** a lavoura (minhocas 1→5, infiltração 6:00→2:30, mesmos equipamentos), 8 **concluída** com tela antes × depois. O **relatório** paga de R$ 1.200 a R$ 2.000 conforme as **estrelas** (★ concluir; ★★ + cálculo sem erro e sonda nos 2 pontos; ★★★ + argumentos certos de primeira). Ajustes: placa solar e cata-vento **travados na loja** até a Missão 3, soja desenhada como plantinha, tolerância maior no cronômetro da infiltração, `scripts/gerar-arquivo-unico.mjs`.
9. **Personagem principal virou o "Biólogo"** (versão 3D da ficha de personagem em pixel art que o Wesley mandou): boné preto com logo, óculos escuros retangulares, barba e bigode, coque, brinco de argola e piercing no nariz, camiseta preta de manga curta (antebraço com a cor da pele), calça cargo verde-oliva com bolsos, bota, mochila verde com alças e garrafa de água, binóculo no peito. Feito em `js/boneco.js` (preset `CORES_BIOLOGO`, usado em `js/player.js`).
10. **Animações do Biólogo** (`js/acoes.js`): `fazerAcao('plantar' | 'regar' | 'coletar', aoFim)` roda a animação (girando braços e pernas do boneco), deixa o personagem parado e executa `aoFim` no final. **Plantar** nos lotes (`js/construir.js`) e nas 6 mudas do lago (`js/missoes/lago/index.js`): agacha e cava → a planta aparece → **rega** (garrafa e gotinhas). **Coletar**: frasco de água do lago (`collectGame`) e terra da Missão 2 (`coletarSolo`). **Binóculo**: segurar **B** (ou o botão 🔭 no celular): braços levantam o binóculo, a câmera dá zoom (FOV 60 → 24) e aparece uma moldura escura. O boneco ganhou `itemMao` (garrafa e frasco na mão direita) e `binPeito`/`binOlhos` (`js/boneco.js`).

11. **Gráficos novos:** `js/qualidade.js` (níveis Alta/Média/Baixa, escolhidos na tela inicial e salvos no localStorage; trocar recarrega a página) e `js/graficos.js` (pós-processamento: oclusão de ambiente GTAO só na Alta, bloom na Alta e Média, saturação e vinheta). Sombra do sol mais nítida, cobrindo ~50 m em volta do jogador e andando "de pixel em pixel" (`seguirSol` em `cena.js`), para não tremer. Céu em shader com nuvens que andam (`ceuTempo`), sol mais baixo. As nuvens antigas (bolas brancas) ainda são **criadas** em `vegetacao.js`, só não entram na cena, para não mudar o gerador com semente.
12. **Biólogo em 3D com esqueleto** (`js/personagem.js`, modelos em `js/modelos/`, veja o LEIA-ME de lá): modelo `.glb` com roupas recoloridas (paletó cortado na cintura, calça verde-oliva, bota) e acessórios presos nos ossos (boné, óculos, barba, coque, mochila, garrafa, binóculo). Animações parado/andar/correr misturadas pela velocidade. As ações (`acoes.js`) usam `poseEsqueleto()`: pivôs `armL/armR/legL/legR/joelhoL/joelhoR/tronco/cotoveloL/cotoveloR` (giro nos eixos do personagem, somado à animação) e `rig.mira` (aponta um osso numa direção; usado no binóculo). Se o modelo não carregar, o jogo usa o boneco antigo (`boneco.js`), que os NPCs continuam usando.
13. **Biólogo trocado pelo corpo da Quaternius (CC0)**: o Wesley baixou o pacote *Universal Base Characters* e mandou o `Superhero_Male` pelo chat (o `.zip` passa de 30 MB; o jeito foi mandar só os arquivos glTF/bin e as imagens). Como o corpo vem só de cueca, a **roupa e a barba foram pintadas na textura** (`scripts/pintar-roupa-biologo.py`). Ossos com outros nomes: mapa `OSSO` em `personagem.js` (Hips→pelvis, Spine2→spine_03, LeftArm→upperarm_l...). Animações do Xbot convertidas de novo para esse esqueleto. Faltam os `.bin` do coque (`Hair_Buns`) e da barba (`Hair_Beard`) do pacote, que ainda podem ser usados no lugar do coque feito no código.

14. **Terreno, grama e água** (remodelagem visual): o chão ganhou **textura desenhada no código** (`texGrama`/`texTerra` em `js/terreno.js`),
    misturada pelo atributo `mistura` (grama ↔ terra na trilha, lavoura, lama e pedra), em duas escalas (3 m e 17 m, girada) que somem com a
    distância; só uma escala no nível Baixo. Cores da grama menos amarelas. **Grama** (`js/vegetacao.js`): degradê raiz escura → ponta clara,
    "ondas" de vento que atravessam o campo (ponta clareia quando a rajada passa), e no Alto 40% de tufos extras (`gramaExtra`, com gerador
    próprio `mulberry32(7)` para não mexer no gerador com semente). **Água** (`js/lake.js`): reflexo do céu (Fresnel), brilho do sol e margem
    suave; continua verde e suja com o lago doente e fica azul e espelhada com `Q.health` → 1.

15. **Natureza com modelos da Quaternius** (*Stylized Nature MegaKit*, CC0; o Wesley deixou o pacote na pasta do projeto):
    `scripts/montar-natureza.py` junta 28 modelos num `js/modelos/natureza.glb` (3,9 MB, texturas reduzidas, folhas repintadas:
    árvore torta = **ipê-amarelo**, arbusto verde, sem folhas roxas/azuis). `js/natureza.js` põe os modelos **perto do jogador**
    (raio `natureza` em `qualidade.js`: 90/60/40 m) nos mesmos lugares das árvores, arbustos, pedras e flores do `vegetacao.js`
    (lista `vegetacao`); longe ficam as versões simples. Novos enfeites com gerador próprio: samambaias e folhagens em volta das
    árvores, cogumelos na base dos troncos, folhagens baixas no campo, pedrinhas na beira da trilha, capim alto na margem do lago e
    2 árvores mortas com orelha-de-pau perto do cano de esgoto. Folhas, flores e capim balançam com o vento (`comVento`).

16. **Palmeiras removidas** (pedido do Wesley: não fazem parte da mata do jogo). O código delas segue em `vegetacao.js` só para gastar
    os mesmos números do gerador com semente; não entram na cena nem têm colisão. **Menu inicial legível:** a caixa usava a classe
    `card` (mesmo nome das caixinhas claras dos painéis) e ficava branca com texto branco; virou `.inicio`, com fundo verde-escuro.

17. **Fazenda com modelos da Quaternius** (*Farm Buildings*, CC0; o Wesley mandou os zips FBX/OBJ): `scripts/montar-fazenda.py`
    converte os `.obj` em `js/modelos/fazenda.glb` (0,65 MB). `carregarModelosFazenda()` (`js/fazenda.js`, chamada no `main.js`)
    troca o galpão por um **celeiro** vermelho, o silo por um **silo** de tijolo, a cerca por pedaços de **cerca de madeira**, e
    acrescenta **garagem aberta com o trator dentro**, **galinheiro** com cerquinha de ripas, **caixa d'água** e **poço**. As
    versões simples ficam no grupo `simples` e somem quando os modelos carregam (colisão do galpão antigo só vale sem modelo).
    Não usados (combinariam menos): moinho holandês e cata-vento de torre (o cata-vento de energia é da Missão 3).

18. **NPCs em 3D** (`js/pessoas.js`): corpos da Quaternius (*Universal Base Characters*, CC0) com o mesmo esqueleto do Biólogo.
    Homem = corpo do `biologo.glb`; mulher = `mulher.glb`. A **roupa é pintada quando o jogo abre** com as cores do
    `addNPC({ cores })`, usando os mapas de regiões (`regioes_homem.png`/`regioes_mulher.png`: tronco, manga curta, manga
    longa, mão, cinto, calça, sapato); onde tem roupa o relevo (normal map) fica quase liso. Cabelo (`curto`, `raspado`,
    `comprido`) e barba vêm do `cabelos.glb`, chapéu de palha é feito no código. Animação "parado" do Biólogo; no corpo
    feminino ela é corrigida pela diferença da pose de descanso (`clipeParado`). Tudo gerado por `scripts/montar-pessoas.py`.
    **Lúcia**: `corpo: 'mulher'`, blusa azul, cabelo comprido. **Seu Geraldo**: camisa vermelha de manga longa, calça jeans,
    chapéu de palha, cabelo e barba grisalhos. NPCs criados antes de carregar (Lúcia) são trocados por `trocarNPCsPor3D()`.
    Se os modelos falharem, os NPCs usam o boneco antigo (`boneco.js`).

## Decisões tomadas
- **Garimpo:** o chamado da missão é "moradores passando mal depois de comer peixe + peixes estranhos" (o mercúrio age devagar; mortandade em massa seria falta de oxigênio). A missão do garimpo vem **antes** da Missão 3 (escolha do Wesley).
- O **`NOTAS.md` foi aposentado** (ele só existe na branch `main`, de 21/11). O que ainda valia foi para o `PLANO_MISSOES.md` (garimpo/mercúrio na Missão 8, pack do soro antiofídico, quiz) e para as pendências acima. Use só o `HISTORICO.md` e o `PLANO_MISSOES.md`.
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
- **Verba da Missão 2 (valores atuais, a ajustar jogando):** gasta ~R$ 1.140 (pá 60, lupa 120, kit 180, sonda 300, balança 450) + R$ 470 na restauração (8 × 40 + 6 × 25). Ganha R$ 300 (campo) + R$ 400 (lab) + bônus (R$ 100 cálculo sem erro, R$ 100 sonda) + relatório (R$ 1.200 a 2.000). **Sobra dinheiro com facilidade**; ideia em aberto: subir a balança para R$ 600 ou criar serviços extras no mural.
- O relatório usa `get verba()`/`get texto()` no objeto `relatorio` da missão (assim o valor muda conforme as estrelas sem mexer no `economia.js`).
- O `ativo` de `addLote` esconde um lote até a missão liberar (a missão do adubo usa `() => A.conv.feito`).
- O **jogador** usa `CORES_BIOLOGO`; os **NPCs** continuam com o modelo antigo. Os acessórios do Biólogo (`bone`, `oculos`, `barba`, `coque`, `orelhas`, `brinco`, `nariz`, `bolsosCargo`, `mangaCurta`, `mochilaGrande`, `binoculo`) nascem **desligados** em `CORES_PESQUISADOR`; um NPC pode ligar qualquer um passando a opção em `addNPC({ cores })`.
- **Binóculo:** tecla B **segurando** (não é liga/desliga), com zoom. Prepara a Missão 9 (fotografar animais). **Regar:** automático logo depois de plantar, sem item novo na loja (o Wesley escolheu assim).
- Fim da Missão 2 deixa o gancho: os equipamentos novos puxam muita energia (a Missão 3 começa daí).

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
- No `boneco.js`, peças **coladas direto no grupo do boneco** balançam junto com o corpo (o `player.js` faz o "bob" em todos os filhos diretos). Peças que devem acompanhar uma perna ou braço (bolsos, antebraço) são filhas do pivô dele.
- **Ações e o laço principal** (`js/main.js`): enquanto uma ação ou o binóculo está ativo, o jogo trata como "ocupado" (o `updatePlayer` **não roda**, então o personagem não anda **nem cai**). Quem mexe na pose é o `updateAcoes`, chamado **todo quadro**. Por isso, só inicie uma ação com o personagem no chão.
- Quem planta/coleta **não executa a lógica na hora do E**: a lógica vai dentro do `aoFim` da ação (a muda só aparece depois de agachar). Se criar uma ação nova, siga o mesmo padrão.
- Os "baseY" dos filhos do boneco (balanço do `player.js`) são reaproveitados pelo `acoes.js` para agachar (`baixar`). Peças novas coladas direto no `rig.g` entram nesse balanço.
- **Testes com Playwright:** o navegador de teste roda a ~1 a 2 quadros por segundo e o tempo do jogo avança no máximo 0,05 s por quadro, então uma animação de 1 s leva ~10 s de verdade. Esperar por condição (`estadoAcao().t > x`, `player.onGround`, `camera.fov`), nunca por tempo fixo. Ao teletransportar o jogador, espere `player.onGround === true` antes de fotografar (senão ele aparece "flutuando").
- **Editar arquivo com o `npm run dev` ligado recarrega a página** e derruba o teste em andamento. Espere uns segundos depois de editar e antes de rodar o teste, ou edite com o teste parado.
- O `window.__game` agora também expõe `fazerAcao`, `estadoAcao`, `camera` e `lotes` (só para testes).
- O `[E]` do NPC só aparece a até 2,4 m dele (`alcance`); nos testes, fique perto.
- Nos testes, **feche as falas** (`#dlg`) antes de apertar E: fala aberta bloqueia a interação. O teste de infiltração leva ~4 s (mata) e ~19 s (lavoura) de tempo real.
- `window.__game.A` é o estado da Missão 2. Atalho para testar o campo: `Object.assign(__game.A,{started:true,falou:true})` e `__game.eco.inv={pa:1,lupaCampo:1,kitInfiltracao:1,balancaSolo:1,sondaSolo:1}`.
- **Arquivo único:** o `replace` do JavaScript interpreta `$&` no texto novo, o que quebra o código do jogo colado dentro do HTML. Em `scripts/gerar-arquivo-unico.mjs` o `replace` usa uma **função** de propósito. Não troque por texto direto.
- O save do arquivo de teste usa a chave `estacao-bioma-teste-v1` (`window.__SAVE_KEY`, lida em `js/save.js`). Se mudar o formato do save, mude a versão da chave **e** o `SAVE_TESTE` do script.
- Com o servidor `npm run dev` ligado, **editar qualquer arquivo recarrega a página** e derruba um teste Playwright em andamento. Não edite durante o teste.
- No teste de infiltração, esperar o nível da água zerar (`#agua` com altura ≤ 0,5%) e só então clicar em Parar; tempo fixo falha no navegador lento.
- `economia.js` e `missoes/adubo/index.js` se importam (ciclo). Funciona porque só usam um ao outro dentro de funções, nunca no topo do arquivo. Mantenha assim.

- **Modelos .glb** entram no código com `import x from './modelos/arquivo.glb?inline'` (vira texto base64 dentro do JS): assim funcionam no `npm run dev`, no `dist/` e no arquivo único. O `vite.config.js` precisa do `assetsInclude: ['**/*.glb']`.
- **Imagens mandadas pelo chat chegam como `.webp`** (comprimidas, 2000 px). Servem como textura; o script converte para `.jpg` de 1024 px.
- **Animações de outro modelo:** não dá para só trocar o nome dos ossos; esqueletos com "pose de descanso" diferente ficam tortos (pernas para cima). Foi preciso reorientar cada osso comparando o giro no espaço do mundo. O `SkeletonUtils.retargetClip` do Three.js **não** funcionou para este par de modelos.
- **Testes do nível Alto** no navegador de teste (sem placa de vídeo) travam: teste no Médio ou Baixo (`localStorage['estacao-bioma-qualidade']`).
- Nos testes, **esconda o `#dlg` antes de teleportar** o jogador: com a fala aberta o `updatePlayer` não roda e ele fica flutuando (o `onGround` nunca fica `true`).

- **Novo NPC:** é só `addNPC({ cores: {...} })` com as opções listadas no topo de `js/pessoas.js` (corpo, pele, camisa,
  mangaLonga, calca, cinto, sapato, cabelo, cabeloTipo, barba, chapeu, faixa). No `biologo.glb` a malha do corpo NÃO se
  chama "Corpo" (o material sim): procure pelo `material.name === 'Corpo'`.
- **Modelos .obj da Quaternius:** a cor do `.mtl` (`Kd`) é "linear" (Blender). Converta para `.glb` com `baseColorFactor` = `Kd`
  (como faz o `montar-fazenda.py`); o `MTLLoader` do Three.js trataria como sRGB e escureceria tudo.
- **Modelos da natureza:** o pacote original da Quaternius (118 MB) fica fora do GitHub (`.gitignore`). Para mudar quais modelos
  entram ou a cor das folhas, edite `scripts/montar-natureza.py` e rode de novo. O `COLOR_0` do pacote **não é cor** (é máscara de
  vento do Unity/Unreal): se entrar, deixa samambaias quase pretas.
- **Pedras simples** do `vegetacao.js` são todas trocadas pelo modelo novo (raio infinito); árvores, arbustos e flores só perto.
  A versão simples é escondida zerando a matriz da cópia (`mostrarSimples` em `natureza.js`).
- **Testes com Playwright nesta máquina:** o navegador de teste já está em `~/AppData/Local/ms-playwright`; basta `npm i playwright`
  numa pasta temporária, `npx vite preview` e teleportar com `__game.player.pos.set(x, 30, z)` + esperar `onGround`.

- **CSS:** não reaproveite nomes de classe genéricos (`card`, `row`, `tip`...) em telas novas: as regras dos painéis valem para o
  jogo inteiro e mudam o fundo e o tamanho sem avisar (foi o que deixou o menu inicial ilegível).

## Como testar sem gastar muito
1. `npx vite build` (se der erro de "not exported", falta um `export` ou `import`).
2. Verificador de erros (ESLint, regra `no-undef`) pra achar variável sem `import`.
3. Um teste curto no navegador (Playwright) só no fim.
- **Atalho pra pular a missão do lago** (console do navegador, F12):
  `Object.assign(__game.Q,{secchi:30,probe:true,stored:true,micro:true,chemP:true,chemN:true,coli:3,diag:true,filter:true,plants:6,aerator:true,won:true,health:1})`
- O objeto `window.__game` expõe `player`, `Q`, `A`, `lotes`, `eco`, `lakeFx`, `addNPC`, `salvar`, `carregar` etc. (veja `js/main.js`).
- **Atalho pra testar a Missão 2 sem repetir o lago:** abra o `estacao-bioma-teste.html` (veja acima) e clique em Continuar.

## Próximos passos (ordem do plano)
0. **Missão do garimpo (mercúrio)**: planejada (27/11); falta programar as fatias A, B e C (veja o topo). Remodelagem visual: só falta o Wesley aprovar (Médio, natureza, NPCs).
1. **Missão 3: "Energia limpa para o laboratório"**: começa pelo gancho do fim da Missão 2 (equipamentos novos puxam mais energia do que o lab tem). Aí **destrava** a energia: placa solar e cata-vento saem do bloqueio em `ITENS` (`bloqueado`), as 2 bases de energia (`js/construir.js`) passam a ser usadas e o campo `watts` dos equipamentos ganha tela (consumo × geração). Veja o `PLANO_MISSOES.md`.
2. Conferir as animações e os fluxos de plantar/coletar (veja "Se você está começando uma conversa nova" no topo).
3. Ajustar o equilíbrio da verba da Missão 2 (ver Decisões) e, se precisar, **serviços extras** no mural.
4. Depois: Clima, Vila, Fauna, Barranco e Rio.
- **Missão 9 (ideia do Wesley, no plano):** fotografar espécies ameaçadas (lobo-guará) de forma furtiva, enviar pra prefeitura, ganhar verba e montar grades de proteção.
- **Ideias da ficha do Biólogo ainda não feitas:** equipamentos na mão (lupa, câmera, rede, luvas); a câmera fotográfica combina com a Missão 9 (e com o binóculo).
- **Qualidade gráfica:** seletor Alta/Média/Baixa **feito** (item 11). Rodar no PowerShell não melhora os gráficos; o que ajuda é o navegador usar a placa de vídeo certa (`chrome://gpu`).
- Ideias soltas: relógio de sol, herbário, conquistas, modo professor, modelos `.glb`.

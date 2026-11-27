# Estação Bioma — jogo 3D educativo (Three.js)

## Comece por aqui
No começo de cada sessão, leia o `HISTORICO.md` (o que já foi feito, decisões e armadilhas) e o `PLANO_MISSOES.md` (o que vem pela frente).

## Sobre o projeto
Jogo 3D de mundo aberto, estilo "cozy" com visual inspirado em Palworld, para alunos do Fundamental II (6º a 8º ano).
O jogador é um pesquisador de campo. Tem um laboratório (Estação Bioma) no meio da floresta e um lago eutrofizado a ~100 m.

## Sobre quem desenvolve
- O Wesley é professor de Ciências e **iniciante em programação**.
- Sempre comente o código **em português**, explicando o que cada parte faz.
- Antes de mudanças grandes, explique o plano em poucas linhas e peça confirmação.
- Respostas diretas e informais, sem textão.

## Como rodar
- Projeto com **Vite** + Three.js 0.170 (instalado pelo npm).
- Na primeira vez: `npm install`.
- Desenvolver: `npm run dev` e abrir o endereço que aparecer (ex.: http://localhost:5173). A página recarrega sozinha ao salvar.
- Versão final (para publicar): `npm run build`. Ela é gerada na pasta `dist/`.
- Arquivo único para abrir com duplo clique (sem servidor): `npm run unico` → `dist-unico/estacao-bioma.html`, `estacao-bioma-teste.html` (já com save depois do lago) e `estacao-bioma-teste-garimpo.html` (save depois da Missão 2).

## Organização dos arquivos
- `index.html`: a tela (HUD, painéis, tela inicial) e o CSS. Carrega `js/main.js`.
- `js/main.js`: monta o mundo e roda o laço principal. **A ordem dos `build...()` importa**, porque o gerador aleatório tem semente.
- `js/utils.js` (matemática), `js/mapa.js` (posições e altura do chão), `js/cena.js` (renderizador, câmera, luz e céu).
- `js/construcao.js`: ajudantes `addBox`/`addCyl`, texturas, placas e as listas `colliders`, `circles` e `animated`.
- `js/terreno.js`, `js/lab.js` (prédio e porta), `js/lake.js` (lago e saúde do lago), `js/vegetacao.js`.
- `js/acoes.js`: animações do Biólogo (`fazerAcao('plantar' | 'regar' | 'coletar', aoFim)`) e o binóculo (tecla B segurando, com zoom).
- `js/player.js`: personagem (o **Biólogo**), movimento, colisão e câmera. `js/personagem.js`: o Biólogo em 3D com esqueleto (modelo `.glb` e animações em `js/modelos/`). `js/boneco.js`: boneco antigo de formas simples (reserva do jogador e dos NPCs se os `.glb` falharem).
- `js/natureza.js`: modelos 3D da Quaternius (árvores, arbustos, pedras, flores, plantinhas) que aparecem perto do jogador, nos lugares sorteados pelo `vegetacao.js`. O pacote `js/modelos/natureza.glb` é feito por `scripts/montar-natureza.py`.
- `js/qualidade.js` (níveis de gráficos Alta/Média/Baixa) e `js/graficos.js` (pós-processamento: oclusão, bloom, acabamento).
- `js/npc.js`: `addNPC({nome, x, z, cores, falas | aoFalar, temMissao})`. Os NPCs são 3D (`js/pessoas.js`: corpos da Quaternius, roupa pintada com as `cores`; opções no topo do arquivo). `js/save.js`: salva no localStorage a cada 5 s.
- `js/economia.js` (verba, inventário, loja, relatórios; itens do tipo `equipamento` liberam testes), `js/prefeitura.js` (prédio e secretária), `js/construir.js` (lugares marcados para construir).
- `js/fazenda.js`: cenário da Fazenda Boa Safra (Missão 2), ao norte do lago (centro em (-45, 160), `FAZENDA` em `mapa.js`), com o fragmento de mata e os pontos de coleta. Celeiro, silo, cerca, garagem, galinheiro, caixa d'água e poço são modelos da Quaternius (`js/modelos/fazenda.glb`, feito por `scripts/montar-fazenda.py`). O fazendeiro (Seu Geraldo) e a bancada SOLO do laboratório são criados pela missão (`js/missoes/adubo/`).
- `js/garimpo.js`: cenário da missão do garimpo ("O peixe que faz mal"), a leste: Lagoa Dourada (centro (92, 66)), trapiche, comunidade ribeirinha, córrego e garimpo abandonado com a cava (`LAGOA`, `GARIMPO`, `CAVA`, `CORREGO` em `mapa.js`). A Dona Rosa é criada pela missão (`js/missoes/garimpo/`).
- `js/audio.js`, `js/controles.js` (teclado, mouse e toque), `js/interface.js` (zona, avisos, mini-mapa, diálogos `say()` e painéis `openPanel()`).
- `js/estado.js`: estado compartilhado (`keys`, `input`, `cam` e `jogo.ativa` = missão seguida agora).
- `js/quest.js`: **motor de missões** (interações com E, rastreador, marcador, falas por etapa, mural e caderno).
- `js/missoes/index.js`: lista de missões (uma missão pode ter `bloqueada()` para só abrir depois de outra) e o formato que cada uma segue. Cada missão tem a sua pasta (ex.: `js/missoes/lago/`, com `estado.js`, `minigames.js` e `index.js`).
- Regra dos módulos: um arquivo não pode **reatribuir** uma variável importada de outro. Estado compartilhado fica dentro de objetos (ex.: `cam.yaw = 1`).

## Mapa (coordenadas em metros)
- Laboratório: centro (0,0), 40 × 22 m, porta virada para +Z (z = 11).
- Lago: centro (-55, 85), raio ~26 m. Água em y = -0.7.
- Trilha de terra: da praça (0, 22) até o píer.
- Cano de esgoto e sacos de adubo: lado norte do lago.

## Missão atual: "Salvar o Lago da Mata"
1. **Campo** (kit no fim do píer): disco de Secchi, sonda multiparâmetro (OD, pH, temperatura) e frasco de coleta (a amostra estraga em 3 min).
2. **Laboratório**: guardar a amostra (bancada AMOSTRAS), teste de coliformes com estufa (25 s), microscópio (foco + achar 3 colônias de cianobactérias), colorimetria de fósforo e nitrogênio (bancada QUÍMICA).
3. **Diagnóstico** (mural): marcar as causas, que são esgoto e adubo.
4. **Restauração**: biofiltro no cano, 6 mudas de mata ciliar e aerador solar no píer. O lago melhora aos poucos (variável `Q.health`, de 0 a 1).
5. **Medir de novo** com a sonda. Aparece a tela de vitória com o antes e o depois.

O estado da missão fica no objeto `Q` e a etapa atual é calculada por `stage()`, os dois em `js/missoes/lago/estado.js`.
As interações com E da missão ficam em `interacoes()`, em `js/missoes/lago/index.js`. O motor (`js/quest.js`) registra todas.

## Ideias para depois
- O plano de novas missões está em `PLANO_MISSOES.md`. As Fases 0 (base de missões) e 1 (economia) estão prontas; a Missão 2 (monocultura) está pronta (veja o `HISTORICO.md`). A energia (placa solar e cata-vento) segue travada na loja até a Missão 3.
- Trocar os modelos feitos com formas simples por modelos .glb.
- NPCs na floresta com novas missões (o mural do laboratório já existe para isso).
- Novos lagos e rios com outros problemas: metais pesados (espectrofotômetro), condutividade.

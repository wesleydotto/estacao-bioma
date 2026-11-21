# Estação Bioma — jogo 3D educativo (Three.js)

## Sobre o projeto
Jogo 3D de mundo aberto, estilo "cozy" com visual inspirado em Palworld, para alunos do Fundamental II (6º a 8º ano).
O jogador é um pesquisador de campo. Tem um laboratório (Estação Bioma) no meio da floresta e um lago eutrofizado a ~100 m.

## Sobre quem desenvolve
- O Wesley é professor de Ciências e **iniciante em programação**.
- Sempre comente o código **em português**, explicando o que cada parte faz.
- Antes de mudanças grandes, explique o plano em poucas linhas e peça confirmação.
- Respostas diretas e informais, sem textão.

## Como rodar
- Tudo está em `index.html` (Three.js 0.170 via CDN, sem build).
- Rodar com servidor local: `npx serve .` e abrir o endereço que aparecer no navegador.

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

O estado da missão fica no objeto `Q`. A etapa atual é calculada por `stage()`.
As interações com a tecla E ficam em `setupInteractions()`.

## Ideias para depois
- Separar o código em arquivos (`world.js`, `lab.js`, `lake.js`, `quest.js`) com Vite.
- Trocar os modelos feitos com formas simples por modelos .glb.
- NPCs na floresta com novas missões (o mural do laboratório já existe para isso).
- Novos lagos e rios com outros problemas: metais pesados (espectrofotômetro), condutividade.
- Salvar o progresso (localStorage).

# Modelos 3D

- `biologo.glb`: o corpo do Biólogo. É o **"Superhero_Male"** do pacote *Universal Base Characters* da
  **Quaternius** (licença **CC0**: livre para usar, mudar e publicar). O Wesley baixou o pacote e mandou os arquivos.
  - A roupa (camiseta preta de manga curta, cinto, calça cargo verde-oliva com bolso e bota) e a **barba** foram
    **pintadas na textura do corpo** pelo script `scripts/pintar-roupa-biologo.py`: para cada pixel do mapa da pele, ele
    descobre em que ponto do corpo o pixel fica (altura, lado) e escolhe a cor.
  - Boné, óculos escuros, coque, mochila, garrafa e binóculo são criados no código, em `js/personagem.js`.
  - Para refazer o `.glb`: gerar a textura com o script, trocar as imagens no `.gltf` e juntar tudo com
    `npx @gltf-transform/cli copy biologo.gltf biologo.glb`.
- `animacoes.json`: as animações `idle` (parado), `walk` (andar) e `run` (correr). Vieram do modelo `Xbot.glb` dos
  exemplos do Three.js (animações do Mixamo) e foram **convertidas** para o esqueleto da Quaternius (nomes como
  `pelvis`, `spine_03`, `upperarm_l`): cada osso foi reorientado comparando o giro no espaço do mundo.
- Ainda dá para trocar pelas animações da própria Quaternius (*Universal Animation Library*, também CC0) e usar o
  cabelo `Hair_Buns` e a barba `Hair_Beard` do pacote (faltam os arquivos `.bin` deles).
- `natureza.glb`: árvores, arbustos, pedras, flores, samambaias, cogumelos, pedrinhas e capim do
  **"Stylized Nature MegaKit"** da **Quaternius** (versão grátis, **CC0**). O pacote original (118 MB) fica na pasta
  `Stylized Nature MegaKit[Standard]/` do projeto, que **não vai para o GitHub** (está no `.gitignore`).
  - Feito pelo `python scripts/montar-natureza.py`: escolhe os modelos (lista `MODELOS`), diminui as texturas,
    tira o `COLOR_0` (no original é máscara de vento, não cor) e **repinta** folhas: a árvore torta vira
    **ipê-amarelo**, o arbusto fica verde e as folhas roxas/azuis do atlas viram verdes.
  - Usado em `js/natureza.js` (modelos perto do jogador; longe ficam as versões simples do `vegetacao.js`).

# Modelos 3D

- `biologo.glb`: o corpo do Biólogo. É o avatar de exemplo do Ready Player Me que vem nos exemplos do Three.js
  (`examples/models/gltf/readyplayer.me.glb`, © Ready Player Me). As roupas são recoloridas e os acessórios
  (boné, óculos, barba, mochila, binóculo) são criados no código, em `js/personagem.js`.
- `animacoes.json`: as animações `idle` (parado), `walk` (andar) e `run` (correr). Vieram do modelo
  `Xbot.glb` dos exemplos do Three.js (animações do Mixamo, da Adobe) e foram **convertidas** para o esqueleto
  do `biologo.glb` (os dois esqueletos têm a "pose de descanso" diferente: cada osso foi reorientado
  comparando o giro no espaço do mundo).

Uso num projeto escolar/privado: ok. Se um dia o jogo for publicado para o público,
vale trocar por modelos com licença livre (CC0), como os da Quaternius.

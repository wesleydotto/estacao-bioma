// Arquivo: personagem.js — o Biólogo em 3D "de verdade" (modelo .glb com esqueleto).
//
// Como funciona:
//  - O modelo (js/modelos/biologo.glb) é uma pessoa com ossos (quadril, coluna, braços...):
//    o corpo base "Superhero_Male" da Quaternius (licença CC0, livre), com a roupa pintada na textura.
//  - As animações de ficar parado, andar e correr (js/modelos/animacoes.json) mexem esses ossos.
//    Elas vieram de outro modelo e foram convertidas para este esqueleto.
//  - Penduramos nos ossos os acessórios do Biólogo
//    (boné, óculos escuros, coque, mochila, garrafa e binóculo).
//
// O "rig" devolvido tem o mesmo formato do boneco antigo (boneco.js): armL, armR, legL e legR.
// Quem quiser fazer uma pose (o acoes.js, ao plantar ou usar o binóculo) gira esses "pivôs"
// em .rotation.x (para frente/trás) e .rotation.z (para o lado), e o atualizar() aplica
// esse giro nos ossos de verdade, por cima da animação. A cada quadro os pivôs voltam a zero.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { std } from './construcao.js';
import urlModelo from './modelos/biologo.glb?inline';   // ?inline = o modelo vai dentro do código (funciona até no arquivo único)
import animacoesJSON from './modelos/animacoes.json';

// Cores do Biólogo (as mesmas da ficha de personagem)
const COR = {
  camiseta: '#1c1f22', calca: '#6d6a3a', bota: '#3b2a1f', cabelo: '#2e2118',
  bone: '#16181a', mochila: '#4f5d34', alca: '#3a4527',
};

// Nomes "de sempre" (usados aqui e no acoes.js) → nomes reais dos ossos do modelo da Quaternius
const OSSO = {
  Hips: 'pelvis', Spine1: 'spine_02', Spine2: 'spine_03', Head: 'Head',
  LeftArm: 'upperarm_l', LeftForeArm: 'lowerarm_l', RightArm: 'upperarm_r', RightForeArm: 'lowerarm_r', RightHand: 'hand_r',
  LeftUpLeg: 'thigh_l', LeftLeg: 'calf_l', RightUpLeg: 'thigh_r', RightLeg: 'calf_r',
};

export async function carregarBiologo() {
  const gltf = await new GLTFLoader().loadAsync(urlModelo);
  const modelo = gltf.scene;
  const g = new THREE.Group();   // grupo do personagem: o player.js move e gira este grupo
  g.add(modelo);

  // ---------- 1) Corpo ----------
  // A roupa do Biólogo (camiseta preta de manga curta, cinto, calça cargo verde-oliva e bota)
  // já vem PINTADA na textura do corpo (feita a partir da pele do modelo da Quaternius).
  modelo.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    o.frustumCulled = false;   // malha com ossos: evita sumir quando a animação sai da "caixa" original
  });

  // ---------- 2) Acessórios presos nos ossos ----------
  modelo.updateMatrixWorld(true);
  const osso = (nome) => modelo.getObjectByName(OSSO[nome] || nome);
  // Coloca uma peça num ponto do corpo (em metros, com o personagem de pé olhando para +Z)
  // e depois "gruda" a peça no osso: daí em diante ela acompanha a animação.
  const prender = (nomeOsso, malha, x, y, z, rx = 0, ry = 0, rz = 0) => {
    malha.position.set(x, y, z); malha.rotation.set(rx, ry, rz);
    modelo.add(malha); malha.updateMatrixWorld(true);
    osso(nomeOsso).attach(malha);   // attach = muda de "pai" sem sair do lugar
    malha.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return malha;
  };
  const M = (geo, mat) => new THREE.Mesh(geo, mat);

  // Cabelo: atrás da cabeça + coque no alto (aparece debaixo do boné)
  const cabelo = std(COR.cabelo, 0.9);
  const tras = prender('Head', M(new THREE.SphereGeometry(0.097, 18, 12), cabelo), 0, 1.71, -0.025); tras.scale.set(0.98, 1.0, 1.05);
  prender('Head', M(new THREE.SphereGeometry(0.045, 12, 10), cabelo), 0, 1.785, -0.11);

  // Boné: cúpula + aba curva na frente + plaquinha clara do logo
  const boneMat = std(COR.bone, 0.8);
  const cupula = prender('Head', M(new THREE.SphereGeometry(0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), boneMat), 0, 1.742, -0.005);
  cupula.scale.set(1, 0.85, 1.12);
  prender('Head', M(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 18, 1, false, -Math.PI / 2, Math.PI), boneMat), 0, 1.748, 0.095, 0.12);
  prender('Head', M(new THREE.BoxGeometry(0.06, 0.03, 0.006), std('#cfd4d8', 0.6)), 0, 1.785, 0.1, -0.35);

  // Óculos escuros retangulares: duas lentes, ponte e hastes até as orelhas
  const lente = std('#0b0d0f', 0.15, 0.4);
  for (const s of [-1, 1]) {
    prender('Head', M(new THREE.BoxGeometry(0.05, 0.03, 0.008), lente), s * 0.032, 1.702, 0.1);
    prender('Head', M(new THREE.BoxGeometry(0.005, 0.006, 0.11), lente), s * 0.083, 1.706, 0.045, 0, -s * 0.12, 0);
  }
  prender('Head', M(new THREE.BoxGeometry(0.02, 0.005, 0.006), lente), 0, 1.707, 0.103);

  // (A barba e o bigode estão pintados na textura do rosto.)

  // Mochila verde com alças no peito e garrafa de água do lado
  const mochila = prender('Spine2', M(new THREE.BoxGeometry(0.34, 0.44, 0.17), std(COR.mochila, 0.8)), 0, 1.24, -0.215);
  prender('Spine2', M(new THREE.BoxGeometry(0.3, 0.12, 0.06), std('#45512d', 0.85)), 0, 1.1, -0.31);   // bolso da frente da mochila
  for (const s of [-1, 1]) prender('Spine2', M(new THREE.BoxGeometry(0.04, 0.34, 0.02), std(COR.alca, 0.85)), s * 0.09, 1.3, 0.13, -0.12);
  prender('Spine2', M(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), std('#d9e3d0', 0.5)), 0.2, 1.12, -0.22);
  prender('Spine2', M(new THREE.CylinderGeometry(0.037, 0.037, 0.03, 10), std('#2b8a3e', 0.6)), 0.2, 1.225, -0.22);
  void mochila;

  // Binóculo: um pendurado no peito (binPeito) e outro escondido na frente dos olhos (binOlhos)
  const binMat = std('#2a2d30', 0.5, 0.2), vidro = std('#74c0fc', 0.1, 0.3, { emissive: '#1c7ed6', emissiveIntensity: 0.4 });
  const fazerBinoculo = (escala) => {
    const b = new THREE.Group();
    for (const s of [-1, 1]) {
      const tubo = M(new THREE.CylinderGeometry(0.03, 0.033, 0.09, 10), binMat); tubo.rotation.x = Math.PI / 2; tubo.position.x = s * 0.036; b.add(tubo);
      const vid = M(new THREE.CircleGeometry(0.027, 10), vidro); vid.position.set(s * 0.036, 0, 0.046); b.add(vid);
    }
    b.add(M(new THREE.BoxGeometry(0.04, 0.02, 0.04), binMat)); b.scale.setScalar(escala); return b;
  };
  const binPeito = prender('Spine2', fazerBinoculo(1), 0, 1.2, 0.165);
  const binOlhos = prender('Head', fazerBinoculo(1.1), 0, 1.70, 0.16); binOlhos.visible = false;

  // Objetos que aparecem na mão direita nas animações: garrafa (regar) e frasco (coletar)
  const mao = osso('RightHand').getWorldPosition(new THREE.Vector3());
  const grupoMao = prender('RightHand', new THREE.Group(), mao.x - 0.06, mao.y - 0.02, mao.z + 0.02);
  const garrafa = M(new THREE.CylinderGeometry(0.035, 0.035, 0.17, 10), std('#d9e3d0', 0.5)); garrafa.visible = false;
  const tampa = M(new THREE.CylinderGeometry(0.037, 0.037, 0.03, 10), std('#2b8a3e', 0.6)); tampa.position.y = 0.1; garrafa.add(tampa);
  const frasco = M(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 8), std('#74c0fc', 0.1, 0, { emissive: '#1c7ed6', emissiveIntensity: 0.5 })); frasco.visible = false;
  grupoMao.add(garrafa, frasco);
  grupoMao.rotation.z = Math.PI / 2;   // com o braço aberto (pose de descanso), "em pé" na mão é ao longo do braço

  // ---------- 3) Animações: parado, andando e correndo (misturadas pela velocidade) ----------
  const mixer = new THREE.AnimationMixer(modelo);
  const clips = animacoesJSON.map(c => THREE.AnimationClip.parse(c));
  const acao = {};
  for (const c of clips) { acao[c.name] = mixer.clipAction(c); acao[c.name].play(); acao[c.name].setEffectiveWeight(0); }
  acao.idle.setEffectiveWeight(1);
  const peso = { idle: 1, walk: 0, run: 0 };

  // ---------- 4) Pivôs para as poses (mesmo formato do boneco antigo) ----------
  const pivo = () => new THREE.Object3D();
  const armL = pivo(), armR = pivo(), legL = pivo(), legR = pivo(), joelhoL = pivo(), joelhoR = pivo(), tronco = pivo(), cotoveloL = pivo(), cotoveloR = pivo();
  const ligacoes = [[tronco, 'Spine1'], [armL, 'LeftArm'], [armR, 'RightArm'], [cotoveloL, 'LeftForeArm'], [cotoveloR, 'RightForeArm'], [legL, 'LeftUpLeg'], [legR, 'RightUpLeg'], [joelhoL, 'LeftLeg'], [joelhoR, 'RightLeg']]
    .map(([p, n]) => [p, osso(n)]);

  const qChar = new THREE.Quaternion(), qGiro = new THREE.Quaternion(), qPai = new THREE.Quaternion(), qPaiInv = new THREE.Quaternion();
  // Gira um osso "em volta dos eixos do personagem" (não dos eixos do próprio osso, que são tortos)
  function aplicarPivo(p, bone) {
    const r = p.rotation; if (r.x === 0 && r.y === 0 && r.z === 0) return;
    g.getWorldQuaternion(qChar);
    qGiro.setFromEuler(r);
    qGiro.premultiply(qChar).multiply(qChar.clone().invert());   // giro no espaço do mundo
    bone.parent.getWorldQuaternion(qPai); qPaiInv.copy(qPai).invert();
    // novo local = pai⁻¹ · giro · pai · local
    bone.quaternion.premultiply(qPai).premultiply(qGiro).premultiply(qPaiInv);
    bone.updateMatrixWorld(true);
  }

  // Aponta um osso numa direção (nos eixos do personagem: +X = esquerda dele, +Y = cima, +Z = frente).
  // Usa a posição do primeiro "filho" do osso para saber para onde ele aponta agora.
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vAlvo = new THREE.Vector3(), qDelta = new THREE.Quaternion();
  function apontar(bone, dir) {
    const filho = bone.children.find(c => c.isBone); if (!filho) return;
    bone.getWorldPosition(vA); filho.getWorldPosition(vB); vB.sub(vA).normalize();
    g.getWorldQuaternion(qChar); vAlvo.copy(dir).normalize().applyQuaternion(qChar);
    qDelta.setFromUnitVectors(vB, vAlvo);
    bone.parent.getWorldQuaternion(qPai); qPaiInv.copy(qPai).invert();
    bone.quaternion.premultiply(qPai).premultiply(qDelta).premultiply(qPaiInv);
    bone.updateMatrixWorld(true);
  }
  // ordem importa: primeiro o braço, depois o antebraço
  const ORDEM_MIRA = ['LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm'];
  const mira = {};   // ex.: rig.mira.LeftArm = new THREE.Vector3(0.3, -0.4, 0.9)

  const rig = {
    mira,
    g, armL, armR, legL, legR, joelhoL, joelhoR, tronco, cotoveloL, cotoveloR,
    body: [], itemMao: { grupo: grupoMao, garrafa, frasco }, binPeito, binOlhos,
    esqueleto: true,          // avisa o player.js e o acoes.js que este é o boneco com ossos
    velocidade: 0,            // m/s (o player.js preenche)
    noChao: true,
    // Chamado todo quadro (no main.js), DEPOIS do updatePlayer e do updateAcoes
    atualizar(dt) {
      // quanto de cada animação usar, conforme a velocidade
      const v = rig.velocidade;
      const alvo = !rig.noChao ? { idle: 0, walk: 0, run: 1 }
        : v < 0.4 ? { idle: 1, walk: 0, run: 0 }
        : v < 3.2 ? { idle: 0, walk: 1, run: 0 }
        : { idle: 0, walk: 0, run: 1 };
      const k = 1 - Math.exp(-10 * dt);
      for (const n in peso) { peso[n] += (alvo[n] - peso[n]) * k; acao[n].setEffectiveWeight(peso[n]); }
      acao.walk.timeScale = THREE.MathUtils.clamp(v / 2.2, 0.6, 1.5);
      acao.run.timeScale = rig.noChao ? 0.75 + v * 0.075 : 0.15;   // no ar: corrida quase parada
      mixer.update(dt);
      g.updateMatrixWorld(true);
      for (const [p, bone] of ligacoes) aplicarPivo(p, bone);
      for (const n of ORDEM_MIRA) if (mira[n]) apontar(osso(n), mira[n]);
      for (const [p] of ligacoes) p.rotation.set(0, 0, 0);   // zera para o próximo quadro
      for (const n in mira) delete mira[n];
    },
  };
  return rig;
}

// Arquivo: terreno.js — o chão do mundo (relevo e cores).
import * as THREE from 'three';
import { scene } from './cena.js';
import { groundHeight, distToPath, lakeNorm } from './mapa.js';
import { fbm, noise, smoothstep } from './utils.js';

// =====================================================================
//  TERRENO
// =====================================================================
export function buildTerrain() {
  const SIZE = 620, SEG = 250;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const grassA = new THREE.Color('#86c84f'), grassB = new THREE.Color('#4e9a35'), dry = new THREE.Color('#b4bf56');
  const dirt = new THREE.Color('#b9915b'), mud = new THREE.Color('#6b5a36'), deep = new THREE.Color('#38461f'), rock = new THREE.Color('#8f9580');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, groundHeight(x, z));
    c.copy(grassB).lerp(grassA, fbm(x * 0.03, z * 0.03) * 0.5 + 0.5);
    c.lerp(dry, smoothstep(0.35, 0.8, noise(x * 0.012 + 5, z * 0.012)) * 0.6);
    c.lerp(rock, smoothstep(200, 245, Math.hypot(x, z)) * 0.8);
    c.lerp(dirt, 1 - smoothstep(1.6, 3.4, distToPath(x, z)));
    const ld = lakeNorm(x, z);
    c.lerp(mud, smoothstep(1.3, 1.0, ld));
    c.lerp(deep, smoothstep(0.95, 0.7, ld));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  mesh.receiveShadow = true;
  scene.add(mesh);
}

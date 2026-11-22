# =====================================================================
#  MONTAR O PACOTE DA FAZENDA  (rode com:  python scripts/montar-fazenda.py)
#  Pega os modelos .obj do pacote "Farm Buildings" (Quaternius, CC0), que fica
#  na pasta "Farm Buildings (Quaternius)/OBJ", e junta num único arquivo:
#  js/modelos/fazenda.glb  (cada modelo vira um "nó" com o nome do arquivo).
#
#  Por que converter? Os .obj guardam a cor no .mtl ("Kd") do jeito do Blender
#  (cor "linear"). No .glb a cor vai certinha; carregando o .obj direto no
#  Three.js as cores ficariam mais escuras.
#  Só precisa rodar de novo se mudar a lista de MODELOS.
# =====================================================================
import json, struct
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / 'Farm Buildings (Quaternius)' / 'OBJ'
SAIDA = RAIZ / 'js' / 'modelos' / 'fazenda.glb'

MODELOS = ['BigBarn', 'OpenBarn', 'Silo', 'Fence', 'Fence2', 'ChickenCoop', 'WaterTower', 'Well']


def ler_mtl(arq):
    """Lê as cores (Kd) de cada material do .mtl."""
    cores, nome = {}, None
    for linha in open(arq, encoding='utf8'):
        p = linha.split()
        if not p: continue
        if p[0] == 'newmtl': nome = p[1]
        elif p[0] == 'Kd': cores[nome] = [float(x) for x in p[1:4]]
    return cores


def ler_obj(arq):
    """Lê o .obj: devolve {material: (posições, normais)} já em triângulos."""
    v, vn, partes, mat = [], [], {}, None
    for linha in open(arq, encoding='utf8'):
        p = linha.split()
        if not p: continue
        if p[0] == 'v': v.append([float(x) for x in p[1:4]])
        elif p[0] == 'vn': vn.append([float(x) for x in p[1:4]])
        elif p[0] == 'usemtl': mat = p[1]
        elif p[0] == 'f':
            cantos = []
            for c in p[1:]:
                idx = c.split('/')
                cantos.append((int(idx[0]) - 1, int(idx[2]) - 1 if len(idx) > 2 and idx[2] else None))
            pos, nor = partes.setdefault(mat, ([], []))
            for k in range(1, len(cantos) - 1):            # polígono -> triângulos (em leque)
                for (iv, inn) in (cantos[0], cantos[k], cantos[k + 1]):
                    pos.append(v[iv]); nor.append(vn[inn] if inn is not None else [0, 1, 0])
    return partes


binario = bytearray()
saida = {'asset': {'version': '2.0', 'generator': 'montar-fazenda.py'}, 'scene': 0, 'scenes': [{'nodes': []}],
         'nodes': [], 'meshes': [], 'accessors': [], 'bufferViews': [], 'materials': []}
materiais = {}


def anexar(arr, alvo):
    while len(binario) % 4: binario.append(0)
    dados = arr.tobytes()
    saida['bufferViews'].append({'buffer': 0, 'byteOffset': len(binario), 'byteLength': len(dados), 'target': alvo})
    binario.extend(dados)
    return len(saida['bufferViews']) - 1


def acessor(arr, tipo, alvo, minmax=False):
    a = {'bufferView': anexar(arr, alvo), 'componentType': 5126, 'count': len(arr), 'type': tipo}
    if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    saida['accessors'].append(a)
    return len(saida['accessors']) - 1


for nome in MODELOS:
    cores = ler_mtl(PASTA / f'{nome}.mtl')
    prims = []
    for mat, (pos, nor) in ler_obj(PASTA / f'{nome}.obj').items():
        chave = f'{nome}_{mat}'                       # material próprio de cada modelo (cores diferem entre arquivos)
        saida['materials'].append({'name': chave, 'pbrMetallicRoughness': {
            'baseColorFactor': cores.get(mat, [0.8, 0.8, 0.8]) + [1.0], 'metallicFactor': 0.0, 'roughnessFactor': 0.85}})
        # cantos repetidos (mesma posição e mesma normal) viram um só, e os triângulos apontam para eles (arquivo menor)
        PN = np.round(np.hstack([np.array(pos), np.array(nor)]), 5).astype(np.float32)
        unicos, idx = np.unique(PN, axis=0, return_inverse=True)
        P, N = np.ascontiguousarray(unicos[:, :3]), np.ascontiguousarray(unicos[:, 3:])
        I = idx.reshape(-1).astype(np.uint16 if len(unicos) < 65536 else np.uint32)
        saida['accessors'].append({'bufferView': anexar(I, 34963), 'componentType': 5123 if I.dtype == np.uint16 else 5125, 'count': len(I), 'type': 'SCALAR'})
        indices = len(saida['accessors']) - 1
        prims.append({'attributes': {'POSITION': acessor(P, 'VEC3', 34962, True), 'NORMAL': acessor(N, 'VEC3', 34962)},
                      'indices': indices, 'material': len(saida['materials']) - 1})
    saida['meshes'].append({'name': nome, 'primitives': prims})
    saida['nodes'].append({'name': nome, 'mesh': len(saida['meshes']) - 1})
    saida['scenes'][0]['nodes'].append(len(saida['nodes']) - 1)

while len(binario) % 4: binario.append(0)
saida['buffers'] = [{'byteLength': len(binario)}]
js = json.dumps(saida, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binario))
glb += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binario), 0x004E4942) + bytes(binario)
SAIDA.write_bytes(glb)
print(f'Pronto: {SAIDA.relative_to(RAIZ)}  ({len(glb) / 1e6:.2f} MB, {len(MODELOS)} modelos)')

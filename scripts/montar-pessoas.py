# =====================================================================
#  MONTAR OS PERSONAGENS (NPCs)  (rode com:  python scripts/montar-pessoas.py)
#  Usa o pacote "Universal Base Characters" da Quaternius (CC0), copiado na
#  pasta "Universal Base Characters (Quaternius)" do projeto (fora do GitHub).
#  Gera em js/modelos/:
#   - mulher.glb        corpo feminino com ossos (mesmo esqueleto do Biólogo), olhos e sobrancelhas
#   - cabelos.glb       cabelos e barba (cada um é um nó com o nome do arquivo)
#   - pele_homem.jpg    a pele do corpo masculino sem roupa (o Biólogo usa outra, já com a roupa pintada)
#   - regioes_homem.png e regioes_mulher.png: "mapas de regiões". Cada pixel diz que parte do
#     corpo ele é (tronco, braço, mão, perna, pé...). O jogo usa esse mapa para PINTAR A ROUPA de
#     cada NPC com as cores do addNPC({ cores }) (veja js/pessoas.js).
# =====================================================================
import io, json, struct
from pathlib import Path
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PACOTE = RAIZ / 'Universal Base Characters (Quaternius)'
CORPOS, CABELOS = PACOTE / 'Corpos', PACOTE / 'Cabelos'
SAIDA = RAIZ / 'js' / 'modelos'
TAM = 1024   # tamanho das texturas do corpo e dos mapas de regiões

# Códigos das regiões (o js/pessoas.js usa os mesmos números)
PELE, TRONCO, MANGA_CURTA, MANGA_LONGA, MAO, CINTO, CALCA, SAPATO = 0, 1, 2, 3, 4, 5, 6, 7
TIPOS = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
COMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def ler_acessor(g, b, i):
    a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]
    c = COMP[a['type']]; t = TIPOS[a['componentType']]
    passo = bv.get('byteStride', np.dtype(t).itemsize * c)
    ini = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    if passo == np.dtype(t).itemsize * c:
        arr = np.frombuffer(b, t, a['count'] * c, ini)
    else:
        arr = np.concatenate([np.frombuffer(b, t, c, ini + k * passo) for k in range(a['count'])])
    return arr.reshape(a['count'], c) if c > 1 else arr


class Pacote:
    """Monta um .glb do zero (buffers, acessores, materiais e imagens)."""
    def __init__(self):
        self.bin = bytearray()
        self.j = {'asset': {'version': '2.0', 'generator': 'montar-pessoas.py'}, 'scene': 0, 'scenes': [{'nodes': []}],
                  'nodes': [], 'meshes': [], 'accessors': [], 'bufferViews': [], 'materials': [],
                  'textures': [], 'images': [], 'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}]}

    def anexar(self, dados, alvo=None):
        while len(self.bin) % 4: self.bin.append(0)
        bv = {'buffer': 0, 'byteOffset': len(self.bin), 'byteLength': len(dados)}
        if alvo: bv['target'] = alvo
        self.bin.extend(dados); self.j['bufferViews'].append(bv)
        return len(self.j['bufferViews']) - 1

    def acessor(self, g, b, i, alvo=None):
        a = g['accessors'][i]; arr = ler_acessor(g, b, i)
        novo = {k: v for k, v in a.items() if k not in ('bufferView', 'byteOffset', 'name')}
        novo['bufferView'] = self.anexar(np.ascontiguousarray(arr).tobytes(), alvo)
        self.j['accessors'].append(novo)
        return len(self.j['accessors']) - 1

    def textura(self, im, tam, fmt):
        im = im.resize((tam, tam), Image.LANCZOS); buf = io.BytesIO()
        if fmt == 'jpg': im.convert('RGB').save(buf, 'JPEG', quality=88); mime = 'image/jpeg'
        else: im.save(buf, 'PNG', optimize=True); mime = 'image/png'
        self.j['images'].append({'bufferView': self.anexar(buf.getvalue()), 'mimeType': mime})
        self.j['textures'].append({'sampler': 0, 'source': len(self.j['images']) - 1})
        return len(self.j['textures']) - 1

    def material(self, m):
        self.j['materials'].append(m); return len(self.j['materials']) - 1

    def gravar(self, arq):
        while len(self.bin) % 4: self.bin.append(0)
        self.j['buffers'] = [{'byteLength': len(self.bin)}]
        js = json.dumps(self.j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
        glb = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(self.bin))
        glb += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(self.bin), 0x004E4942) + bytes(self.bin)
        arq.write_bytes(glb)
        print(f'  {arq.relative_to(RAIZ)}  ({len(glb) / 1e6:.2f} MB)')


# ---------------------------------------------------------------------
#  1) CORPO FEMININO com ossos -> mulher.glb (mesma estrutura do biologo.glb)
# ---------------------------------------------------------------------
def montar_mulher():
    g = json.loads((CORPOS / 'Superhero_Female_FullBody.gltf').read_text())
    b = (CORPOS / g['buffers'][0]['uri']).read_bytes()
    p = Pacote()
    pele = p.textura(Image.open(CORPOS / 'T_Superhero_Female_Dark_BaseColor.png'), TAM, 'jpg')
    normal = p.textura(Image.open(CORPOS / 'T_Superhero_Female_Normal.png'), TAM, 'jpg')
    olho = p.textura(Image.open(CORPOS / 'T_Eye_Brown.png'), 256, 'jpg')
    mats = {
        'MI_Hair_2': p.material({'name': 'Sobrancelha', 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorFactor': [0.08, 0.055, 0.04, 1], 'roughnessFactor': 0.9, 'metallicFactor': 0}}),
        'MI_Eyes': p.material({'name': 'MI_Eyes', 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorTexture': {'index': olho}, 'roughnessFactor': 0.35, 'metallicFactor': 0}}),
        'MI_Superhero_Female': p.material({'name': 'Corpo', 'doubleSided': True, 'normalTexture': {'index': normal},
                                           'pbrMetallicRoughness': {'baseColorTexture': {'index': pele}, 'roughnessFactor': 0.8, 'metallicFactor': 0}}),
    }
    nomes = {'Eyebrows': 'Sobrancelha', 'Eyes': 'Olhos', 'Superhero_Female': 'Corpo'}
    # malhas: só posição, normal, uv, ossos e pesos (o resto do pacote só serve no Unity/Unreal)
    for m in g['meshes']:
        prims = []
        for pr in m['primitives']:
            at = {k: p.acessor(g, b, v, 34962) for k, v in pr['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0')}
            prims.append({'attributes': at, 'indices': p.acessor(g, b, pr['indices'], 34963), 'material': mats[g['materials'][pr['material']]['name']]})
        p.j['meshes'].append({'name': nomes.get(m['name'], m['name']), 'primitives': prims})
    # nós (ossos e malhas), pele (skin) e cena: copiados como estão
    for n in g['nodes']:
        novo = {k: v for k, v in n.items()}
        if novo.get('name') in nomes: novo['name'] = nomes[novo['name']]
        p.j['nodes'].append(novo)
    p.j['skins'] = [{**s, 'inverseBindMatrices': p.acessor(g, b, s['inverseBindMatrices'])} for s in g['skins']]
    p.j['scenes'] = g['scenes']
    p.gravar(SAIDA / 'mulher.glb')
    return g, b


# ---------------------------------------------------------------------
#  2) CABELOS E BARBA -> cabelos.glb (malhas simples, presas na cabeça pelo jogo)
# ---------------------------------------------------------------------
def montar_cabelos():
    p = Pacote()
    tex = {'MI_Hair_1': p.textura(Image.open(CABELOS / 'T_Hair_1_BaseColor.png'), 512, 'jpg'),
           'MI_Hair_2': p.textura(Image.open(CABELOS / 'T_Hair_2_BaseColor.png'), 512, 'jpg')}
    mats = {}
    for nome in ['Hair_Long', 'Hair_SimpleParted', 'Hair_Buzzed', 'Hair_Beard']:
        g = json.loads((CABELOS / f'{nome}.gltf').read_text()); b = (CABELOS / g['buffers'][0]['uri']).read_bytes()
        prims = []
        for pr in g['meshes'][0]['primitives']:
            mn = g['materials'][pr['material']]['name']
            if mn not in mats:
                mats[mn] = p.material({'name': mn, 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorTexture': {'index': tex[mn]}, 'roughnessFactor': 0.75, 'metallicFactor': 0}})
            at = {k: p.acessor(g, b, v, 34962) for k, v in pr['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0')}
            prims.append({'attributes': at, 'indices': p.acessor(g, b, pr['indices'], 34963), 'material': mats[mn]})
        p.j['meshes'].append({'name': nome, 'primitives': prims})
        p.j['nodes'].append({'name': nome, 'mesh': len(p.j['meshes']) - 1})
        p.j['scenes'][0]['nodes'].append(len(p.j['nodes']) - 1)
    p.gravar(SAIDA / 'cabelos.glb')


# ---------------------------------------------------------------------
#  3) MAPA DE REGIÕES: para cada pixel da textura, descobre onde ele fica no
#     corpo (posição 3D, com o personagem de braços abertos) e qual é a região.
#     Os limites usam as juntas de cada corpo (ombro, cotovelo, pulso, quadril).
# ---------------------------------------------------------------------
def juntas(g):
    """Posição no mundo de cada osso na pose de descanso."""
    N = g['nodes']; pai = {c: i for i, n in enumerate(N) for c in n.get('children', [])}; memo = {}
    def q2m(q):
        x, y, z, w = q
        return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
    def M(i):
        if i in memo: return memo[i]
        n = N[i]; m = np.eye(4); m[:3, :3] = q2m(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1])); m[:3, 3] = n.get('translation', [0, 0, 0])
        if i in pai: m = M(pai[i]) @ m
        memo[i] = m; return m
    return {N[i].get('name'): M(i)[:3, 3] for i in range(len(N))}


def regioes(P, J, mulher):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]; ax = np.abs(x)
    ombro, cotovelo, pulso = J['upperarm_l'][0], J['lowerarm_l'][0], J['hand_l'][0]
    braco_y, quadril = J['upperarm_l'][1], J['thigh_l'][1]
    r = np.zeros(len(P), np.uint8)
    braco = (ax > ombro) & (y > braco_y - 0.22)
    tronco = ~braco
    gola = J['neck_01'][1] + (-0.02 if mulher else 0.0) + np.clip(ax - 0.05, 0, None) * 1.6 - 0.015 * (z > 0.04)
    r[tronco & (y >= quadril + 0.03) & (y < gola)] = TRONCO
    r[braco & (ax < ombro + (cotovelo - ombro) * 0.6)] = MANGA_CURTA
    r[braco & (ax >= ombro + (cotovelo - ombro) * 0.6) & (ax < pulso - 0.01)] = MANGA_LONGA
    r[braco & (ax >= pulso - 0.01)] = MAO
    r[tronco & (y >= quadril - 0.015) & (y < quadril + 0.03)] = CINTO
    r[tronco & (y >= 0.15) & (y < quadril - 0.015)] = CALCA
    r[tronco & (y < 0.15)] = SAPATO
    return r


def mapa_regioes(g, b, malha, arq, mulher):
    J = juntas(g)
    pr = g['meshes'][malha]['primitives'][0]
    P = ler_acessor(g, b, pr['attributes']['POSITION']); UV = ler_acessor(g, b, pr['attributes']['TEXCOORD_0']); IDX = ler_acessor(g, b, pr['indices']).reshape(-1, 3)
    N = TAM; out = np.full((N, N), 255, np.uint8)          # 255 = fora do corpo
    uv = UV * N
    for t in IDX:
        a, bb, c = uv[t[0]], uv[t[1]], uv[t[2]]
        x0, y0 = np.floor(np.minimum(np.minimum(a, bb), c) - 2).astype(int); x1, y1 = np.ceil(np.maximum(np.maximum(a, bb), c) + 2).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, N - 1), min(y1, N - 1)
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        d = (bb[1] - c[1]) * (a[0] - c[0]) + (c[0] - bb[0]) * (a[1] - c[1])
        if abs(d) < 1e-9: continue
        w0 = ((bb[1] - c[1]) * (gx - c[0]) + (c[0] - bb[0]) * (gy - c[1])) / d
        w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / d
        w2 = 1 - w0 - w1
        tol = 1.5 / max(abs(d) ** 0.5, 1)
        m = (w0 >= -tol) & (w1 >= -tol) & (w2 >= -tol)
        if not m.any(): continue
        W = np.clip(np.stack([w0[m], w1[m], w2[m]], 1), 0, None); W /= W.sum(1, keepdims=True)
        pos = W[:, :1] * P[t[0]] + W[:, 1:2] * P[t[1]] + W[:, 2:] * P[t[2]]
        out[(gy[m] - 0.5).astype(int), (gx[m] - 0.5).astype(int)] = regioes(pos, J, mulher) * 20   # 0, 20, 40... (fácil de ler no jogo)
    Image.fromarray(out, 'L').save(SAIDA / arq, optimize=True)
    print(f'  js/modelos/{arq}')


print('Montando os personagens...')
gm, bm = montar_mulher()
montar_cabelos()
gh = json.loads((CORPOS / 'Superhero_Male_FullBody.gltf').read_text()); bh = (CORPOS / gh['buffers'][0]['uri']).read_bytes()
mapa_regioes(gh, bh, 2, 'regioes_homem.png', False)
mapa_regioes(gm, bm, 2, 'regioes_mulher.png', True)
Image.open(CORPOS / 'T_Superhero_Male_Dark.png').resize((TAM, TAM), Image.LANCZOS).convert('RGB').save(SAIDA / 'pele_homem.jpg', quality=88)
print('  js/modelos/pele_homem.jpg')
print('Pronto!')

# =====================================================================
#  MONTAR O PACOTE DE NATUREZA  (rode com:  python scripts/montar-natureza.py)
#  Pega os modelos escolhidos do "Stylized Nature MegaKit" (Quaternius, CC0)
#  e junta todos num ÚNICO arquivo leve: js/modelos/natureza.glb
#   - cada modelo vira um "nó" com o nome do arquivo (ex.: CommonTree_1)
#   - texturas diminuídas (2048 px -> 512 px) para o jogo ficar leve
#   - tira o COLOR_0 dos modelos (no pacote original é uma "máscara de vento"
#     do motor Unity/Unreal, não é cor; aqui só deixaria tudo escuro)
#  Só precisa rodar de novo se mudar a lista de MODELOS ou de TEXTURAS.
# =====================================================================
import io, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / 'Stylized Nature MegaKit[Standard]' / 'glTF'
SAIDA = RAIZ / 'js' / 'modelos' / 'natureza.glb'

# Modelos usados no jogo
MODELOS = [
    'CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5',   # árvores da mata
    'TwistedTree_3',                                                                   # árvore torta (cerrado)
    'DeadTree_2',                                                                      # árvore morta (perto do esgoto)
    'Bush_Common', 'Bush_Common_Flowers',                                              # arbustos
    'Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3',                                 # pedras
    'Fern_1', 'Plant_1_Big', 'Plant_7_Big', 'Clover_2',                                # plantas baixas
    'Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single',          # flores
    'Mushroom_Common', 'Mushroom_Laetiporus',                                          # cogumelos
    'Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Square_1', 'Pebble_Square_2',   # pedrinhas
    'Grass_Wispy_Tall',                                                                # capim alto (margem do lago)
]

# Texturas: tamanho final e formato (jpg = sem transparência, mais leve; png = com recorte das folhas)
TEXTURAS = {
    'Bark_NormalTree.png':      (512, 'jpg'),
    'Bark_TwistedTree.png':     (512, 'jpg'),
    'Bark_DeadTree.png':        (512, 'jpg'),
    'Leaves_NormalTree_C.png':  (512, 'png'),
    'Leaves_TwistedTree_C.png': (512, 'png'),
    'Leaves.png':               (1024, 'png'),
    'Flowers.png':              (512, 'png'),
    'Mushrooms.png':            (256, 'jpg'),
    'PathRocks_Diffuse.png':    (256, 'jpg'),
    'Rocks_Diffuse.png':        (512, 'jpg'),
    'Grass.png':                (256, 'png'),
}

# Texturas repintadas (a cor original não combina com a mata brasileira):
#   nome novo -> (imagem original, o que fazer)
#   'ipe'   = folhas vermelhas viram AMARELAS (a árvore torta vira um ipê-amarelo, do cerrado)
#   'verde' = folhas vermelhas viram verdes (arbusto)
#   'sem_roxo' = folhas roxas e azuis do atlas viram verdes
REPINTAR = {
    'Folhas_Ipe.png':     ('Leaves_TwistedTree_C.png', 'ipe'),
    'Folhas_Arbusto.png': ('Leaves_TwistedTree_C.png', 'verde'),
    'Leaves.png':         ('Leaves.png', 'sem_roxo'),
}
TEXTURAS['Folhas_Ipe.png'] = (512, 'png')
TEXTURAS['Folhas_Arbusto.png'] = (512, 'png')
# Qual modelo usa qual textura repintada: (modelo, material original) -> textura nova
TROCAS = {
    ('TwistedTree_3', 'Leaves_TwistedTree'): 'Folhas_Ipe.png',
    ('Bush_Common', 'Leaves_TwistedTree'): 'Folhas_Arbusto.png',
}


def repintar(im, modo):
    """Muda a cor das folhas mantendo o desenho (claro/escuro) e o recorte (transparência)."""
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb, alfa = a[..., :3], a[..., 3:]
    if modo in ('ipe', 'verde'):
        lum = rgb.mean(axis=2, keepdims=True)
        media = lum[alfa[..., 0] > 128].mean()
        alvo = np.array([242, 196, 48] if modo == 'ipe' else [88, 132, 40], np.float32)
        rgb = np.clip(alvo * (0.75 + 0.25 * lum / media), 0, 255)
    elif modo == 'sem_roxo':
        hsv = np.asarray(im.convert('RGB').convert('HSV')).astype(np.float32)
        h = hsv[..., 0]
        roxo = (h > 142) & (h < 215) & (hsv[..., 1] > 60)        # tons de azul a roxo
        h[roxo] = 70                                               # vira verde
        hsv[..., 0] = h
        rgb = np.asarray(Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)
    return Image.fromarray(np.concatenate([rgb, alfa], axis=2).astype(np.uint8), 'RGBA')


TIPOS = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8, 5122: np.int16, 5120: np.int8}
COMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

binario = bytearray()      # o "bin" único do pacote
saida = {'asset': {'version': '2.0', 'generator': 'montar-natureza.py'}, 'scene': 0,
         'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [], 'accessors': [], 'bufferViews': [],
         'materials': [], 'textures': [], 'images': [], 'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}]}
materiais = {}             # nome do material -> índice no pacote
imagens = {}               # nome da imagem -> índice da textura no pacote


def anexar(dados, alvo=None):
    """Põe bytes no fim do bin (alinhado de 4 em 4) e cria um bufferView."""
    while len(binario) % 4: binario.append(0)
    bv = {'buffer': 0, 'byteOffset': len(binario), 'byteLength': len(dados)}
    if alvo: bv['target'] = alvo
    binario.extend(dados)
    saida['bufferViews'].append(bv)
    return len(saida['bufferViews']) - 1


def textura(uri):
    """Diminui a imagem e coloca no pacote (uma vez só, mesmo se vários modelos usam)."""
    if uri in imagens: return imagens[uri]
    tam, fmt = TEXTURAS[uri]
    if uri in REPINTAR:
        orig, modo = REPINTAR[uri]
        im = repintar(Image.open(PASTA / orig), modo)
    else:
        im = Image.open(PASTA / uri)
    im = im.resize((tam, tam), Image.LANCZOS)
    buf = io.BytesIO()
    if fmt == 'jpg': im.convert('RGB').save(buf, 'JPEG', quality=85); mime = 'image/jpeg'
    else: im.convert('RGBA').save(buf, 'PNG', optimize=True); mime = 'image/png'
    saida['images'].append({'bufferView': anexar(buf.getvalue()), 'mimeType': mime, 'name': uri})
    saida['textures'].append({'sampler': 0, 'source': len(saida['images']) - 1})
    imagens[uri] = len(saida['textures']) - 1
    return imagens[uri]


def copiar_acessor(g, b, i, alvo):
    """Copia um acessor (posições, normais, uv ou índices) para o pacote, sem 'stride'."""
    a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]
    tipo, n, c = TIPOS[a['componentType']], a['count'], COMP[a['type']]
    passo = bv.get('byteStride', np.dtype(tipo).itemsize * c)
    ini = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    linhas = [np.frombuffer(b, dtype=tipo, count=c, offset=ini + k * passo) for k in range(n)] if passo != np.dtype(tipo).itemsize * c \
        else [np.frombuffer(b, dtype=tipo, count=n * c, offset=ini)]
    arr = np.concatenate(linhas)
    novo = {k: v for k, v in a.items() if k not in ('bufferView', 'byteOffset')}
    novo['bufferView'] = anexar(arr.tobytes(), alvo)
    saida['accessors'].append(novo)
    return len(saida['accessors']) - 1


def material(g, i, modelo):
    m = g['materials'][i]
    uri = g['images'][g['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]['uri']
    nome = m['name']
    if (modelo, nome) in TROCAS:                     # este modelo usa uma textura repintada
        uri = TROCAS[(modelo, nome)]; nome = uri.replace('.png', '')
    if nome in materiais: return materiais[nome]
    novo = {'name': nome, 'doubleSided': m.get('doubleSided', False),
            'pbrMetallicRoughness': {'baseColorTexture': {'index': textura(uri)}, 'metallicFactor': 0, 'roughnessFactor': 0.9}}
    # casca e pedra: opacas (mais leve); folhas, flores e capim: recorte pela transparência
    if TEXTURAS[uri][1] == 'png':
        novo['alphaMode'] = 'MASK'; novo['alphaCutoff'] = 0.4
    else:
        novo['doubleSided'] = False
    saida['materials'].append(novo)
    materiais[nome] = len(saida['materials']) - 1
    return materiais[nome]


for nome in MODELOS:
    g = json.loads((PASTA / f'{nome}.gltf').read_text())
    b = (PASTA / g['buffers'][0]['uri']).read_bytes()
    prims = []
    for malha in g['meshes']:
        for p in malha['primitives']:
            attrs = {k: copiar_acessor(g, b, v, 34962) for k, v in p['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0')}
            novo = {'attributes': attrs, 'material': material(g, p['material'], nome)}
            if 'indices' in p: novo['indices'] = copiar_acessor(g, b, p['indices'], 34963)
            prims.append(novo)
    saida['meshes'].append({'name': nome, 'primitives': prims})
    saida['nodes'].append({'name': nome, 'mesh': len(saida['meshes']) - 1})
    saida['scenes'][0]['nodes'].append(len(saida['nodes']) - 1)

while len(binario) % 4: binario.append(0)
saida['buffers'] = [{'byteLength': len(binario)}]
js = json.dumps(saida, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binario))
glb += struct.pack('<II', len(js), 0x4E4F534A) + js
glb += struct.pack('<II', len(binario), 0x004E4942) + bytes(binario)
SAIDA.write_bytes(glb)
print(f'Pronto: {SAIDA.relative_to(RAIZ)}  ({len(glb) / 1e6:.2f} MB, {len(MODELOS)} modelos, {len(imagens)} texturas)')

# Script que pintou a roupa e a barba do Biólogo na textura do corpo da Quaternius (Superhero_Male).
# Precisa dos arquivos originais do pacote (Superhero_Male_FullBody.gltf/.bin e T_Superhero_Male_Dark).
# Rodar com: python3 pintar-roupa-biologo.py (gera T_Biologo_Cor.png). Ver js/modelos/LEIA-ME.md.
# lê posições, uv e índices da malha do corpo (mesh 2) do .gltf
import json, numpy as np
j = json.load(open('male.gltf')); buf = open('Superhero_Male_FullBody.bin','rb').read()
def acc(i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
    n = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    dt = {5126: np.float32, 5123: np.uint16, 5121: np.uint8, 5125: np.uint32}[a['componentType']]
    off = bv.get('byteOffset',0) + a.get('byteOffset',0)
    return np.frombuffer(buf, dt, a['count']*n, off).reshape(a['count'], n) if n>1 else np.frombuffer(buf, dt, a['count'], off)
p = j['meshes'][2]['primitives'][0]
P = acc(p['attributes']['POSITION']); UV = acc(p['attributes']['TEXCOORD_0']); IDX = acc(p['indices']).reshape(-1,3)
# Pinta a roupa do Biólogo na textura de pele do corpo Quaternius.
# Para cada pixel de cada triângulo (no mapa UV), descobre onde ele fica no corpo (posição 3D)
# e decide: pele, camiseta, cinto, calça, bolso ou bota.
import numpy as np
from PIL import Image
I = '/tmp/claude-0/-home-user-estacao-bioma/98755bcc-4413-5298-9586-a5831a7ee217/images/'
N = 2048
base = np.asarray(Image.open(I + '9.webp').convert('RGB').resize((N, N), Image.LANCZOS)).astype(np.float32)
lum = base.mean(2)
out = base.copy()
def hexc(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], np.float32)
COR = {6: hexc('#2a1d14'), 1: hexc('#1f2226'), 2: hexc('#3b2a1f'), 3: hexc('#6d6a3a'), 4: hexc('#5c5930'), 5: hexc('#3b2a1f')}
# 1 camiseta, 2 cinto, 3 calça, 4 bolso, 5 bota
def regiao(x, y, z):
    ax = np.abs(x); r = np.zeros_like(x, np.int8)
    braco = (ax > 0.215) & (y > 1.25)
    r[braco & (ax < 0.37)] = 1                                     # manga curta
    tronco = ~braco
    gola = 1.53 + np.clip(ax - 0.06, 0, None) * 1.6 - 0.012 * (z > 0.04)   # a gola sobe para cobrir os ombros
    r[tronco & (y >= 1.02) & (y < gola)] = 1                       # camiseta (gola um pouco mais baixa na frente)
    r[tronco & (y >= 0.975) & (y < 1.02)] = 2                      # cinto
    r[tronco & (y >= 0.17) & (y < 0.975)] = 3                      # calça
    r[tronco & (y >= 0.55) & (y < 0.74) & (ax > 0.11) & (np.abs(z) < 0.06)] = 4   # bolso lateral (cargo)
    r[tronco & (y < 0.22)] = 5                                     # bota
    # barba: queixo, bochechas e bigode (deixa a boca de fora) + costeletas perto das orelhas
    barba = (y > 1.572) & (y < 1.646) & (z > -0.02) & (ax < 0.1)
    barba |= (y >= 1.646) & (y < 1.70) & (ax > 0.06) & (ax < 0.1) & (z > -0.045) & (z < 0.06)
    boca = (ax < 0.03) & (y > 1.611) & (y < 1.637) & (z > 0.072)
    r[barba & ~boca] = 6
    return r
uv = UV * N
for t in IDX:
    a, b, c = uv[t[0]], uv[t[1]], uv[t[2]]
    x0, y0 = np.floor(np.minimum(np.minimum(a, b), c) - 2).astype(int)
    x1, y1 = np.ceil(np.maximum(np.maximum(a, b), c) + 2).astype(int)
    x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, N - 1), min(y1, N - 1)
    if x1 < x0 or y1 < y0: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if abs(d) < 1e-9: continue
    w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / d
    w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / d
    w2 = 1 - w0 - w1
    # aceita 1,5 pixel além da borda (evita linhas de pele nas costuras)
    tol = 1.5 / max(np.abs(d) ** 0.5, 1)
    m = (w0 >= -tol) & (w1 >= -tol) & (w2 >= -tol)
    if not m.any(): continue
    pa, pb, pc = P[t[0]], P[t[1]], P[t[2]]
    W = np.clip(np.stack([w0[m], w1[m], w2[m]], 1), 0, None); W /= W.sum(1, keepdims=True)
    pos = W[:, :1] * pa + W[:, 1:2] * pb + W[:, 2:] * pc
    reg = regiao(pos[:, 0], pos[:, 1], pos[:, 2])
    ys, xs = (gy[m] - 0.5).astype(int), (gx[m] - 0.5).astype(int)
    for k, cor in COR.items():
        s = reg == k
        if not s.any(): continue
        # leve sombreado vindo da pele original (sem "pintar músculos" demais)
        f = np.clip(1 + 0.35 * (lum[ys[s], xs[s]] / 150.0 - 1), 0.75, 1.15)[:, None]
        out[ys[s], xs[s]] = cor * f
    # pele: deixa um pouco mais morena (cor da ficha)
    s = reg == 0
    out[ys[s], xs[s]] = base[ys[s], xs[s]] * np.array([0.93, 0.86, 0.8])
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS).save('T_Biologo_Cor.png')
print('ok')

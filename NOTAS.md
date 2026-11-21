# NOTAS — Estação Bioma

Atualizado em 21/11/2026. Leia este arquivo no começo de cada conversa nova.

## O que já está pronto

**Mundo**
- Floresta com ~1100 árvores, grama que balança, flores, nuvens e céu.
- Personagem (pesquisador de campo) com câmera em 3ª pessoa, correr (Shift) e pular.
- Controles no PC (WASD + mouse) e no celular (joystick na tela).
- Minimapa com a distância até o lago e até o lab, e com o objetivo atual.

**Laboratório "Estação Bioma"**
- Prédio de 40 × 22 m com fachada de vidro, marquise com jardim, painéis solares e letreiro.
- Portas de correr estilo hospital: abrem com a tecla E (ou fecham sozinhas ao se afastar), com LED e som.
- Interior com 3 zonas (Química, Amostras, Microscopia), bancadas com equipamentos, balcão e Mural de Missões.

**Lago eutrofizado** (a ~100 m do lab)
- Água verde com algas, peixes mortos, bolhas, taboas e buritis.
- Píer com ponto de coleta, cano de esgoto, sacos de adubo e placas informativas.
- O lago muda de visual conforme a restauração (água azul, algas somem, peixes vivos pulando).

**Missão "Salvar o Lago da Mata"** (completa, do início ao fim)
1. Campo: disco de Secchi, sonda (oxigênio, pH, temperatura) e frasco de coleta (amostra estraga em 3 min).
2. Laboratório: coliformes (estufa de 25 s), microscópio (foco + 3 cianobactérias) e testes de fósforo e nitrogênio.
3. Diagnóstico no mural (esgoto + adubo).
4. Restauração: biofiltro, 6 mudas de mata ciliar e aerador solar.
5. Medir de novo e ver a tela de vitória com antes e depois.

Ajudas ao jogador: marcador amarelo, lista de objetivos, falas da Dra. Iara, caderno de campo (tecla C).

## O que falta

**Para testar primeiro**
- [ ] Jogar a missão inteira de verdade, do início ao fim (só testei as telas separadas).
- [ ] Conferir o disco de Secchi com o mouse: no teste automático ele não respondeu, e já ajustei o código.
- [ ] Testar no celular/tablet (controles de toque, tamanho dos painéis).

**Próximos passos sugeridos**
- [ ] Separar o `index.html` em arquivos menores (mundo, lab, lago, missão) para ficar mais fácil de mexer.
- [ ] Salvar o progresso (localStorage), para o aluno não perder a missão ao fechar.
- [ ] Trocar os objetos de formas simples por modelos 3D (.glb), para chegar mais perto do visual de Palworld.
- [ ] NPCs na floresta com novas missões (o mural do lab já está pronto para receber).
- [ ] Mais equipamentos no laboratório: espectrofotômetro (metais pesados) e medidor de condutividade.
- [ ] Novos cenários com outros problemas (rio com metais pesados, área desmatada).
- [ ] Perguntas/quiz ligados ao conteúdo de Ciências para uso em sala.

## Observações
- Código comentado em português, explicando para iniciante.
- Antes de mudanças grandes, explicar o plano e pedir confirmação.
- Detalhes técnicos (mapa, estado da missão `Q`, `stage()`) estão no `CLAUDE.md`.

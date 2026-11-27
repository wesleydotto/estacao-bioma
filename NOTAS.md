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
- [ ] Novos cenários com outros problemas: o primeiro já pensado é o **garimpo abandonado** (mercúrio), descrito mais abaixo; falta decidir a mitigação.
- [ ] Perguntas/quiz ligados ao conteúdo de Ciências para uso em sala.

## Ideia futura: pack de expansão "Soro antiofídico" (NÃO fazer ainda)

Só desbloqueia depois da missão do lago. Ideia do Wesley, ainda em fase de conversa.

**Conceito:** o laboratório passa a produzir soro contra picada de cobra. Os cavalos produzem os anticorpos e também servem de transporte para longas distâncias no mapa. Chamados de emergência aparecem no mapa.

**Fluxo da missão**
1. Chamado aparece no mapa (com timer).
2. Ir até o local (de cavalo) e encontrar a vítima.
3. Levar a vítima ao ambulatório do laboratório.
4. Conversar com a vítima: ela dá a dica da cor da cobra que picou.
5. Voltar ao local e identificar a cobra certa entre várias de cores diferentes.
6. Coletar a cobra e extrair o veneno.
7. Produzir o soro no laboratório.
8. Aplicar a injeção na vítima.

**Ciência (para acertar no jogo)**
- O soro não vem direto do veneno: o veneno vai em doses pequenas no cavalo, o cavalo produz anticorpos, e do sangue dele se purifica o soro. Mostrar a cadeia veneno → cavalo → anticorpos → soro.
- Cada tipo de cobra tem soro próprio (jararaca, cascavel, surucucu, coral). Acertar a cobra importa.
- Cobras parecidas como pegadinha (falsa-coral x coral verdadeira). A cor sozinha nem sempre identifica na vida real, então usar o desenho (anéis, losangos) como segunda pista.
- Segurança: ensinar o que fazer de verdade (manter a vítima calma, levar logo ao hospital, não cortar nem chupar a picada). A coleta da cobra aparece como trabalho de equipe treinada, sem incentivar aluno a capturar cobra.

**Regras decididas**
- Timer da vítima: se acabar, a vítima piora e o jogador tenta de novo. Não há morte na tela.
- Tentar de novo reduz a recompensa: estrelas de 1 a 3, e cada nova tentativa tira 1 estrela do máximo.
- Estrelas pelo tempo que sobrou e por acertar o soro de primeira.
- Soro errado gasta tempo e material (o soro usado se perde).
- Estrelas podem liberar itens do pack (novos cavalos, novos tipos de soro).

**Ideias em aberto**
- Preparar soro antes do chamado: o jogador mantém um estoque e escolhe quais soros produzir, para o chamado ser urgência de verdade.
- Timer em etapas: um relógio geral da vítima e timers menores dentro de cada etapa.
- Primeira versão enxuta: 2 tipos de cobra e 1 cavalo; o resto fica para depois.
- Precisa de: estábulo/cavalos (e montaria), ambulatório, NPC da vítima, cobras e telas de laboratório novas.

## Ideia futura: missão "Garimpo abandonado" (mercúrio e biomagnificação) (NÃO fazer ainda)

Haverá outros lagos e outros problemas no mapa. O primeiro novo problema é um garimpo abandonado perto de um lago. Ideia do Wesley, ainda em fase de conversa.

**Conceito:** peixes morrendo ou estranhos num lago perto do garimpo. Pode ser eutrofização ou biomagnificação de metal, e o jogador precisa descobrir qual. O momento de "descartar a hipótese" é o ponto forte: ele testa a água, vê que está boa, e só então o problema real aparece.

**Fluxo da missão**
1. Chamado: peixes morrendo no lago do garimpo.
2. Coletar água e testar. Resultado: a água está normal, então **não é eutrofização**.
3. Um NPC **liga no celular do jogador** e pede para pegar uma vara de pesca, que cai no depósito.
4. Pescar peixes (de espécies diferentes, para comparar).
5. Cortar o peixe em local apropriado (estilizado, só uma amostra do músculo, sem cena pesada para os alunos).
6. Passar a amostra no identificador de metais (analisador portátil).
7. O resultado vem como **sigla** (ex.: Hg). O aluno procura o elemento na **tabela periódica em 3D na mão do personagem**.
8. Enviar o relatório e seguir para o procedimento de mitigação (ainda não definido).

**Mecânicas decididas**
- O analisador mostra **vários símbolos** (ex.: Fe e Al, que são normais no sedimento). O aluno compara com o valor de referência e acha o que está fora do normal (ex.: Hg).
- A tabela periódica fica completa à mostra desde o início; cada elemento descoberto ganha uma **ficha** (nome, número atômico, onde aparece, risco). Ex.: Hg é líquido à temperatura ambiente e era usado no garimpo para juntar o ouro.
- O **relatório** é um formulário curto: qual metal, em qual peixe estava mais alto, de onde veio, qual o risco. O jogador só avança depois de enviar.
- Minigame de **biomagnificação**: coletar de vários degraus (sedimento → plâncton → peixe pequeno → peixe predador como tucunaré, traíra, piranha) e ver o número subindo.

**Ciência (para acertar no jogo)**
- O mercúrio fica no **sedimento**, por isso a água pode dar normal.
- Mercúrio costuma contaminar aos poucos, e não causar mortandade em massa. Mortandade em massa é mais típica de falta de oxigênio ou eutrofização. Dois jeitos de tratar isso no jogo: (a) trocar o alerta para "peixes estranhos e ribeirinhos passando mal depois de comer peixe", ou (b) manter a mortandade, só que vinda de outra causa (a pista falsa que a água revela). **Escolher um dos dois.**

**PENDENTE — procedimento de mitigação (decidir depois)**
O Wesley quer algo que ajude **na realidade** (placa de aviso para peixe foi descartada, por ser fraca e irreal). Mercúrio não some: o foco real é impedir que continue chegando e entrando na cadeia. Opções reais já levantadas:
- *Na área do garimpo:* conter o rejeito e estabilizar o terreno (passo nº 1); recuperar a vegetação da área degradada (menos sedimento chega ao lago); capear o sedimento do fundo com material limpo (argila ou areia, às vezes com manta); adicionar carvão ativado ou biochar ao sedimento (prende o mercúrio e reduz o metilmercúrio); monitorar água, sedimento e peixes ao longo dos anos.
- *Erros possíveis (pegadinhas):* dragar o fundo (levanta o mercúrio de novo); criar área alagada/wetland (pode favorecer a formação de metilmercúrio, ao contrário do que funciona para esgoto).
- *Com as pessoas:* exames de mercúrio nos moradores (feitos no cabelo) e atendimento de saúde; alternativa de alimento, como tanques de criação de peixe em água limpa, para a comunidade não depender do peixe contaminado.
- *Ideia de estrutura:* duas frentes que valem pontos separados, a ambiental (área do garimpo) e a social (comunidade); o jogador só fecha a missão fazendo as duas.

**Ideias em aberto**
- Só mercúrio na primeira versão, ou já outros metais? (Wesley ainda não respondeu.)
- A estrutura é a mesma da missão do lago (investigar, descartar, analisar, diagnosticar, agir, medir de novo), então boa parte do código pode ser reaproveitada.
- Precisa de: novo lago e garimpo no mapa, NPC com ligação de celular, item vara de pesca, minigame de pesca, bancada de preparo do peixe, analisador de metais, tabela periódica 3D, tela de relatório.

## Observações
- Código comentado em português, explicando para iniciante.
- Antes de mudanças grandes, explicar o plano e pedir confirmação.
- Detalhes técnicos (mapa, estado da missão `Q`, `stage()`) estão no `CLAUDE.md`.

# Plano de ação: novas missões da Estação Bioma

Todas as missões seguem o mesmo ciclo do Lago da Mata, que já funciona bem:
**pista → medir no campo → analisar no laboratório → diagnóstico no mural → agir → medir de novo**.
Assim o aluno aprende o *método científico* jogando, e a gente reaproveita muito código.

Tamanho: **P** = poucos dias · **M** = uma ou duas semanas · **G** = mais que isso (precisa de área nova no mapa ou muitos modelos).

---

## Fase 0: base para várias missões ✔ PRONTA

Hoje o jogo só tem uma missão, e ela está "costurada" no código. Antes de criar outras:

| # | Tarefa | Por quê |
|---|--------|---------|
| 0.1 | **Sistema de missões**: cada missão num arquivo (`js/missoes/lago.js`, `js/missoes/clima.js`…) com estado próprio, etapas, falas e interações | Criar uma missão nova vira "copiar um modelo e preencher" |
| 0.2 | **Mural de missões de verdade**: lista as missões disponíveis, em andamento e concluídas | O mural já existe no lab, mas está vazio |
| 0.3 | **NPCs simples** (personagem parado que conversa com E) | Quase toda missão nova começa com alguém pedindo ajuda |
| 0.4 | **Salvar progresso** (localStorage) | Aula tem 50 min; o aluno precisa continuar depois |
| 0.5 | **Caderno de campo por missão** (tecla C) | Cada missão tem a sua tabela de resultados |

---

## Fase 1: Economia e construção · **M**

Base para o jogador **ganhar verba, comprar e construir**. As missões seguintes usam isso.

| # | Tarefa | Como funciona |
|---|--------|---------------|
| 1.1 | **Verba (R$)** | Valor sempre visível na tela. Cada missão concluída gera um **relatório para a prefeitura**, que paga a verba. O Lago da Mata vira a primeira verba. |
| 1.2 | **Prédio da prefeitura** | Prédio novo perto da praça, com um NPC (secretária ou secretário de Meio Ambiente) que recebe os relatórios, paga a verba e vende os itens. |
| 1.3 | **Lojinha** | Lista de itens com preço: mudas nativas, sementes de adubação verde, placa solar, cata-vento, reagentes e ferramentas (pá, regador). Mostra quanto sobra de verba depois da compra (treina matemática). |
| 1.4 | **Inventário (tecla I)** | Grade com os itens e as quantidades. Salva junto com o progresso. |
| 1.5 | **Construir** | Escolher um item do inventário e colocar no mundo, **só em lugares marcados** no começo (ex.: covas de muda, base de painel). Construção livre fica para depois. |

---

## Missão 2: "De onde veio o adubo?" (Monocultura e solo) · **M/G** ✔ PRONTA

> Feita (veja o `HISTORICO.md`). Mudanças em relação ao plano abaixo: equipamentos pagos na loja (kit de infiltração, lupa, balança com estufa, sonda), adiantamentos de verba por etapa, relatório com estrelas, 30 dias de espera antes de medir de novo. Texto original do plano:


- **Conteúdo / BNCC:** impactos nos ecossistemas (EF07CI07, EF07CI08) e ações para recuperar o equilíbrio ambiental (EF08CI16). O tema solo também aparece em Geografia do 6º ano.
- **Onde:** uma fazenda de monocultura (soja) depois da mata, ao norte do lago. Os sacos de adubo ficam no caminho, e a chuva leva o adubo até o lago.
- **Gancho:** continua a história do lago. Os sacos tinham a marca de uma fazenda. Quem jogou aquilo ali, e por que precisam de tanto adubo?
- **Etapas:**
  1. Seguir a trilha dos sacos até a fazenda e conversar com o fazendeiro (NPC). Ele não é vilão: o solo dele "não dá mais nada sem adubo".
  2. **Campo:** comparar o solo da mata com o solo da lavoura (contar minhocas, ver a cor e a matéria orgânica, teste de infiltração com uma garrafa de água) e contar insetos nas duas áreas.
  3. **Lab:** analisar as amostras de solo (matéria orgânica e nutrientes). O solo da lavoura está pobre e compactado.
  4. **Diagnóstico:** cortaram a mata → o solo ficou sem proteção e sem matéria orgânica → precisa de muito adubo → a chuva leva o adubo pro lago.
  5. **Convencer o fazendeiro com dados:** mostrar a tabela mata × lavoura.
  6. **Ação (com a verba e a loja):** faixa de mata entre a lavoura e o lago, adubação verde, curvas de nível e um trecho de agrofloresta.
  7. **Medir de novo:** a infiltração e as minhocas melhoram, e o fazendeiro gasta menos adubo.
- **Minigames novos:** contar minhocas num torrão de terra, teste de infiltração (cronômetro), contagem de insetos e uma "conversa com argumentos" (escolher o dado certo pra convencer).
- **Reaproveita:** kit de campo, mudas da mata ciliar, mural, primeiro NPC visível, loja e construção.

## Missão 3: "Energia limpa para o laboratório" · **M**

- **Conteúdo / BNCC:** fontes renováveis e não renováveis (EF08CI01), circuitos (EF08CI02), consumo dos aparelhos (EF08CI04) e uso consciente (EF08CI05).
- **Onde:** dentro do lab, no telhado (os painéis já existem) e em volta do prédio.
- **Gancho:** a energia cai toda tarde, e a estufa desliga no meio do teste de coliformes.
- **Etapas:**
  1. Ler o medidor e listar a potência de cada aparelho (geladeira, estufa, microscópio, ar-condicionado).
  2. Calcular o consumo (potência × horas) e comparar com o que os painéis geram. Não dá!
  3. Pesquisar as fontes limpas e comparar no mural:
     - solar (já tem, mas pouca e suja);
     - eólica (usar os dados do anemômetro);
     - biodigestor (esterco e restos da fazenda viram biogás, ligando com a Missão 2);
     - micro-hidrelétrica (precisa de rio).
  4. **Ação (com a verba):** limpar os painéis, comprar e construir as novas fontes, montar o circuito e instalar um timer no ar-condicionado.
  5. **Medir de novo:** sobra energia.
- **Minigames novos:** montar um circuito (série e paralelo), uma calculadora de consumo e uma tabela de prós e contras de cada fonte.
- **Reaproveita:** loja e construção, telhado, aparelhos do lab, anemômetro.

## Missão 4: "Vai chover?" (Estação Meteorológica) · **P/M**

- **Conteúdo / BNCC:** variáveis do tempo e previsão (EF08CI15), clima e circulação do ar (EF08CI14).
- **Onde:** no telhado do laboratório. O mastro com anemômetro **já existe**, e dá pra adicionar uma escada.
- **Gancho:** a Dra. Iara precisa saber se vai chover forte, porque a chuva leva adubo pro lago.
- **Etapas:**
  1. Ler os instrumentos: termômetro, higrômetro (umidade), barômetro (pressão), anemômetro (vento) e pluviômetro.
  2. Anotar as leituras de 3 "dias" (o tempo do jogo acelera).
  3. No mural, montar o gráfico e prever: pressão caindo + umidade subindo = chuva.
  4. Ação: fechar as comportas e cobrir os canteiros antes da tempestade.
  5. Chuva de verdade no jogo (partículas): o aluno confere se a previsão acertou.
- **Minigames novos:** ler um ponteiro (barômetro), montar um gráfico de linha simples.
- **Reaproveita:** painéis, mural, sonda (parecida com a leitura de instrumentos), telhado do lab.
- **Bônus:** a chuva vira um sistema do jogo e pode aparecer em outras missões.

## Missão 5: "Surto na Vila" (Água e saúde) · **M**

- **Conteúdo / BNCC:** saneamento básico e doenças de veiculação hídrica (EF07CI09), vacinação e saúde pública (EF07CI10).
- **Onde:** uma vila pequena ao sul do laboratório (z ≈ -80), com 4 casas, um poço e uma fossa.
- **Gancho:** várias crianças da vila estão com diarreia. Um NPC (agente de saúde) pede ajuda.
- **Etapas:**
  1. Entrevistar os moradores: quem adoeceu e de onde vem a água de cada casa (mapa de casos).
  2. Coletar a água do poço, da torneira e do rio.
  3. No lab, fazer o teste de coliformes (**já existe**) em cada amostra e comparar.
  4. Diagnóstico: o poço fica perto demais da fossa (o esgoto infiltra no solo).
  5. Ação: mudar a fossa de lugar, clorar a água e montar um cartaz de orientação.
  6. Medir de novo: a água fica sem coliformes, e o número de casos cai.
- **Minigames novos:** mapa de casos (o aluno descobre o padrão), dosar o cloro.
- **Reaproveita:** coliformes, estufa, frasco de coleta, mural, diálogos.
- **Bônus:** é a primeira missão com NPCs, então usa a vila perto da prefeitura.

## Missão 6: "Quem passa à noite?" (Censo de fauna) · **M/G**

- **Conteúdo / BNCC:** ecossistemas brasileiros e as relações entre os seres vivos (EF07CI07), impacto de mudanças no ecossistema (EF07CI08).
- **Onde:** na floresta a oeste, longe da trilha.
- **Gancho:** sumiram os sapos do lago. Será que algum predador aumentou, ou o problema foi o lago poluído?
- **Etapas:**
  1. Instalar 4 armadilhas fotográficas (o aluno escolhe onde: perto da água, na trilha, na mata fechada).
  2. Passar uma noite no jogo (o céu escurece) e recolher as fotos.
  3. No lab, identificar os animais com um guia de campo (como o bestiário do microscópio).
  4. No mural, montar a teia alimentar ligando quem come quem.
  5. Diagnóstico: com o lago doente, os insetos diminuíram, e os sapos perderam comida.
  6. Ação: corredor de mata ligando os fragmentos de floresta.
- **Minigames novos:** escolher onde pôr cada armadilha, montar a teia alimentar arrastando cartões.
- **Reaproveita:** bestiário, mural, ciclo dia/noite (que pode ser criado na missão 4).
- **Atenção:** precisa de modelos de animais da fauna brasileira (lobo-guará, tamanduá, capivara, sapo, coruja…). Encaixa com a ideia de trocar por modelos `.glb`.

## Missão 7: "O barranco que desabou" (Rochas e fósseis) · **M**

- **Conteúdo / BNCC:** tipos de rocha e formação de fósseis (EF06CI12), camadas da Terra (EF06CI11).
- **Onde:** nos morros da borda do mapa (eles já existem no terreno).
- **Gancho:** uma chuva forte (ligação com a missão 4) derrubou um barranco e apareceram "pedras com desenhos".
- **Etapas:**
  1. Observar as camadas do barranco e coletar rochas de cada camada.
  2. No lab, classificar as rochas (ígnea, sedimentar ou metamórfica) pelos testes de dureza, textura e reação com ácido.
  3. Achar os fósseis e descobrir que eles só aparecem na rocha sedimentar.
  4. Mural: montar a "linha do tempo" das camadas (as de baixo são mais antigas).
  5. Ação: proteger o sítio e conter a erosão com plantas.
- **Minigames novos:** classificar as rochas, escavação cuidadosa (pincel).
- **Reaproveita:** bancadas do lab, mural, mudas.

---

## Missão 8: "O rio que mudou de cor" (Contaminação química) · **G**

- **Conteúdo / BNCC:** separação de misturas (EF06CI03), impacto humano no ambiente (EF07CI08) e ações para restaurar o equilíbrio (EF08CI16).
- **Onde:** um rio novo a leste (x ≈ +90), descendo dos morros, com um garimpo ou uma fábrica rio acima.
- **Gancho:** os peixes do rio estão com manchas, e a água ficou alaranjada.
- **Etapas:**
  1. Coletar amostras em 3 pontos: antes, junto e depois do garimpo (comparar é o coração do método científico).
  2. Medir a condutividade no campo (sonda nova).
  3. No lab, usar o **espectrofotômetro** (instrumento novo) para medir metais.
  4. Separar a mistura: decantação e filtração da lama.
  5. Diagnóstico: a contaminação começa no garimpo.
  6. Ação: bacia de decantação e replantio da margem.
- **Minigames novos:** espectrofotômetro (escolher a cor da luz e ler a absorção), montar decantação e filtração.
- **Reaproveita:** kit de campo, sonda, mural, mata ciliar (mudas), mudanças na cor da água.
- **Atenção:** precisa de um terreno novo (o leito do rio) e é a maior das missões. Fica por último.

### Missão do garimpo: mercúrio e biomagnificação (DECIDIDA em 27/11, vem antes da Missão 3)
**Decisões do Wesley (27/11):**
- **Missão separada** da Missão 8. O rio alaranjado e o espectrofotômetro ficam para depois (o rio pode nascer do mesmo garimpo).
- **Dois metais alterados**: o Hg e mais um **arsênio (As)** (confirmado pelo Wesley; aparece de verdade junto do ouro). Fe e Al aparecem normais. Boa lição: o Hg **biomagnifica** (sobe na cadeia) e o outro metal fica mais no sedimento.
- **Local:** a **leste**. Lago em ~(+110, +60) e garimpo abandonado rio acima, nos morros da borda (~x = +180), ligado por um córrego.
- **Mitigação** (o Wesley não tinha preferência, então ficou assim): duas frentes obrigatórias.
  *Ambiental:* conter o rejeito (barreira/bacia no garimpo) e replantar a área degradada.
  *Social:* exame de mercúrio no cabelo dos moradores e tanque de criação de peixe em água limpa.
  *Pegadinhas no mural:* dragar o fundo e criar wetland, com a explicação de por que pioram.

**Fatias:**
- **A — Cenário e chamado:** ✔ PRONTA (27/11). Lagoa Dourada, córrego, garimpo, casas ribeirinhas e a Dona Rosa. Coletar a água e testar no lab: dá normal, descarta a eutrofização. Nome da missão: **"O peixe que faz mal"**.
- **B — Peixe e metais:** ligação no celular, vara de pesca, minigame de pesca (3 espécies), bancada de preparo, analisador portátil, tabela periódica 3D com fichas, biomagnificação e relatório.
- **C — Mitigação e medir de novo:** as duas frentes, as pegadinhas, nova análise dos peixes e a tela de antes e depois.

#### Ideia original (do antigo NOTAS.md)
*Veio do antigo `NOTAS.md`. Ainda precisa ser **unida** com a versão acima (rio alaranjado, espectrofotômetro, 3 pontos de coleta) numa conversa com o Wesley: pode ser a mesma missão (o rio desce do garimpo e chega no lago) ou duas missões separadas.*

Haverá outros lagos e outros problemas no mapa. O primeiro novo problema é um garimpo abandonado perto de um lago. Ideia do Wesley, ainda em fase de conversa.

**Conceito:** peixes estranhos e moradores da beira do lago passando mal depois de comer peixe, num lago perto do garimpo. Pode ser eutrofização ou biomagnificação de metal, e o jogador precisa descobrir qual. O momento de "descartar a hipótese" é o ponto forte: ele testa a água, vê que está boa, e só então o problema real aparece.

**Fluxo da missão**
1. Chamado: **moradores da beira do lago passando mal depois de comer peixe, e alguns peixes estranhos** (decidido: opção (a), veja "Ciência").
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
- Mercúrio costuma contaminar aos poucos, e não causar mortandade em massa. Mortandade em massa é mais típica de falta de oxigênio ou eutrofização. Dois jeitos de tratar isso no jogo: (a) trocar o alerta para "peixes estranhos e ribeirinhos passando mal depois de comer peixe", ou (b) manter a mortandade, só que vinda de outra causa (a pista falsa que a água revela). **DECIDIDO (27/11): opção (a).** Bate com a ciência (o mercúrio age devagar, acumulando no peixe e em quem come) e com o roteiro (a água dá normal, então descarta a eutrofização). A (b) foi descartada porque mortandade por falta de oxigênio faria o teste da água dar alterado.

**PENDENTE — procedimento de mitigação (decidir depois)**
O Wesley quer algo que ajude **na realidade** (placa de aviso para peixe foi descartada, por ser fraca e irreal). Mercúrio não some: o foco real é impedir que continue chegando e entrando na cadeia. Opções reais já levantadas:
- *Na área do garimpo:* conter o rejeito e estabilizar o terreno (passo nº 1); recuperar a vegetação da área degradada (menos sedimento chega ao lago); capear o sedimento do fundo com material limpo (argila ou areia, às vezes com manta); adicionar carvão ativado ou biochar ao sedimento (prende o mercúrio e reduz o metilmercúrio); monitorar água, sedimento e peixes ao longo dos anos.
- *Erros possíveis (pegadinhas):* dragar o fundo (levanta o mercúrio de novo); criar área alagada/wetland (pode favorecer a formação de metilmercúrio, ao contrário do que funciona para esgoto).
- *Com as pessoas:* exames de mercúrio nos moradores (feitos no cabelo) e atendimento de saúde; alternativa de alimento, como tanques de criação de peixe em água limpa, para a comunidade não depender do peixe contaminado.
- *Ideia de estrutura:* duas frentes que valem pontos separados, a ambiental (área do garimpo) e a social (comunidade); o jogador só fecha a missão fazendo as duas.

**Ideias em aberto**
- ~~Só mercúrio ou outros metais?~~ Decidido: Hg + As (veja acima).
- A estrutura é a mesma da missão do lago (investigar, descartar, analisar, diagnosticar, agir, medir de novo), então boa parte do código pode ser reaproveitada.
- Precisa de: novo lago e garimpo no mapa, NPC com ligação de celular, item vara de pesca, minigame de pesca, bancada de preparo do peixe, analisador de metais, tabela periódica 3D, tela de relatório.

## Missão 9: "Fotos que protegem" (Espécies ameaçadas e reserva ambiental) · **M/G**
*Ideia do Wesley, anotada para não esquecer.*

- **Conteúdo / BNCC:** biodiversidade e espécies ameaçadas (EF07CI07, EF07CI08), unidades de conservação e ações de proteção (EF08CI16).
- **Onde:** na floresta, longe da trilha (mesma área da Missão 6).
- **Ideia central:** para proteger uma espécie, primeiro é preciso **provar que ela existe ali**. O aluno fotografa animais da região (ex.: lobo-guará) **sem ser notado**.
- **Etapas:**
  1. Descobrir **onde o animal costuma estar**: pegadas, fezes, marcas, horário (investigação de pistas).
  2. **Aproximação furtiva:** andar **devagar** (sem correr), de preferência contra o vento e sem barulho. Se correr ou chegar rápido demais, o animal foge.
  3. **Tirar a foto** com a câmera (qualidade depende da distância, do foco e de o animal não ter percebido o jogador).
  4. **Enviar as fotos à prefeitura**, que repassa à Secretaria de Meio Ambiente. Quanto melhores e mais variadas as fotos, **mais verba** (pagamento por foto).
  5. A Secretaria **libera o plano de criar uma reserva de proteção ambiental**.
  6. **Ação:** montar **grades/cercas de proteção** e outras estruturas no local (usa a loja e os lotes de construir).
- **Minigames novos:** aproximação furtiva (barra de "visibilidade" que sobe se correr), enquadrar e focar a foto, montar o dossiê de fotos (álbum de espécies).
- **Itens novos na loja (equipamentos pagos):** câmera fotográfica, binóculo, roupa de camuflagem (opcional) e cercas/grades de proteção (tipo `construir`).
- **Reaproveita:** economia (pagamento por foto), prefeitura (envio e liberação do plano), construir (lotes de cerca), bestiário e ideia do herbário/álbum.
- **Atenção:** precisa de modelos de animais (lobo-guará etc.), com comportamento simples de fuga. Combina com a Missão 6 (fauna). Conferir quais espécies são realmente **endêmicas** do Cerrado e usar essas no jogo.

## Pack de expansão: "Soro antiofídico" (NÃO fazer ainda)
*Ideia do Wesley, veio do antigo `NOTAS.md`. Ainda em fase de conversa.*

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

## Ordem sugerida

```
Fase 0 ✔ ──► Fase 1 Economia ──► Missão 2 Monocultura ──► Missão 3 Energia limpa
                                                                 │
                     Missão 4 Clima ◄────────────────────────────┘
                        │      └──► Missão 5 Vila
                        ├──► Missão 6 Fauna (precisa do ciclo dia/noite)
                        ├──► Missão 9 Fotos que protegem (junto com a Missão 6)
                        └──► Missão 7 Barranco (precisa da chuva)
                                          ──► Missão 8 Rio (a maior, por último)
```

**Por que nessa ordem?** A economia vem primeiro porque a monocultura e a energia usam a loja e a construção. A monocultura continua a história do lago (o adubo veio de algum lugar). A energia aproveita a fazenda (biodigestor) e o anemômetro.

## Ideias soltas (para encaixar depois)

- **Relógio de sol** na praça: observar a sombra ao longo do dia (EF06CI14). Pode ser uma missão bem curta.
- **Herbário**: coletar folhas pela floresta e classificar, como um "álbum de figurinhas".
- **Conquistas** no caderno: "primeira amostra", "salvou o lago", "identificou 10 espécies".
- **Modo professor**: uma tela que mostra o que cada aluno já fez (usando o progresso salvo).
- **Perguntas/quiz** ligados ao conteúdo de Ciências, para uso em sala (veio do antigo `NOTAS.md`).

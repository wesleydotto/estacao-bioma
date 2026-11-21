# Plano de ação: novas missões da Estação Bioma

Todas as missões seguem o mesmo ciclo do Lago da Mata, que já funciona bem:
**pista → medir no campo → analisar no laboratório → diagnóstico no mural → agir → medir de novo**.
Assim o aluno aprende o *método científico* jogando, e a gente reaproveita muito código.

Tamanho: **P** = poucos dias · **M** = uma ou duas semanas · **G** = mais que isso (precisa de área nova no mapa ou muitos modelos).

---

## Fase 0: base para várias missões (fazer primeiro)

Hoje o jogo só tem uma missão, e ela está "costurada" no código. Antes de criar outras:

| # | Tarefa | Por quê |
|---|--------|---------|
| 0.1 | **Sistema de missões**: cada missão num arquivo (`js/missoes/lago.js`, `js/missoes/clima.js`…) com estado próprio, etapas, falas e interações | Criar uma missão nova vira "copiar um modelo e preencher" |
| 0.2 | **Mural de missões de verdade**: lista as missões disponíveis, em andamento e concluídas | O mural já existe no lab, mas está vazio |
| 0.3 | **NPCs simples** (personagem parado que conversa com E) | Quase toda missão nova começa com alguém pedindo ajuda |
| 0.4 | **Salvar progresso** (localStorage) | Aula tem 50 min; o aluno precisa continuar depois |
| 0.5 | **Caderno de campo por missão** (tecla C) | Cada missão tem a sua tabela de resultados |

---

## Missão 1: "Vai chover?" (Estação Meteorológica) · **P/M**

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

## Missão 2: "Surto na Vila" (Água e saúde) · **M**

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
- **Bônus:** é a primeira missão com NPCs, então testa a base da Fase 0.

## Missão 3: "Quem passa à noite?" (Censo de fauna) · **M/G**

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
- **Reaproveita:** bestiário, mural, ciclo dia/noite (que pode ser criado na missão 1).
- **Atenção:** precisa de modelos de animais da fauna brasileira (lobo-guará, tamanduá, capivara, sapo, coruja…). Encaixa com a ideia de trocar por modelos `.glb`.

## Missão 4: "Apagão no laboratório" (Energia) · **M**

- **Conteúdo / BNCC:** fontes de energia renováveis e não renováveis (EF08CI01), circuitos elétricos (EF08CI02), consumo dos aparelhos (EF08CI04) e uso consciente (EF08CI05).
- **Onde:** dentro do laboratório e no telhado. Os **painéis solares já existem**.
- **Gancho:** a energia do lab cai toda tarde, e a estufa desliga no meio do teste.
- **Etapas:**
  1. Ler o medidor de energia e listar a potência de cada aparelho (geladeira, estufa, microscópio, ar-condicionado).
  2. Calcular o consumo (potência × horas) e comparar com o que os painéis geram.
  3. Achar o problema: um painel sujo ou quebrado, e o ar-condicionado ligado o dia todo.
  4. Ação: limpar e consertar o painel (montar o circuito), instalar um timer e trocar as lâmpadas.
  5. Medir de novo: a energia sobra.
- **Minigames novos:** montar um circuito (pilha + fio + lâmpada; série e paralelo), uma calculadora de consumo.
- **Reaproveita:** painéis, telhado, aparelhos do lab.

## Missão 5: "O rio que mudou de cor" (Contaminação química) · **G**

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

## Missão 6: "O barranco que desabou" (Rochas e fósseis) · **M**

- **Conteúdo / BNCC:** tipos de rocha e formação de fósseis (EF06CI12), camadas da Terra (EF06CI11).
- **Onde:** nos morros da borda do mapa (eles já existem no terreno).
- **Gancho:** uma chuva forte (ligação com a missão 1) derrubou um barranco e apareceram "pedras com desenhos".
- **Etapas:**
  1. Observar as camadas do barranco e coletar rochas de cada camada.
  2. No lab, classificar as rochas (ígnea, sedimentar ou metamórfica) pelos testes de dureza, textura e reação com ácido.
  3. Achar os fósseis e descobrir que eles só aparecem na rocha sedimentar.
  4. Mural: montar a "linha do tempo" das camadas (as de baixo são mais antigas).
  5. Ação: proteger o sítio e conter a erosão com plantas.
- **Minigames novos:** classificar as rochas, escavação cuidadosa (pincel).
- **Reaproveita:** bancadas do lab, mural, mudas.

---

## Ordem sugerida

```
Fase 0 (base) ──► Missão 1 Clima ──► Missão 2 Vila ──► Missão 4 Energia
                        │
                        ├──► Missão 3 Fauna (precisa do ciclo dia/noite)
                        └──► Missão 6 Barranco (precisa da chuva)
                                          ──► Missão 5 Rio (a maior, por último)
```

**Por que começar pelo clima?** É pequena, não precisa de área nova no mapa, usa o telhado que já existe e cria a **chuva** e o **tempo passando**, que as outras missões vão usar.

## Ideias soltas (para encaixar depois)

- **Relógio de sol** na praça: observar a sombra ao longo do dia (EF06CI14). Pode ser uma missão bem curta.
- **Herbário**: coletar folhas pela floresta e classificar, como um "álbum de figurinhas".
- **Conquistas** no caderno: "primeira amostra", "salvou o lago", "identificou 10 espécies".
- **Modo professor**: uma tela que mostra o que cada aluno já fez (usando o progresso salvo).

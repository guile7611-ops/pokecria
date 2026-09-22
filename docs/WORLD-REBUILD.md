# Mundo de Aurora — implementação

O mundo passou de 240 × 170 para 480 × 340 tiles de 32 pixels: 15.360 × 10.880 pixels, quatro vezes a área anterior. A costa é um polígono autoral com baías, penínsulas e duas ilhas secundárias. A geografia não é escolhida pela seed.

## Controles

- **M:** abrir/fechar o atlas mundial. Ele abre enquadrando o continente inteiro.
- **Scroll sobre o mapa:** zoom contínuo ancorado no cursor. Não altera a câmera de jogo.
- **Arrastar o mapa:** mover a área observada.
- **Jogador / Região / Mundo:** voltar ao personagem, enquadrar os arredores ou o mundo inteiro.
- **Clique no atlas:** selecionar uma região ou um POI descoberto, com nível, criaturas e recompensa.
- **Cartografia:** inspecionar a geografia inteira. Não marca regiões nem segredos como descobertos.
- **Controle Câmera**, no canto inferior direito: zoom contínuo do jogo, do mundo inteiro aos detalhes. **0** enquadra o mundo; **1** retorna ao zoom de jogo.
- **Seed**, dentro do atlas: alterar e regenerar a vegetação/detalhes. O Pokémon volta à vila preservando nível, evolução e habilidades. A descoberta recomeça.
- **Salvar descoberta:** salva seed e exploração no navegador. Também há salvamento automático a cada 10 segundos e ao sair. A progressão de combate continua seguindo o comportamento de sessão que já existia.

## Dados e geografia

`public/world-definition.js` concentra os dados editáveis:

| Definição | Controle |
| --- | --- |
| WorldDefinition | Dimensões, costa, ilhas, espinhas de cordilheira, lagos e rios |
| RegionDefinitions | 14 regiões, centros/extensões, bioma, nível, criaturas, dificuldade, recompensa |
| BiomeDefinitions | Paleta e densidade de vegetação |
| AreaDefinitions | 24 subáreas associadas aos lugares, entradas, saídas e segredos |
| RoadDefinitions | Rotas principais, ramificações, circuitos e acessos secretos |
| PoiDefinitions | 24 lugares: povoados, ruínas, cavernas, cachoeira, acampamentos e santuários |
| StructureDefinitions | Casas, centro de cura, loja, edifício principal, poço, portões e monumentos |
| SpawnZoneDefinitions | Espécies, população e níveis por região |
| TerrainDefinitions | Chão, árvore, água, montanha, areia, pântano, vulcão, estrada, ponte, caverna, estrutura e passagem |

O gerador aplica continente → altitude/cordilheiras → lagos/rios → margens → vegetação → clareiras/rotas → estruturas → objetos → pontos de spawn. Os corredores das rotas removem obstáculos e usam pontes ao cruzar água. O terreno urbano possui composição irregular e paisagismo definido.

As regiões usam distância normalizada com perturbação contínua dos limites, não retângulos. A renderização mistura as cores nas transições. Florestas variam por agrupamentos; pradarias, areia, pântanos e encostas têm decoração própria. Há três sistemas de montanhas, três cursos d'água principais, três lagos e um rio local na vila.

O Guardião permanece integrado ao combate existente, agora em um santuário com piso e anel de pedras. A cratera vulcânica é outro local de arena; não foi criado um segundo sistema de combate de boss. Cavernas e edifícios são locais/exteriores do mundo contínuo; não são cenas de interiores nem implementam comércio novo.

## Uma representação compartilhada

`WorldView` recebe os mesmos dados usados pela colisão e pelo spawn. Câmera, minimapa e atlas chamam seu renderizador. Não há imagem ilustrada separada do mundo nem canvas com as dimensões do continente.

Os sprites de ambiente são 21 arquivos SVG originais em `public/assets/world`. O canvas apenas compõe os sprites e o chão durante a renderização. O servidor foi corrigido para servir SVG com `image/svg+xml`.

O minimapa começa na visão local e segue o jogador. O atlas reutiliza os mesmos setores em níveis de detalhe menores. Os marcadores de criaturas usam entidades vivas da simulação; os POIs usam posições da definição de mundo.

## Setores, streaming e desempenho

- 300 setores de até 24 × 24 tiles; coordenadas contínuas, sem telas de transição.
- Dados leves de terreno e objetos permanecem em memória. Texturas detalhadas são geradas sob demanda, em pequenas filas assíncronas.
- Três níveis de detalhe por setor: 768, 96 e 48 pixels de lado. O maior canvas de terreno é 768 × 768.
- Cache limitado e descarte por uso; reaproveitamento de canvases.
- Culling de objetos/entidades fora da câmera e ordenação por profundidade no jogo.
- Aproximadamente 138 pontos de spawn geográficos; até 48 criaturas ativas, com ativação/desativação por proximidade. Estado de criaturas afastadas é preservado na sessão.
- Reaproveitamento de objetos de criaturas e projéteis; limite de 96 projéteis; efeitos expiram.
- A* com heap de prioridade, oito direções, custos por distância e suavização com colisão do corpo inteiro. Água, montanhas e edifícios bloqueiam; pontes e corredores permitem passagem. O último clique substitui a rota.

## Descoberta

`Discovery` guarda células de 8 × 8 tiles. Ao caminhar, a área próxima passa a CURRENT; ao sair fica DISCOVERED; o restante permanece UNKNOWN. POIs secretos não ganham marcadores antes da descoberta. A visualização cartográfica é uma opção de inspeção; não modifica o estado salvo.

## Adicionar uma região

1. Em `RegionDefinitions`, definir identificador, bioma, centro, raios, nível, criaturas e recompensa. Coordenadas são em tiles.
2. Se necessário, editar a costa e as espinhas de montanha/rios em `WorldDefinition`.
3. Adicionar POIs com posições e região correspondente. Entradas/saídas e subáreas são derivadas desses lugares e podem ser editadas nas definições.
4. Conectar os lugares com polilinhas em `RoadDefinitions`; curvas e pontes são geradas a partir delas.
5. Escolher estruturas em `StructureDefinitions` e sprites correspondentes em `WorldView`.
6. Revisar população e espécies em `SpawnZoneDefinitions`. Espécies novas precisam de dados de combate e atlas registrados no sistema de animação existente.
7. Executar os testes de conectividade, colisão, seed e navegador.

## Arquivos alterados/criados

Criados: `world-definition.js`, `world-runtime.js`, `world-view.js`, `map-controller.js`, 21 sprites SVG, testes `world-rebuild.test.mjs` e `browser/world-map.spec.js`, esta documentação.

Alterados: `data.js`, `map-generator.js`, `world.js`, `simulation.js`, `renderer.js`, `main.js`, `style.css`, `index.html`, `server.mjs` e testes existentes que dependiam das coordenadas/casas e da antiga população fixa.

## Verificação

`npm test`: navegação, evolução, habilidades, combate, boss, seed, acesso aos lugares, streaming e salvamento. `npx playwright test`: fluxo de jogo, imagens carregadas, mapa mundial, zoom, pan, seleção, câmera e persistência de seed. Capturas em `docs/world-atlas.png` e `docs/world-village.png`.

Também foram verificadas rotas com o raio do jogador até todos os 24 lugares nas seeds 123456, 42 e 98765. Todas possuem acesso a partir da vila.

Executar com `npm start` e abrir `http://localhost:4173/`.

# Expansão de Aurora

## Entrega

Superfície ampliada de 480 × 340 para 720 × 440 tiles (94% mais área total de mapa), mantendo tiles de 32 px, câmera, controles e Vila Aurora. A área total inclui oceano; as áreas acessíveis são verificadas por navegação.

Novas regiões: Manguezal das Brumas, Estepe dos Trovões, Taiga do Alvorecer, Terras das Cinzas e Bosque das Pétalas. Novas trilhas formam circuitos e conectam abrigos, ruínas, cavernas e escarpas ao continente original.

## Como testar

- Abra M para ver o mapa e siga para leste a partir do Refúgio da Serra, ou para sudeste a partir da Caldeira Rubra/Oásis de Âmbar. As trilhas levam ao Refúgio das Brisas e às novas regiões. O movimento mantém clique esquerdo/direito e setas.
- Galerias de Cristal: entradas Gruta sob o Véu (202,73), Gruta de Cristal (330,86), Mina Esquecida (373,163).
- Raízes Submersas: Cripta Afogada (125,234), Gruta das Brumas (475,335), Gruta das Pétalas (558,358).
- Túneis de Obsidiana: Fenda das Cinzas (648,174), Gruta Boreal (590,79).
- Altos de Aurora: escarpas de Granito (363,114), Boreal (568,95), Trovões (545,170) e Cinzas (617,263).
- Coordenadas acima são tiles da superfície. Aproxime-se da porta ou escarpa e pressione F, ou clique no botão de interação. Nas cavernas, siga os corredores até uma marca SAÍDA; nas montanhas, procure DESCIDA. Voltar pela passagem de chegada retorna à mesma entrada; outra passagem retorna à entrada correspondente.
- O nome da camada aparece junto ao relógio. A ação de subir/descer só aparece perto do ponto de acesso. As transições são explícitas e têm proteção de um segundo contra repetição; sair coloca o jogador em uma posição livre.
- Compare níveis ao avançar pelas trilhas e espécies em cada região. Evoluções só entram no sorteio quando a faixa local comporta seu nível mínimo. Cavernas têm encontros próprios a qualquer hora; superfície mantém dia/noite.

## Dados e decisões

- `public/world-definition.js`: contorno, regiões, caminhos, pontos de interesse, espécies, pesos e densidade.
- `public/world-habitats.js`: tipos permitidos, exceções por habitat, sistemas subterrâneos/elevados e vínculo das entradas. Ambos os tipos participam; a lista explícita da região também é obrigatória.
- `public/world-navigation.js`: distância percorrível calculada uma vez por mapa, com terreno bloqueado e obstáculos inflados pelo raio da criatura. Progressão configurável: aproximadamente um nível por 320 px de trajeto, faixa local estreita. Subterrâneo adiciona profundidade e pondera a dificuldade das entradas por distância pelos corredores.
- `public/layer-generator.js`: salas irregulares, túneis curvos, ramificações, áreas elevadas, saídas e encontros exclusivos. Reaproveita tiles/sprites existentes; não introduz downloads nem novas dependências.
- `public/map-generator.js`, `collisions.js`, `simulation.js`, `encounters.js`: integração de geração, colisões, transições, encontros e níveis.
- `public/renderer.js`, `map-controller.js`, `world-view.js`, `tilemap.js`, `style.css`: renderização das camadas, botões estáveis, sinalização, materiais e minimapa com neblina limitada à área visível.
- `tools/chunk-composer.mjs`, `api/tile-chunk.mjs`, `server.mjs`: renderização dos setores ampliados e cenas compartilhadas no servidor.
- `public/world-runtime.js`, `main.js`, `data.js`, `realtime-online.js`: dimensões, migração de descoberta, isolamento visual de cenas e versão do canal online.

Não há uma instância de caverna por jogador: cada sistema tem um scene ID e IDs de criaturas estáveis, comuns a todas as entradas. O canal online passou a `aurora-world-v3` para evitar misturar clientes com o mapa antigo; todos devem atualizar a página. Isso reaproveita o transporte online existente, não o substitui por um servidor autoritativo.

As casas mantêm seus interiores antigos. A descoberta e os inimigos das camadas são preservados entre visitas na mesma sessão. Os saves mantêm Pokémon, itens e atributos; a exploração antiga da superfície é convertida à nova largura. A posição continua seguindo o comportamento de login existente.

## Validação

- Testes automatizados: todos os pontos de interesse acessíveis, spawns sem colisão e compatíveis, progressão por rota, níveis mínimos das evoluções, caminhos efetivamente percorridos entre todas as saídas, ida/volta por todas as entradas, saídas alternativas, isolamento de snapshots e migração de descoberta.
- Playwright (`tests/browser/world-expansion.spec.js`): movimento por mouse nos cinco biomas, entrada por F, retorno na mesma entrada, saída alternativa, subida e descida pelo botão, carregamento de setores sem HTTP de erro e sem exceções JS.
- Medição local no navegador: percentil 95 de quadro em aproximadamente 16,7 ms. Não é uma garantia para outros dispositivos ou para latência do servidor.
- Capturas de verificação em `test-results/expanded-grove.png`, `expanded-cave.png` e `expanded-mountain.png` (artefatos locais ignorados pelo Git).

Para repetir: `npm test`, `npm run build`, `npx playwright test tests/browser/world-expansion.spec.js --workers=1`.

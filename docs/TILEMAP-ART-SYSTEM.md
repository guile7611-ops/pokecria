# Sistema de tiles e sprites de Aurora

Atualização: consulte [Ponte e sprites individuais](./BRIDGE-AND-SPRITES-FIX.md). O importador passou a usar fontes individuais; a ponte elevada de demonstração foi removida; quatro objetos foram refeitos separadamente e o alinhamento dos Pokémon foi corrigido.

Versão de 21/09/2026. Jogo em http://localhost:4174/?v=tilemap e biblioteca em http://localhost:4174/art-library.html.

## Implementação

O terreno usa PNGs de 32×32: 16 materiais com quatro variantes cada. Cada material também possui um atlas de 256 máscaras de transição por oito vizinhos. A biblioteca contém 36 prefabs de objetos derivados de 32 desenhos, cinco recortes reutilizáveis de construções e 16 animações VFX com oito quadros. As fontes originais ficam em `public/assets/source`, e os arquivos importados em `public/assets/tilesets` e `public/assets/sprites`.

`tilemap.js` define materiais, máscaras, propriedades e pivôs. `tools/import-art.mjs` recorta e normaliza os PNGs; execute `node tools/import-art.mjs` para repetir a importação. `assets/art-manifest.json` cataloga os arquivos.

`tools/chunk-composer.mjs` monta setores de 24×24 tiles a partir dos dados reais do mundo, usando Sharp no servidor. `/api/tile-chunk` entrega os setores em três resoluções, com quatro quadros para água. Há duas composições simultâneas e cache limitado a 120 resultados. A primeira visita a setores ainda não armazenados requer composição. Os níveis distantes usam filtragem para reduzir moiré.

`world-view.js` exibe setores e sprites como elementos DOM, com recorte pela câmera e profundidade por posição da base. `renderer.js` integra Pokémon, efeitos e debug. Não há Canvas no mundo nem no minimapa. O atlas utiliza os mesmos dados, tiles, objetos e compositor do jogo; não é uma ilustração independente.

A macroestrutura continua em `world-definition.js`. A seed varia os detalhes de `map-generator.js` dentro desse desenho. O mundo mantém 480×340 tiles, regiões, rios, estradas e pontos de interesse definidos pelo desenvolvedor.

## Colisões e interação

`collisions.js` separa terreno, corpos de objetos, paredes, portas e áreas de interação. Árvores bloqueiam apenas o tronco. Copas e bases usam y-sort; a ponte elevada de demonstração tem uma camada superior. Água exige capacidade de natação na navegação; os Pokémon atuais não recebem essa capacidade automaticamente. Pontes de travessia são caminháveis.

`world.js` mantém A*, diagonais sem atravessar cantos, verificação contínua de segmentos e prioridade do último clique. Personagens possuem corpo e hurtbox; projéteis possuem hitbox própria. Casas e cavernas abrem interiores jogáveis com saída ao sul. Os interiores atuais são modelos compartilhados por categoria, não salas exclusivas para cada construção.

Controles: clique para andar; Shift para correr; F para entrar/interagir; F3 para colisões; M para abrir o mapa; scroll para zoom somente com o mapa aberto. A corrida reutiliza os quadros direcionais de caminhada em velocidade maior. Idle permanece em quadro fixo. Os sprites existentes dos Pokémon e suas animações foram preservados.

## Arte e origem

Os novos terrenos, objetos e VFX foram criados com a ferramenta integrada imagegen, usando a referência do usuário como direção visual. O importador faz recortes, ajuste de dimensões, limpeza técnica de alpha e extração de módulos. Alguns prefabs compartilham desenhos; cinco partes de construção são recortes reutilizáveis, não um editor de edifícios.

Conjunto de prompts de produção, normalizado para reprodução:

1. Criar spritesheet original de RPG top-down em pixel art, iluminação superior esquerda, 1536×1024, oito colunas e quatro faixas, fundo transparente. Árvores pequena/carvalho/antiga/pinheiro/salgueiro/seca/florida/palmeira; arbustos/flores/grama/cogumelos/pedras/montanha/caverna; casas/curandeiro/loja/ruína/torre/templo/tenda; tronco/toco/placa/banco/caixas/poço/ponte/fogueira. Objetos isolados com pivô na base, compatíveis com terreno de 32 px, sem texto nem cópia dos elementos da referência.
2. Preservar os objetos e remover o fundo, entregando transparência alpha real e contornos limpos.
3. Criar atlas de chão em pixel art, oito por oito células: 16 materiais com quatro variações, incluindo grama, floresta, pradaria, terra, areia, areia molhada, água rasa/profunda, pedra, neve, caverna, pântano, ruínas, madeira, lava e folhas. Texturas planas repetíveis, sem objetos, perspectiva coerente.
4. Criar spritesheet VFX transparente, 16 efeitos com oito quadros cada, alinhados pelo centro: efeitos elementais, impacto, cura, explosão, evolução e efeitos ambientais. Pixel art coerente com a biblioteca, sem texto, quadros separados e transparência real.

As três fontes efetivamente usadas são `environment.png`, `terrain.png` e `vfx.png` em `public/assets/source`. A biblioteca visual permite inspecionar os recortes finais.

## Verificação

`npm test` executa navegação, combate, evolução, spawn, mundo, PNGs, autotiling, colisões de tronco/pedra, água, pontes e entrada/saída. Para o servidor atual, execute `$env:E2E_PORT='4174'; npx playwright test` no PowerShell. Os testes de navegador verificam cliques, câmera, atlas, progressão, carregamento dos PNGs, animação dos setores, debug, portas e profundidade dos sprites.

A migração altera a renderização e a navegação existentes; não adiciona multiplayer ou um editor visual de regiões. Documentação anterior que descreve Canvas como renderizador principal foi substituída por este documento.

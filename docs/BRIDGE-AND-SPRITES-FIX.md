# Ponte, posicionamento e assets individuais

Correção de 21/09/2026. Abra http://localhost:4174/?v=bridge-fix.

As decorações dos santuários não verificavam se suas bases atravessavam água, estradas ou pontes. Agora todas as decorações passam pela mesma validação de área ocupada. A ponte elevada de demonstração adicionada fora do desenho original foi removida. Construções mantêm suas posições autorais.

A IA fazia uma nova busca quando a rota estava vazia, mesmo antes de vencer seu temporizador. Alvos inacessíveis podiam disparar buscas sucessivas pelo mundo inteiro. As tentativas agora respeitam o temporizador e têm orçamento de nós, incluindo o boss. As rotas do jogador continuam aceitando diagonais e priorizando o último clique.

O círculo de seleção estava ancorado no fim do quadro transparente do spritesheet. Ele foi removido. `tools/ground-sprites.mjs` extrai a linha dos pés opacos das animações Idle/Walk e gera `sprite-grounding.js`, mantendo os pés dos Pokémon terrestres na coordenada física. Pokémon voadores conservam seu pivô original.

## Arquivos individuais

`public/assets/source/objects` contém uma fonte PNG por objeto. `public/assets/source/tiles` contém os 64 tiles individuais. `tools/import-art.mjs` não recorta mais `environment.png` nem `terrain.png`: lê cada arquivo diretamente. Os PNGs antigos de prancha são apenas histórico. Objetos que estavam corretos foram preservados como arquivos individuais; não foram todos gerados novamente.

Pedra, grama, cacto e rocha vulcânica foram gerados novamente com a ferramenta integrada imagegen, cada um em uma chamada independente, com transparência e sem outros assets ao redor. As fontes ficam em `source/objects/rock.png`, `grass.png`, `cactus.png` e `lava.png`; os resultados de tamanho de jogo ficam em `sprites/objects`.

Prompts usados: criar exatamente um objeto isolado, PNG com alpha real, pixel art original de RPG top-down em três quartos, luz superior esquerda, margens transparentes, sem prancha, grade, cenário, objetos vizinhos ou texto. Sujeitos: pedra cinza baixa com musgo; tufo de grama verde com sementes; cacto verde com dois braços; basalto escuro com fissuras de lava laranja. Nenhum desses quatro arquivos vem de um recorte de spritesheet.

## Regressões

`tests/bridge-regression.test.mjs` faz três travessias com IA ativa, verifica o terreno durante o deslocamento, os limites das decorações e os pivôs de caminhada/idle. `tests/browser/tilemap.spec.js` repete a travessia usando cliques reais, verifica ausência de erros e do círculo deslocado. A revisão da URL dos chunks evita reutilizar imagens antigas do cache do navegador.

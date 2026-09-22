# Encontros selvagens

Os encontros comuns agora usam Caterpie, Pidgey e Rattata. O ponto de spawn alterna entre essas espécies, com vida, ataque, velocidade, alcance, XP e comportamento próprios. Cada espécie usa as folhas locais de oito direções, incluindo caminhada lateral.

Quando uma criatura está parada, a simulação não desloca sua posição e o renderer fixa o primeiro quadro de Idle. A animação de caminhada só avança quando `moving` está ativo. O jogador também mantém a posição quando não há rota; um novo clique substitui a rota anterior imediatamente.

Os sprites foram importados pela mesma revisão do PMDCollab usada pelos iniciais e têm seus créditos em `public/assets/pokemon/<species>/credits.txt`. O boss continua sendo o Guardião da Clareira, separado dos encontros comuns.

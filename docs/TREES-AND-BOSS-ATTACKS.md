# Árvores individuais e ataques de bosses

As árvores usadas pela geração do mundo (`tree`, `pine`, `willow`) foram substituídas por PNGs individuais, criados separadamente pela ferramenta integrada imagegen. As fontes ficam em `public/assets/source/objects`, e os sprites finais em `public/assets/sprites/objects`. Cada sprite foi inspecionado após a importação: carvalho 80×108, pinheiro 72×112 e salgueiro 96×120, com transparência, sem partes de outros objetos. As colisões continuam restritas ao tronco. A revisão dos chunks foi atualizada para invalidar o cache antigo.

Prompt utilizado por chamada: “Original RPG pixel art asset, ONE isolated [tree]. Actual transparent PNG background. Single complete tree centered with empty transparent margins on every side. Top-down three-quarter view, upper-left lighting, chunky crisp pixel art readable at 80x112 pixels. Roots at bottom center, no ground slab. No spritesheet, no grid, no neighboring object, no loose pixels or fragments, no text, no scenery. One tree per image.” Sujeitos: carvalho verde de copa arredondada e tronco grosso; pinheiro verde-escuro em camadas; salgueiro de folhas pendentes e tronco retorcido.

`public/boss-attacks.js` define o ciclo padrão de todos os bosses, utilizado automaticamente quando o boss não possui uma lista própria em `attacks`:

| Golpe | Área | Animação |
| --- | --- | --- |
| Impacto Sísmico | Círculo no alvo, travado ao iniciar | Impacto terrestre e compressão do corpo |
| Lâminas Selvagens | Leque à frente do boss | Três cortes e giro do corpo |
| Raio Solar | Faixa reta na direção anunciada | Sequência de energia, pose Shoot e recuo |

Todos têm preparação, aviso com nome, área de dano própria e recuperação. A posição/direção é fixada no início do aviso, permitindo esquivar. O dano exige linha de visão. O boss para durante a execução, e sua morte cancela ataques pendentes. A fase final acelera a preparação. Não foram importados novos spritesheets de Pokémon: os golpes combinam os quadros existentes Attack/Shoot, movimento visual do corpo e três animações VFX distintas.

Verificação: `tests/boss.test.mjs` cobre a sequência, geometrias, esquiva, morte e fases. `tests/browser/boss-attacks.spec.js` verifica os três avisos e os três efeitos raster na execução real. Capturas: `docs/boss-slam.png`, `docs/boss-cleave.png`, `docs/boss-beam.png`.

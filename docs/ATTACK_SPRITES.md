# Efeitos de Pokémon Mystery Dungeon

Origem: [Attack Effects — Pokémon Mystery Dungeon: Explorers of Sky, The Spriters Resource](https://www.spriters-resource.com/ds_dsi/pokemonmysterydungeonexplorersofsky/asset/85692/). O pacote original usa IDs numéricos e não informa o nome do golpe correspondente; a associação abaixo foi feita por inspeção visual, sem afirmar que seja a associação original do jogo. Arte pertencente aos respectivos titulares de Pokémon e Mystery Dungeon, usada neste fan project conforme pedido do usuário.

| ID do pacote | Uso no jogo | Aparência identificada |
| --- | --- | --- |
| 0013 | Jato d'água | gota azul |
| 0024 | Explosão de Fogo | esfera incandescente |
| 0053 | Brasa | faísca de fogo |
| 0055 | Água girando no Redemoinho | anel de gotas |
| 0058 | Centro do Redemoinho | espiral que encolhe |
| 0070 | Chama e Lança-Chamas | chamas em movimento |
| 0081 | Pulso d’água | anel azul que se expande |
| 0251 | Onda d’Água e Surfar | frente larga de água |
| 0122 | Mordida | mandíbulas brancas |
| 0129 | Folha e Folha Navalha | folha girando |
| 0155 | Presa de Gelo | mandíbulas e estilhaços azuis |
| 0028 | Inferno | erupção de fogo em vários quadros |

## Golpes de água

| Golpe | Efeito escolhido | Uso no combate |
| --- | --- | --- |
| Jato d’água | `0013` + `0021` | gota veloz com respingo no contato |
| Pulso d’água | `0081` + `0021` | anel expansivo com respingo no contato |
| Onda d’Água | `0251` + `0021` | frente larga que atravessa inimigos e deixa respingos |
| Canhão Hidro | jato próprio + `0021` | projétil carregado com explosão aquática em área |
| Hidro bomba | jato próprio + `0021` | disparo reforçado com impacto aquático |
| Redemoinho | `0058` + `0055` | espiral central com gotas em órbita que puxa e fere repetidamente |
| Surfar | `0251` | onda ampla centrada na área escolhida |
| Cachoeira | `0021` | queda de água no contato |
| Mergulho | `0021` | impacto aquático depois do mergulho |

## Golpes de planta

| Golpe | Efeito escolhido | Uso no combate |
| --- | --- | --- |
| Folha cortante | `0129` | uma folha rápida |
| Folha navalha | `0129` | leque de cinco folhas |
| Semente solar | `0145` | uma semente energizada |
| Bola de Energia | `0067` | esfera vegetal grande |
| Chicote de Vinha | `0131` | cortes verdes repetidos no alcance do chicote |
| Raio Solar | arte própria | raio carregado que atravessa alvos |
| Florescer | `0186` | crescimento giratório durante a cura |
| Síntese | `0105` | luz solar durante a cura |
| Mega Dreno | `0094` | energia extraída do alvo |

O menu H, a barra de ataques e a galeria mostram o **dano base** registrado em cada golpe. Ele não é o dano final: ataque, defesa, tipo, múltiplos acertos e outros modificadores entram no cálculo durante a luta. Cura e suporte são identificados separadamente.

## Golpes de fogo

| Golpe | Efeito escolhido | Uso no combate |
| --- | --- | --- |
| Brasa | `0053` | pequenas brasas lançadas em par |
| Chama intensa | `0070` | chama móvel |
| Lança-chamas | `0016` | fluxo contínuo em segmentos |
| Explosão de Fogo | `0024` | esfera de fogo com impacto próprio |
| Inferno | `0028` | erupção animada que persiste na área |
| Giro de Fogo | `0030` | arcos de chamas circulares |
| Roda de Fogo | `0030` + roda própria | arcos ao redor do Pokémon enquanto se move |
| Carga de Chamas | `0225` | chama volumosa no contato |

O mapeamento completo dos **58 golpes** que usam efeitos importados está em `public/pmd-attack-vfx.js`; há **48 sequências** PNG distintas. Raio Solar, Hidro Bomba e Pulso do Dragão mantêm seus projéteis próprios, que representam melhor suas mecânicas atuais. O pacote não fornece nomes dos golpes, portanto essas escolhas não afirmam identificar o movimento original de cada ID.

Os frames originais de `move_VFX/<ID>/000/` foram amostrados em oito quadros e centralizados em folhas transparentes de 512 × 64 pixels, uma folha por ID em `public/assets/sprites/vfx/pmd/`. Execute `./scripts/import-pmd-attack-vfx.ps1` para baixar e reconstruir essas folhas. As folhas usadas pelo jogo já estão incluídas no projeto. Os efeitos próprios continuam disponíveis para os golpes sem correspondente visual escolhido.

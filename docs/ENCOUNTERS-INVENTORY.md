# Encontros, níveis e mochila

Atualização de 21/09/2026. A versão jogável está em http://localhost:4174/?v=encounters.

Cada encontro usa a região do tile em que nasceu e a distância até Aurora. O nível cresce conforme a faixa da região e a distância. A raridade é determinística por seed e uid: Comum, Incomum, Raro e Elite. Raridade e nível alteram HP, ataque, defesa, XP, moedas e quantidade do drop. O nome exibido sobre o sprite inclui `Nv.` e raridade; o painel de alvo também mostra as estatísticas e a recompensa.

Bosses recebem raridade Boss, escala de atributos própria e nível acima da região. O primeiro Guardião foi movido para a arena do Bosque dos Brotos, além da clareira inicial. Cada boss recebe seis Pokémon Elite em formação circular. O boss da Caldeira também é criado no próprio ponto de interesse. As hordas usam as espécies válidas da região e respeitam as mesmas colisões e navegação.

Ao derrotar qualquer Pokémon, o jogador recebe XP calculado pelo nível, moedas e o drop da espécie/região. O loot é adicionado imediatamente a `sim.inventory`, com `{money, items}`. A mochila abre com B ou pelo botão “B · Mochila”; pausar a movimentação ao abrir evita comandos acidentais. O inventário é salvo em `localStorage` junto com seed e descoberta, validado ao carregar e preservado ao entrar/sair de casas e cavernas.

Implementação principal: `public/encounters.js` calcula raridade e escala; `public/simulation.js` instancia encontros, hordas, loot e persistência; `public/main.js` atualiza nome, painel de alvo e mochila. `tests/encounters.test.mjs` cobre progressão por distância, raridade, seis guardas por boss, terreno acessível, loot único e persistência. `tests/browser/inventory.spec.js` verifica níveis, coleta e recarga da mochila.

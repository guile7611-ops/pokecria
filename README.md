# Verdant — Criaturas de Aurora

Protótipo jogável das Fases 1 e 2 iniciais do documento `GPT_ASTRA_PROMPT_MESTRE_RPG_ONLINE.md`.

## Jogar

Requer Node.js 22 ou superior. Na pasta deste projeto:

```sh
npm start
```

Abra http://localhost:4173. O jogo não exige instalação de dependências para executar: o servidor usa apenas módulos nativos do Node.js.

Escolha **Bulbasaur, Charmander ou Squirtle** e clique em **Entrar na floresta**. Clique no chão para caminhar; o último clique substitui imediatamente o destino anterior. Arraste com o botão pressionado para atualizar o destino. Clique em Rockhorn para perseguir e atacar automaticamente. Mire com o mouse e pressione **Q** para usar o projétil elemental. Derrote duas criaturas para alcançar o nível 2 e desbloquear a recuperação em **W**.

| Controle | Ação |
|---|---|
| Clique / clique segurado | Selecionar alvo / caminhar |
| Setas | Movimento alternativo |
| Q | Folha cortante / Brasa / Jato d’água, recarga de 2,4 segundos |
| W | Cura de 32 HP, nível 2, recarga de 9 segundos |
| E / R | Slots reservados, sem habilidade nesta fase |
| M | Ampliar minimapa |
| Roda do mouse | Zoom |
| Esc | Pausar e retomar |

Morte causa renascimento em três segundos, mantendo nível e XP da sessão. Recarregar a página ou recomeçar encerra esse progresso. O som é opcional, ativado pelo botão da barra superior.

## Escopo entregue

- Três iniciais selecionáveis: Bulbasaur, Charmander e Squirtle.
- Evoluções por nível: Ivysaur/Venusaur, Charmeleon/Charizard e Wartortle/Blastoise.
- Boss regional Guardião da Clareira, com três fases, telegráficos, área de perigo e respawn.
- Encontros selvagens com Caterpie, Pidgey e Rattata, cada um usando sprite próprio.
- Prévia de evolução em http://localhost:4173/evolutions.html, com linha evolutiva e histórico.
- Floresta modular de 48 × 34 tiles, árvores com colisão, rio, ponte e clareira inicial.
- Navegação A* com oito direções, trajetos diretos, colisão de corpo e linha de visão.
- Sprites Mystery Dungeon em oito direções, com seis estados e pivôs por quadro.
- Câmera suavizada, ordenação visual por profundidade, minimapa e zoom.
- Ataque básico, projétil, cura desbloqueável e exatamente quatro slots.
- Seis inimigos com estados Idle, Wander, Alert, Chase, Attack, ReturnToSpawn e Dead.
- XP, níveis, atributos escaláveis, teto configurado em 40 e learnset separado da lógica.
- Morte, retorno ao início e respawn dos inimigos com distância mínima do jogador.
- HUD, cooldowns, feedback de dano/XP, sons sintetizados opcionais e pausa.

Chefes, login, multiplayer, inventário e salvamento persistente continuam fora desta entrega. Os estados de IA e animação mais completos também ficam para a expansão.

## Arquitetura e arquivos

| Arquivo | Responsabilidade |
|---|---|
| `public/data.js` | Criatura, habilidade, curva de XP, learnset, inimigos e pontos de spawn |
| `public/world.js` | Mapa, navegação, colisão e linha de visão |
| `public/simulation.js` | Regras de combate e progressão, comandos e eventos, sem dependência do DOM |
| `public/renderer.js` | Canvas, câmera, sprites, cenário, efeitos e minimapa |
| `public/animation.js`, `public/sprite-data.js` | Estados, direções, durações e metadados dos sprites |
| `public/sprites.html` | Galeria animada para conferir os sprites |
| `public/evolutions.html`, `public/progression.js` | Prévia e regras de evolução por nível |
| `docs/BOSS.md` | Regras e roteiro de teste do boss regional |
| `public/main.js` | Input, loop de passo fixo de 60 Hz, áudio e interface |
| `public/index.html`, `public/style.css` | Menu e HUD em português |
| `server.mjs` | Servidor HTTP de arquivos estáticos, restrito a `public/` |
| `tests/` | Testes de lógica, servidor e navegador |
| `docs/ARCHITECTURE.md` | Decisões, limites e futura hospedagem multiplayer |
| `docs/QA.md` | Cobertura e roteiro de aceitação |
| `docs/source-assets/` | Manifesto e créditos originais preservados |

Os módulos são a implementação completa. Nenhum serviço remoto ou chave é necessário. A simulação está separada da apresentação para permitir a transferência das regras para um servidor futuro. **Neste protótipo a simulação roda no navegador e não oferece autoridade de servidor nem proteção contra adulteração pelo jogador.** O servidor HTTP não é um servidor multiplayer.

## Validação

```sh
npm test
npm ci
npx playwright install chromium
npx playwright test
```

O primeiro comando usa o executor nativo do Node. Os demais preparam e executam os testes de interface. As capturas do menu e gameplay ficam em `docs/welcome.png` e `docs/gameplay.png`.

## Assets e créditos

Os efeitos selecionados de Pokémon Mystery Dungeon: Explorers of Sky foram importados como folhas PNG individuais para 58 golpes, com oito ataques de fogo revisados em conjunto. [Fonte, IDs utilizados e processo de importação](docs/ATTACK_SPRITES.md).

Os sprites e retratos de Bulbasaur, Charmander e Squirtle vêm do PMDCollab/SpriteCollab, creditados à Chunsoft. A origem, revisão fixa, créditos e condições identificadas estão em `docs/SPRITES.md`. Consulte http://localhost:4173/sprites.html para ver as animações. O projeto usa arte oficial por solicitação do usuário e permanece um fan project local.

O pacote inicial `monster_rpg_antigravity_pack.zip` forneceu Rockhorn, ainda usado como inimigo provisório. Cenário e efeitos geométricos foram criados em código. Os arquivos antigos de Leafcub permanecem preservados, mas ele não é mais o personagem jogável.

O pacote descreve os placeholders como próprios, mas não contém uma licença formal de redistribuição comercial. Consulte `docs/source-assets/CREDITS.md` e confirme os direitos antes de distribuir esses arquivos comercialmente. Os pacotes de terceiros citados no prompt não estavam fornecidos no projeto e não foram baixados.

## Próximo passo

Jogar o Guardião da Clareira e validar o ritmo das três fases. O próximo incremento é transformar o spawn em evento de região e adicionar drops/quests.
# Deploy no Vercel com Supabase

O jogo continua funcionando localmente sem serviços externos. Em produção, o Supabase guarda usuário, senha (pelo Supabase Auth) e o save completo do jogador.

1. Crie um projeto no Supabase e abra **SQL Editor**. Execute [`supabase/schema.sql`](supabase/schema.sql).
2. Em **Authentication > Providers > Email**, mantenha Email ativo e desative **Confirm email** somente se este projeto for exclusivo do jogo. A interface pede apenas usuário e senha; internamente usa um endereço reservado que não recebe e-mail. Neste protótipo, a senha não poderá ser recuperada por e-mail. Projetos que exigem recuperação de senha devem coletar um e-mail real e verificar esse endereço.
3. A URL e a chave **publicável** do projeto estão em [`public/supabase-config.js`](public/supabase-config.js). É possível substituí-las no build com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Nunca exponha a `service_role`.
4. Importe o projeto no Vercel. O comando de build e a pasta de saída já estão definidos em [`vercel.json`](vercel.json).

O save local é mantido como cache e o save remoto é atualizado depois de mudanças no inventário, Pokémon, nível e exploração. A implementação online atual em `online-server.mjs` ainda depende de memória e SSE; antes do multiplayer em produção, presença, combate, guildas e boss compartilhado devem migrar para Supabase Realtime ou para um servidor persistente.

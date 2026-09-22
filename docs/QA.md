# QA da Fase 1

## Testes automatizados

Executar `npm test`:

- [x] Caminho contorna rio pela ponte e cada passo respeita colisão.
- [x] Todos os pontos de spawn são válidos.
- [x] Inputs inválidos, não finitos e slots inexistentes são rejeitados.
- [x] Projétil aplica dano, cooldown impede repetição e recompensa ocorre uma vez.
- [x] Ataque básico completa dois combates, nível 2 e desbloqueio de W.
- [x] XP atravessa múltiplos níveis e respeita o cap, sem XP excedente.
- [x] Cura respeita HP máximo e cooldown.
- [x] Morte bloqueia ações e respawn mantém nível.
- [x] Inimigo não reaparece perto do jogador.
- [x] Servidor restringe arquivos à pasta pública e recusa métodos de escrita.

Executar `npx playwright test` para verificar entrada, quatro slots, movimento, Q, cooldown, pausa, mapa, reinício, ausência de erros JS e combate/colisão executados no navegador.

Atualização de movimento e sprites: **17 testes Node + 4 Playwright aprovados**. Os testes também cobrem substituição imediata do destino, prioridade sobre seta mantida, ausência de deriva do destino pela câmera, direção lateral/diagonal, colisão em cantos, três iniciais e metadados dos sprites. Direções e aparência conferidas visualmente em `docs/pokemon-sprites.png`.

Evolução: **24 testes Node + 6 Playwright aprovados**. As verificações cobrem níveis 16/32/36, duas evoluções em um único grant de XP, XP excedente, troca de sprite e atributos, atualização do ataque Q, preservação de rota/cooldown, morte durante evolução, prévia das três linhas e atualização do HUD real.

Encontros selvagens: **30 testes Node + 6 Playwright aprovados**. As verificações cobrem Caterpie, Pidgey e Rattata com sprites próprios, seleção rotativa de espécies, direção lateral, parada com frame Idle fixo e ausência de deslocamento quando o movimento está parado.

## Aceitação humana

- [ ] Entrar, navegar segurando clique e avaliar resposta do movimento.
- [ ] Clicar num Caterpie, Pidgey ou Rattata, observar perseguição e ataque automático.
- [ ] Mirar Q em criatura em movimento e avaliar legibilidade do projétil.
- [ ] Derrotar duas criaturas, ver feedback de nível e usar W após sofrer dano.
- [ ] Cruzar a ponte e explorar extremos do mapa.
- [ ] Morrer e observar retorno à clareira.
- [ ] Ouvir os sons opcionais e avaliar volume.
- [ ] Avaliar HUD com zoom e em outras resoluções.
- [ ] Aprovar ritmo do combate antes de iniciar Fase 2.

## Não coberto nesta fase

Dispositivos móveis/touch completos, remapeamento, leitores de tela no mundo Canvas, testes de carga, latência, desconexão, grupos e reconexão persistente. Não existe gameplay de rede para validar essas condições ainda.

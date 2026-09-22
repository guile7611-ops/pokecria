# Revisão do combate antes da migração de progresso

## Validado nesta etapa

- Os 61 golpes especiais configurados e o ataque básico foram lançados em uma simulação controlada. Golpes ofensivos atingem um alvo em alcance; cura e buffs produzem seus efeitos.
- Golpes ofensivos não atingem alvos além do alcance declarado, considerando também raio de área e de respingo.
- Ataques de área, zonas persistentes e respingos respeitam paredes entre o efeito e o alvo. Não é possível colocar o centro de uma área ou zona do outro lado de uma parede.
- Imunidade de tipo resulta em zero dano, sem evento de acerto nem recompensa. Dano após defesa é inteiro.
- Permanecem cobertos testes específicos de ataques corpo a corpo, projéteis, ondas, canalização, feixes, chicotes, zonas, bosses e colisão na ponte.
- `npm test`: 86 testes passaram. Testes de navegador da galeria, repertório e sessão online: 5 passaram.

## Pendências antes de considerar o combate pronto

1. **Sincronizar a geometria do PvP com a simulação local.** `online-server.mjs` ainda resolve parte dos golpes no momento do lançamento, usando aproximações de linha e alcance. Projéteis e áreas precisam respeitar obstáculos e tempos de viagem da mesma forma que no combate com criaturas.
2. **Revisar o equilíbrio jogando.** Medir tempo para derrotar criaturas e bosses com os nove iniciais em níveis baixo, médio e alto; ajustar recargas, dano por acerto, cura e duração de controle.
3. **Verificar leitura visual golpe a golpe.** A cobertura automática confirma carregamento e alguns efeitos específicos, mas ainda falta conferir em jogo a origem, direção, escala e duração de cada animação.
4. **Atualizar os testes antigos da tela inicial.** Parte dos roteiros de navegador ainda procura a seleção de inicial anterior ao fluxo de conta e ovos; esses testes não representam a interface atual.

Após essas pendências, priorizar sensação de movimento e resposta dos golpes, feedback de acerto e telegráficos, menus e legibilidade do mapa. Contas e migração de progresso ficam para a etapa final, conforme decidido.

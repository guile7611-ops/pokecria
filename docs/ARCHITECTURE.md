# Decisões e integração

## Ambiente identificado

- Windows; Node.js 24.14.0 disponível.
- Pasta de projeto ausente no início, sem engine, linguagem ou hospedagem predefinidas.
- Framework escolhido: APIs nativas Canvas 2D e DOM; linguagem: JavaScript ES Modules.
- Dependências de execução: nenhuma externa. Playwright é apenas dependência de desenvolvimento.
- Asset pack local inspecionado antes de produzir cenário substituto; manifesto e créditos preservados.
- Os iniciais são Bulbasaur, Charmander e Squirtle. Sprites oficiais via PMDCollab foram integrados por solicitação posterior do usuário; veja `SPRITES.md`. As nove formas das três linhas já têm dados e animações locais.

## Fluxo

Input → `Simulation.command()` → passo fixo → estado e eventos → renderer/HUD/áudio.

Os comandos contêm intenção (destino, alvo, slot), não dano ou XP. As regras verificam disponibilidade de habilidade, cooldown, alcance, obstáculo e estado de vida. Progressão e learnset estão em dados. Nenhuma biblioteca gráfica entra no módulo de simulação.

O mapa usa tiles de 32 pixels e obstáculos separados dos sprites. Movimento livre usa segmento direto; desvios usam A* com oito vizinhos e simplificação com verificação de colisão do corpo inteiro, sem corte diagonal de cantos. Cada novo comando substitui o anterior. O projétil avança em subpassos para evitar atravessar alvos ou paredes. Inimigos possuem pontos fixos válidos, limite de seis entidades e tempo de reaparecimento, impedido perto do jogador.

O renderer armazena o terreno em canvas auxiliar e descarta árvores fora da câmera. A câmera interpola sua posição; não há interpolação de rede porque não há rede de gameplay. Os três iniciais usam seis animações, oito direções, durações e pivôs derivados dos arquivos PMD originais. Rockhorn ainda usa placeholders front/back.

## Hospedagem multiplayer — decisão ainda aberta

O documento não informa conta de nuvem, provedor, domínio, orçamento ou credenciais. Nenhum deploy remoto foi feito. O servidor local escuta apenas em `127.0.0.1:4173`; `PORT` e `HOST` permitem configuração explícita.

Para a Fase 3, a proposta é executar esta simulação num serviço Node.js persistente com WebSocket em VPS ou contêiner que aceite conexões longas, atrás de TLS. O provedor será escolhido quando essa fase for autorizada/definida. Não usar hospedagem exclusivamente estática como servidor de regras.

Integração planejada, não implementada:

1. Transportar intenções sequenciadas para o servidor; validar esquema, limites de frequência e sessão.
2. Mover a instância `Simulation` para o servidor; o cliente passa a apresentar snapshots.
3. Adicionar jogadores por ID, instâncias e transições de região; o modelo atual é de um jogador.
4. Sincronizar snapshots, interpolar entidades remotas e medir latência antes de prediction/reconciliation.
5. Adicionar autenticação e PostgreSQL com transações, ownership e migrações para perfis e recompensas.
6. Testar reconexão, duplicidade de sessão, spam de comandos, consistência e carga.

Essa separação reduz acoplamento, mas não significa que multiplayer esteja pronto. A versão local pode ser alterada pelo console do navegador; não deve ser usada como autoridade de jogo online.

## Progressão incremental

Fase 1 implementada e testada automaticamente; aguarda avaliação humana do ritmo e da sensação dos controles.

Fase 2 parcial implementada: dados das três linhas, evolução por nível, spritesheets e preview de transformação. Quatro habilidades efetivas, IA expandida e boss com telegráficos continuam pendentes.

Fase 3: servidor autoritativo, sessões, autenticação, multiplayer e persistência real.

Fases 4 e 5: regiões, quests, itens, conteúdo e polimento conforme o documento mestre.

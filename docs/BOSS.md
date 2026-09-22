# Guardião da Clareira

O próximo conteúdo jogável é o boss regional, localizado no setor sudeste da floresta. Ele aparece como um Venusaur original de encontro, com o nome `Guardião da Clareira`.

O boss tem 420 HP, três fases e recompensa de 180 XP. Ao chegar a 66% e 33% de vida, muda de fase. O ataque principal fixa um círculo no jogador, mostra o telegráfico e só aplica dano quando o tempo termina; sair da área evita o golpe. A área cresce por fase: 65, 85 e 110 pixels. A fase final reduz o intervalo entre ataques.

Ao ser derrotado, o jogador recebe a recompensa uma vez, o boss permanece fora da arena por 45 segundos e retorna com vida cheia e fase 1. A barra do boss, a fase atual, o status do telegráfico e o círculo de perigo aparecem no HUD e no cenário.

## Teste manual

1. Entre na floresta e avance até o canto sudeste.
2. Clique no Guardião para selecioná-lo.
3. Observe o círculo laranja antes do impacto.
4. Clique fora do círculo durante o aviso; a vida deve permanecer.
5. Ataque o boss até 66% e 33% para conferir as transições.
6. Derrote-o e confirme a mensagem, XP e retorno após o respawn.

27 testes de lógica e 6 testes de navegador passaram após essa integração. A versão ainda é solo e local: o boss não está sincronizado por rede e a recompensa ainda não é persistida em banco.

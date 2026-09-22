# Sprites Pokémon e prioridade de movimento

## Entrega

Bulbasaur, Charmander e Squirtle são selecionáveis no menu. A pausa permite trocar de Pokémon, iniciando uma sessão nova. Cada um tem projétil elemental em Q. O balanceamento continua compartilhado para preservar o ciclo validado do protótipo; os learnsets atuais são simplificados, não tabelas canônicas completas.

Cada espécie tem seis animações: Idle, Walk, Attack, Shoot, Hurt e Faint. As folhas possuem oito direções: frente, frente/direita, direita, costas/direita, costas, costas/esquerda, esquerda e frente/esquerda. O renderer usa as durações do XML e o ponto branco do Shadow.png como pivô por quadro. A hitbox continua independente do sprite.

Veja http://localhost:4173/sprites.html para comparar os três personagens em todas as direções e alternar estados. As folhas são carregadas localmente, sem requisições externas durante o jogo.

## Origem e créditos

- Repositório: https://github.com/PMDCollab/SpriteCollab
- Revisão fixada: `0b7ac414f7c1c06f8993d7bf0ceecbe4e8938891`.
- Bulbasaur: `sprite/0001`, retrato `portrait/0001/Normal.png`.
- Charmander: `sprite/0004`, retrato `portrait/0004/Normal.png`.
- Squirtle: `sprite/0007`, retrato `portrait/0007/Normal.png`.
- Os registros dos sprites identificam **CHUNSOFT**, licença `Unspecified`; os retratos Normal também têm crédito CHUNSOFT.
- Pokémon e a arte oficial permanecem pertencentes aos respectivos titulares. A política CC BY-NC do repositório para contribuições da comunidade não foi tratada como uma licença comercial da arte oficial.
- Integração para o fan project local, conforme solicitação expressa do usuário de usar sprites oficiais disponíveis.
- PNGs preservados sem alteração. Recorte, ampliação e ancoragem são feitos pelo renderer. Não foram usados sprites gerados por IA na entrega final.

Os `credits.txt`, `portrait-credits.txt` e `AnimData.xml` de cada espécie acompanham os arquivos em `public/assets/pokemon/`. A licença, README e lista de nomes do repositório estão preservados em `docs/source-assets/pmdcollab/`.

Importação reproduzível no Windows:

```powershell
./scripts/import-pmd-sprites.ps1
```

O script baixa apenas as três espécies, seus retratos e seis estados; gera `public/sprite-data.js` a partir do XML e dos marcadores de pivô. Ele não executa código baixado.

## Movimento

Um clique novo substitui a rota inteira, limpa a perseguição automática e cancela a animação do ataque anterior. Clique em obstáculo interrompe a rota antiga. Uma seta pressionada antes do clique não volta a sobrescrever o destino por repetição de tecla; soltar e pressionar novamente devolve o controle ao teclado.

Manter o mouse pressionado só atualiza o destino quando o cursor se move. Assim, o movimento da câmera não transforma um clique parado em uma sequência de destinos diferentes.

Em espaço livre, o percurso é direto, inclusive lateral e diagonal. Com obstáculos, A* usa oito vizinhos e simplifica a rota com verificação do corpo inteiro. A diagonal não permite atravessar cantos de obstáculos. Velocidade diagonal e horizontal são iguais.

## Verificação

17 testes Node e 4 testes Playwright passaram. Cobertura nova: inversão imediata, interrupção de perseguição, destino inválido, diagonal, cantos, seleção dos três iniciais, dimensões das folhas, durações, pivôs, oito direções, clique durante seta pressionada, cursor imóvel com câmera em movimento e carregamento da galeria.

Evoluções, sprites dos inimigos Pokémon e tilesets adicionais não fazem parte desta alteração.

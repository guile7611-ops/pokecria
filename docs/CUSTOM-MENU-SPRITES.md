# Sprites personalizados dos menus

O conjunto fica em `public/assets/ui/`. Cada ícone é um PNG individual com transparência, sem recortes de uma spritesheet:

- `bag.png`: mochila e inventário
- `info.png`: ficha e informações do Pokémon
- `stats.png`: atributos e progressão
- `types.png`: tipagens, fraquezas e resistências
- `map.png`: minimapa e atlas
- `settings.png`: som e configurações
- `pause.png`: pausa e descanso
- `battle.png`: combate, marca e tela inicial

As versões geradas em resolução integral foram preservadas em `public/assets/ui/source/`. Os arquivos usados pela interface foram recortados e otimizados para 96 × 96 pixels pelo script `scripts/build-menu-sprites.mjs`.

## Direção visual e prompts

As imagens foram criadas pelo gerador de imagens integrado, no modo `stylized-concept`. Prompt base: “ícone isolado para menu de RPG de captura de criaturas; pixel art polida em 32 bits; linguagem visual coesa em verde floresta e dourado; leitura clara em 48 × 48; luz superior esquerda; PNG realmente transparente; um único objeto; sem texto, borda, fundo, grade, spritesheet ou marca d’água”.

O objeto específico de cada geração foi, respectivamente: mochila verde com fecho de cápsula; enciclopédia portátil de criaturas; medalha de treinamento com gemas de atributo; emblema circular de folha, água, fogo e eletricidade; mapa regional dobrado; engrenagem mecânica com cápsula; lanterna de acampamento com símbolo de pata; garras cruzadas com orbe elemental.

Os símbolos são originais e apenas seguem a linguagem geral de interfaces de RPG de captura de criaturas; não reproduzem logotipos nem personagens existentes.

# Cadastro de golpes por nível

O elenco jogável é dividido automaticamente em três lotes de 52 espécies, em ordem alfabética. Os lotes são uma forma de auditar a cobertura; todos precisam passar juntos antes do build.

## Fonte dos dados

- Pokémon presentes em **Legends: Z-A** usam exclusivamente a tabela de aprendizado por nível desse jogo, importada do PokémonDB.
- Espécies ausentes de Legends: Z-A usam a versão oficial mais recente disponível no PokéAPI. A versão escolhida fica registrada em `LEARNSET_SOURCES`.
- Golpes aprendidos por TM, HM, tutor ou reprodução não entram nesta tabela.

## Adição de uma espécie

1. Cadastre a espécie no elenco e sua linha evolutiva.
2. Execute `npm run moves:sync`.
3. Execute `npm test`.

O sincronizador pesquisa novamente as tabelas, cria implementações em tempo real para golpes ainda ausentes e gera uma folha animada exclusiva de oito quadros para cada golpe. O build falha se uma espécie ficar sem fonte, tabela, implementação ou animação, ou se o antigo conjunto genérico reaparecer.

Pokémon já salvos recebem `moveLoadoutVersion: 2` quando são carregados. Golpes que não pertencem à espécie são removidos e os atalhos livres passam a usar golpes válidos já aprendidos no nível atual.

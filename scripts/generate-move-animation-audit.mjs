import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,basename} from 'node:path';
import {ABILITIES} from '../public/data.js';
import {animationProfileFor,PRIORITY_MOVE_IDS} from '../public/move-animation-profiles.js';
import {EXTERNAL_MOVE_VFX} from '../public/external-move-vfx.js';

const root=resolve(import.meta.dirname,'..'),sourceRoot=process.env.MOVE_SOURCE_ROOT;
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const title=value=>String(value||'').replace(/-/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\b\w/g,c=>c.toUpperCase());
async function files(path){try{return await readdir(path,{recursive:true,withFileTypes:true}).then(rows=>rows.filter(row=>row.isFile()).map(row=>resolve(row.parentPath,row.name)));}catch{return [];}}

let ebdx=new Set(),gen3=new Set(),showdown=new Set();
if(sourceRoot){
 for(const file of await files(resolve(sourceRoot,'ebdx')))if(extname(file).toLowerCase()==='.rb')ebdx.add(normalize(basename(file,'.rb')));
 for(const file of await files(resolve(sourceRoot,'gen3')))if(['.ogg','.anm'].includes(extname(file).toLowerCase()))gen3.add(normalize(basename(file,extname(file)).replace(/ charging$/i,'')));
 try{const source=await readFile(resolve(sourceRoot,'battle-animations-moves.ts'),'utf8');for(const match of source.matchAll(/^\s*([a-z0-9]+):\s*\{/gmi))showdown.add(normalize(match[1]));}catch{}
}
const esc=value=>String(value??'—').replaceAll('|','\\|').replaceAll('\n',' ');
let pmd=0,procedural=0,fallback=0,external=0,priority=0,exactAudio=0,ebdxMatches=0,gen3Matches=0,showdownMatches=0;
const rows=[];
for(const ability of Object.values(ABILITIES)){
 const profile=animationProfileFor(ability),keys=[ability.officialMove,ability.id,ability.name].map(normalize).filter(Boolean),has=set=>keys.some(key=>set.has(key));
 const hitEbdx=has(ebdx),hitGen3=has(gen3),hitShowdown=has(showdown);if(hitEbdx)ebdxMatches++;if(hitGen3)gen3Matches++;if(hitShowdown)showdownMatches++;
 const current=ability.id==='basic'?'Animação corporal nativa':ability.vfx?.startsWith('pmd/')?'Sprite PMD associado':`Folha procedural anterior (${ability.motif||'genérico'})`;
 let candidate,format,deps,quality,adaptation;
 if(hitEbdx){candidate='EBDX Move & Common Animation Pack';format='Ruby + PNG + OGG/WAV/MP3';deps='Pokémon Essentials/EBDX na origem; conversor de timing no jogo';quality='Alta';adaptation='Alta: áudio e coreografia convertidos para o renderer 2D';}
 else if(hitGen3){candidate='Gen 3 Move Animation Pack';format='.anm + PNG + OGG';deps='Pokémon Essentials na origem; conversor de quadros no jogo';quality='Alta, estética Gen 3';adaptation='Alta: quadros/timing combinam com a direção pixel art';}
 else if(hitShowdown){candidate='Pokémon Showdown';format='TypeScript (timeline/coreografia)';deps='Sem sprites reutilizados; tradução da timeline para o renderer';quality='Alta em movimento';adaptation='Alta: usado como referência de direção, atraso e impacto';}
 else if(ability.vfx?.startsWith('pmd/')){candidate='PMD Explorers of Sky Attack Effects';format='PNG/spritesheet';deps='Nenhuma em runtime';quality='Alta, pixel art';adaptation='Integrada diretamente com perfil local';}
 else {candidate='Gerador vetorial local + referências FRLG/EBDX';format='SVG gerado → PNG 8 quadros';deps='sharp somente no build';quality='Média/alta, pixel art escalável';adaptation='Integrada; preserva fallback sem download em runtime';}
 const imported=EXTERNAL_MOVE_VFX[ability.id];let state;if(ability.id==='basic'){state='Fallback nativo: golpe sem overlay próprio';fallback++;}else if(PRIORITY_MOVE_IDS.has(ability.id)){candidate='Coreografia autoral em camadas + referências Pokémon';format='PNG 8 quadros + composição runtime';deps='sharp somente no build';quality='Alta, pixel art em camadas';adaptation='Integrada com conjuração, trajetória e impacto próprios';state=`Refeito: coreografia prioritária própria (${profile.motif})`;priority++;if(imported?.audio)exactAudio++;}else if(imported){state=`Substituído por recurso exato ${imported.source==='gen3'?'Gen 3':'EBDX'} (${imported.resources.join(', ')})`;external++;if(imported.audio)exactAudio++;}else if(ability.vfx?.startsWith('pmd/')){state=`Integrado: PMD + fases locais (${profile.motif})`;pmd++;}else{state=`Animação procedural específica (${profile.motif})`;procedural++;}
 rows.push(`| ${esc(ability.name)} | \`${ability.id}\` | ${esc(title(ability.officialMove||ability.id))} | ${esc(current)} | ${candidate} | ${format} | ${deps} | ${quality} | ${esc(ability.behavior||'direct')} · ${esc(ability.type||'Normal')} | ${adaptation} | ${state} |`);
}
const text=`# Cobertura de animações de golpes\n\nGerado em 2026-09-23 a partir do catálogo executável do projeto. A coluna **animação atual** registra o estado antes desta revisão; **estado da integração** registra o resultado atual. Nomes oficiais em inglês usam \`officialMove\` quando disponível e o ID normalizado nos golpes próprios do protótipo.\n\n## Resumo\n\n- Golpes executáveis: **${Object.keys(ABILITIES).length}**\n- Golpes prioritários refeitos com três fases próprias: **${priority}**\n- Recursos externos exatos usados diretamente: **${external}**\n- Golpes com áudio específico da fonte: **${exactAudio}**\n- Folhas procedurais mantidas como alternativa: **${procedural}**\n- Associações PMD mantidas onde não houve conversão externa: **${pmd}**\n- Fallback nativo mantido: **${fallback}** (Ataque básico, cuja leitura vem da animação corporal do Pokémon)\n- Correspondências exatas encontradas: EBDX **${ebdxMatches}**, Gen 3 **${gen3Matches}**, Pokémon Showdown **${showdownMatches}**\n- Motivos visuais distintos usados pelo gerador: **${new Set(Object.values(ABILITIES).map(a=>animationProfileFor(a).motif)).size}**\n\n## Tabela completa\n\n| Nome no jogo | ID | Nome/slug em inglês | Animação anterior | Fonte candidata escolhida | Formato | Dependências | Qualidade | Condições de uso | Possibilidade de adaptação | Estado da integração |\n|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`;
await mkdir(resolve(root,'docs'),{recursive:true});await writeFile(resolve(root,'docs','move-animation-coverage.md'),text);
console.log(JSON.stringify({total:Object.keys(ABILITIES).length,priority,external,exactAudio,pmd,procedural,fallback,ebdxMatches,gen3Matches,showdownMatches},null,2));

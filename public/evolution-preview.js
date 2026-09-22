import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { CREATURES, ABILITIES } from './data.js';
import { nextEvolution, evolutionLine, xpToLevel } from './progression.js';
const $ = id => document.getElementById(id);
let sim = new Simulation(), renderer = new Renderer($('preview'), sim), feedbackUntil = 0;
function reset() {
  sim = new Simulation($('starter').value); sim.enemies = []; sim.events = [];
  sim.player.x = 640; sim.player.y = 560; renderer.sim = sim; renderer.camera.x = 640; renderer.camera.y = 560;
  $('feedback').textContent = ''; renderUI();
}
function renderUI() {
  const p = sim.player, next = nextEvolution(p.id);
  $('name').textContent = p.name; $('level').textContent = `Nível ${p.level} · ${p.element}`;
  const src = `/assets/pokemon/${p.id}/portrait.png`;
  if ($('portrait').getAttribute('src') !== src) $('portrait').src = src;
  $('portrait').alt = p.name; $('hp').textContent = p.maxHp; $('attack').textContent = p.attack; $('defense').textContent = p.defense;
  $('chain').textContent = evolutionLine(p.id).map(e => `${CREATURES[e.id].name}${e.requiredLevel > 1 ? ' (Nv. ' + e.requiredLevel + ')' : ''}`).join(' → ');
  $('ability').textContent = `Q · ${ABILITIES[p.slots[0]].name}`;
  $('next').disabled = !next; $('next').textContent = next ? `XP até ${CREATURES[next.targetCreatureId].name} · Nv. ${next.requiredLevel}` : 'Forma final alcançada';
  $('level-up').disabled = false;
  $('history').innerHTML = p.evolutionHistory.map(e => `<li>Nível ${e.level}: ${CREATURES[e.from].name} → ${CREATURES[e.to].name}</li>`).join('');
}
$('starter').onchange = reset; $('reset').onclick = reset;
$('next').onclick = () => { const next = nextEvolution(sim.player.id); if (next) sim.gainXP(xpToLevel(sim.player, next.requiredLevel)); renderUI(); };
$('level-up').onclick = () => { sim.gainXP(xpToLevel(sim.player, sim.player.level + 1)); renderUI(); };
$('preview').onclick = e => sim.command({ type: 'move', ...renderer.worldPoint(e.clientX, e.clientY) });
reset(); let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; sim.step(dt);
  for (const event of sim.events.splice(0)) if (event.type === 'evolve') { $('feedback').textContent = `${CREATURES[event.from].name} evoluiu!\n${CREATURES[event.to].name}`; feedbackUntil = sim.time + 3; }
  $('feedback').style.opacity = sim.time < feedbackUntil ? '1' : '0'; renderer.draw(dt, true); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

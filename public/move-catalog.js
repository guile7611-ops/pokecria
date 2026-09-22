// Move definitions retained for future TM/HM acquisition. Combat values are
// real-time adaptations; type, category and visual motif follow the move.
export const MOVE_CATALOG = [
  {id:'thunderbolt',name:'Choque do Trovão',officialName:'Thunderbolt',type:'Electric',category:'Special',behavior:'projectile',damage:32,range:390,speed:510,cooldown:6,source:'TM',motif:'lightning',description:'Um raio elétrico concentrado percorre o alvo.'},
  {id:'iceBeam',name:'Raio de Gelo',officialName:'Ice Beam',type:'Ice',category:'Special',behavior:'projectile',damage:33,range:410,speed:490,cooldown:7,source:'TM',motif:'ice',description:'Dispara uma linha de cristais de gelo.'},
  {id:'shadowBall',name:'Bola Sombria',officialName:'Shadow Ball',type:'Ghost',category:'Special',behavior:'projectile',damage:32,range:370,speed:430,cooldown:7,source:'TM',motif:'shadow',description:'Lança um orbe de energia espectral.'},
  {id:'psychic',name:'Psíquico',officialName:'Psychic',type:'Psychic',category:'Special',behavior:'area',damage:29,radius:105,range:300,cooldown:8,source:'TM',motif:'psychic',description:'Ondas mentais atingem a área indicada.'},
  {id:'earthquake',name:'Terremoto',officialName:'Earthquake',type:'Ground',category:'Physical',behavior:'area',damage:39,radius:140,range:0,selfCentered:true,cooldown:11,source:'TM',motif:'quake',description:'Rachaduras se espalham pelo chão ao redor do usuário.'},
  {id:'rockSlide',name:'Deslizamento de Pedras',officialName:'Rock Slide',type:'Rock',category:'Physical',behavior:'area',damage:33,radius:110,range:290,cooldown:9,source:'TM',motif:'rocks',description:'Rochas caem sobre uma área.'},
  {id:'sludgeBomb',name:'Bomba de Lodo',officialName:'Sludge Bomb',type:'Poison',category:'Special',behavior:'projectile',damage:34,range:350,speed:390,cooldown:7,source:'TM',motif:'sludge',description:'Arremessa uma esfera venenosa.'},
  {id:'dragonPulse',name:'Pulso do Dragão',officialName:'Dragon Pulse',type:'Dragon',category:'Special',behavior:'projectile',damage:35,range:400,speed:480,cooldown:8,source:'TM',motif:'dragon',description:'Ondas dracônicas atravessam o campo.'},
  {id:'moonblast',name:'Explosão Lunar',officialName:'Moonblast',type:'Fairy',category:'Special',behavior:'projectile',damage:35,range:390,speed:440,cooldown:8,source:'TM',motif:'moon',description:'Uma lua luminosa explode em fagulhas feéricas.'},
  {id:'flashCannon',name:'Canhão de Flash',officialName:'Flash Cannon',type:'Steel',category:'Special',behavior:'projectile',damage:34,range:420,speed:500,cooldown:8,source:'TM',motif:'steel',description:'Dispara um feixe metálico brilhante.'},
  {id:'xScissor',name:'Tesoura X',officialName:'X-Scissor',type:'Bug',category:'Physical',behavior:'direct',damage:31,range:75,cooldown:5,source:'TM',motif:'cross',description:'Duas lâminas cruzadas cortam o alvo.'},
  {id:'brickBreak',name:'Quebra-Telha',officialName:'Brick Break',type:'Fighting',category:'Physical',behavior:'direct',damage:30,range:75,cooldown:5,source:'TM',motif:'punch',description:'Um golpe vertical parte a defesa do alvo.'},
  {id:'airSlash',name:'Corte de Ar',officialName:'Air Slash',type:'Flying',category:'Special',behavior:'projectile',damage:28,range:390,speed:490,cooldown:6,source:'TM',motif:'wind',description:'Uma lâmina de ar avança contra o alvo.'},
  {id:'surf',name:'Surfar',officialName:'Surf',type:'Water',category:'Special',behavior:'area',damage:36,radius:145,range:270,cooldown:10,source:'HM',motif:'wave',description:'Uma grande onda varre a área.'},
  {id:'waterfallMove',name:'Cachoeira',officialName:'Waterfall',type:'Water',category:'Physical',behavior:'direct',damage:36,range:85,cooldown:7,source:'HM',motif:'waterfall',description:'Uma coluna d’água despenca sobre o alvo.'},
  {id:'cut',name:'Cortar',officialName:'Cut',type:'Normal',category:'Physical',behavior:'direct',damage:24,range:75,cooldown:4,source:'HM',motif:'slash',description:'Um corte horizontal preciso.'},
  {id:'strength',name:'Força',officialName:'Strength',type:'Normal',category:'Physical',behavior:'direct',damage:34,range:80,cooldown:6,source:'HM',motif:'impact',description:'Um impacto pesado sacode o alvo.'},
  {id:'fly',name:'Voar',officialName:'Fly',type:'Flying',category:'Physical',behavior:'area',damage:34,radius:80,range:260,cooldown:10,source:'HM',motif:'feathers',description:'O usuário mergulha dos céus na área indicada.'},
  {id:'rockSmash',name:'Quebra-Rocha',officialName:'Rock Smash',type:'Fighting',category:'Physical',behavior:'direct',damage:25,range:75,cooldown:5,source:'HM',motif:'shatter',description:'Estilhaços de pedra irrompem após o golpe.'},
  {id:'flashMove',name:'Flash',officialName:'Flash',type:'Normal',category:'Status',behavior:'buff',duration:6,defenseBonus:5,cooldown:12,source:'HM',motif:'flash',description:'Um clarão envolve o usuário; no combate, eleva a defesa temporariamente.'},
  {id:'dive',name:'Mergulho',officialName:'Dive',type:'Water',category:'Physical',behavior:'area',damage:31,radius:90,range:240,cooldown:9,source:'HM',motif:'bubbles',description:'Bolhas sobem antes do impacto aquático.'},
  {id:'auraSphere',name:'Esfera de Aura',officialName:'Aura Sphere',type:'Fighting',category:'Special',behavior:'projectile',damage:31,range:390,speed:460,cooldown:7,source:'TM',motif:'aura',description:'Uma esfera de aura azul avança em espiral.'},
  {id:'energyBall',name:'Bola de Energia',officialName:'Energy Ball',type:'Grass',category:'Special',behavior:'projectile',damage:31,range:380,speed:420,cooldown:7,source:'TM',motif:'seed',description:'Concentra energia vegetal em uma esfera.'},
  {id:'flameCharge',name:'Carga de Chamas',officialName:'Flame Charge',type:'Fire',category:'Physical',behavior:'direct',damage:27,range:80,cooldown:5,source:'TM',motif:'flame',description:'Uma investida cercada de chamas.'},
];

export const MOVE_CATALOG_BY_ID = Object.fromEntries(MOVE_CATALOG.map(move => [move.id, move]));

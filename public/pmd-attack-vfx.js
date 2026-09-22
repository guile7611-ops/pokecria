// Visual matches selected from the numbered Mystery Dungeon effect archive.
// These are visual associations, not a claim about the original game move IDs.
export const PMD_MOVE_SPRITES={
 leaf:'0129',bloom:'0186',ember:'0053',water:'0013',recover:'0044',
 vineBurst:'0131',flamethrower:'0016',inferno:'0028',aquaWave:'0251',hydroCannon:'0021',
 razorLeaf:'0129',solarSeed:'0145',flame:'0070',fireBlast:'0024',waterPulse:'0081',
 growth:'0068',poisonPowder:'0156',smokescreen:'0184',fireSpin:'0030',tailWhip:'0064',
 rapidSpin:'0058',synthesis:'0105',flameWheel:'0030',iceFang:'0155',crunch:'0122',megaDrain:'0094',
 agility:'0142',sandAttack:'0117',peck:'0115',mudSlap:'0117',whirlpool:'0058',
 protect:'0135',neutralPulse:'0039',impact:'0104',starBurst:'0253',
 thunderbolt:'0019',iceBeam:'0141',shadowBall:'0176',psychic:'0017',
 earthquake:'0259',rockSlide:'0221',sludgeBomb:'0234',moonblast:'0160',
 flashCannon:'0253',xScissor:'0123',brickBreak:'0137',airSlash:'0244',
 surf:'0251',waterfallMove:'0021',cut:'0149',strength:'0231',fly:'0232',
 rockSmash:'0221',flashMove:'0253',dive:'0021',auraSphere:'0203',
 energyBall:'0067',flameCharge:'0225',
 aquaJet:'0021',aquaRing:'0058',bonemerang:'0104',braveBird:'0232',bugBuzz:'0126',bulldoze:'0259',bulletPunch:'0137',
 calmMind:'0142',darkPulse:'0176',dragonBreath:'0203',dragonClaw:'0123',drainingKiss:'0160',earthPower:'0259',flareBlitz:'0225',
 hurricane:'0244',icyWind:'0141',ironHead:'0231',leafBlade:'0149',liquidation:'0021',mysticalFire:'0070',psybeam:'0017',reflect:'0135',
 sludgeWave:'0234',swordsDance:'0253',thunder:'0019',thunderWave:'0019',vineWhip:'0131',wingAttack:'0244',
};

// These starter attacks have phase-specific art; their other phases remain
// individually authored for each starter family.
export const PMD_TRAVEL={leaf:'0129',razorLeaf:'0129',ember:'0053',flame:'0070',fireBlast:'0024',flamethrower:'0016',water:'0013',waterPulse:'0081',aquaWave:'0251',solarSeed:'0145',vineBurst:'0131'};
export const PMD_IMPACT={inferno:'0028',whirlpool:'0058',hydroCannon:'0021'};
export const PMD_IDS=[...new Set([...Object.values(PMD_MOVE_SPRITES),...Object.values(PMD_TRAVEL),...Object.values(PMD_IMPACT)])].sort();

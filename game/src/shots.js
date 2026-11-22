// Screenshot staging for Puerto Verde.
// ?shot=cover|drive|mission|menu stages the matching scene, then the
// main loop paints twice and sets window.__shotReady.
// Staged scenes freeze the world so each screenshot is deterministic per seed.
export function stageShot(game, shot) {
  const g = game;
  if (shot === 'menu') {
    g.mode = 'menu';
    g.showMenu();
    return;
  }
  g.hideMenu();
  g.mode = 'playing';
  g.missions.index = 0;
  g.missions.state = 'idle';
  if (shot === 'cover') {
    // The money frame: a 5-star chase on Shoreline Drive at golden hour —
    // police units flanking, a roadblock ahead, a burning wreck and a
    // fireball explosion on the roadside, VERDE AIR 1 overhead, sea at right.
    g.placePlayerInCar('RUKAN PELO GT', 270, -55, Math.PI);
    g.playerCar.speed = 24;
    g.shotDrive = true;
    g.police.heat = 88; g.police.wanted = 5;
    g.police.stageChase(270, -55, Math.PI);
    g.police.stageRoadblock(270, -55, Math.PI);
    g.spawnBurningWreck(278, -78);
    g.spawnExplosion(282, -92);
    g.missions.index = 8;
    g.missions.start();
    g.missions.timer = 41;
    g.hud.showDialog('MIRA KESANG', 'FIXER — PUERTO VERDE',
      'Five stars, kid. SWAT is rolling. Forty-five seconds of hell — then you disappear.', 30);
    g.money = 24840;
    g.respect = 78;
    g.clockMinutes = 18 * 60 + 47;
  } else if (shot === 'drive') {
    // Cruising the coast road, clean, radio on.
    g.placePlayerInCar('VELA COMET S', 270, 100, Math.PI);
    g.playerCar.speed = 24;
    g.shotDrive = true;
    g.police.heat = 0; g.police.wanted = 0;
    g.missions.index = 1;
    g.missions.start();
    g.missions.timer = 96;
    g.money = 8450;
    g.respect = 38;
    g.clockMinutes = 18 * 60 + 12;
    g.hud.showDialog('MIRA KESANG', 'FIXER — PUERTO VERDE',
      'Case stays shut, car stays fast. Dock crew pays in cash, no questions. Move.', 30);
  } else if (shot === 'mission') {
    // On foot at the pier, checkpoint job in progress.
    g.placePlayerOnFoot(430, 0, Math.PI / 2);
    g.police.heat = 18; g.police.wanted = 1;
    g.missions.index = 2;
    g.missions.start();
    g.missions.timer = 142;
    g.money = 9200;
    g.respect = 45;
    g.clockMinutes = 18 * 60 + 30;
    g.hud.showDialog('MIRA KESANG', 'FIXER — PUERTO VERDE',
      'On foot from here, kid. The pier is long and the wind is loud — perfect for a quiet handoff.', 30);
  }
  // Snap the chase camera into place and let the world settle before the shot.
  g.snapCamera();
  g.settleFrames = 10;
}

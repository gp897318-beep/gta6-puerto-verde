// Puerto Verde city builder: coastal grid city at golden hour.
// Districts: Marina Beach (east, sea), Downtown (centre), Harbor (south),
// Palm Court suburb (north-west). Low-poly stylized: boxes, cylinders, palms.
import { mulberry32, pick, range, intRange } from './random.js';

export const CITY = {
  minX: -270, maxX: 270, minZ: -270, maxZ: 270,
  beachX: 285, seaX: 330,
  roadStep: 60,
};

export const STREET_NAMES = [
  { name: 'PALM ROW', z: -180 }, { name: 'CORAL AVE', z: -120 },
  { name: 'SUNSET BLVD', z: -60 }, { name: 'MARINA WAY', z: 0 },
  { name: 'HARBOR ST', z: 60 }, { name: 'LUMEN AVE', z: 120 },
  { name: 'PIER ROAD', z: 180 },
];
const AVENUES = [
  { name: 'MALECON', x: 210 }, { name: 'SHORELINE DR', x: 270 }, { name: 'DEL MAR ST', x: 150 },
  { name: 'VISTA AVE', x: 90 }, { name: 'CENTRAL PKWY', x: 30 },
  { name: 'JUNIPER ST', x: -30 }, { name: 'WESTGATE AVE', x: -90 },
  { name: 'CYPRESS BLVD', x: -150 }, { name: 'DOCKLAND RD', x: -210 },
  { name: 'FOUNDRY LANE', x: -270 },
];

export function streetNameAt(x, z) {
  let best = null, bd = 1e9;
  for (const s of STREET_NAMES) { const d = Math.abs(z - s.z); if (d < bd) { bd = d; best = s.name; } }
  let bestA = null, bdA = 1e9;
  for (const s of AVENUES) { const d = Math.abs(x - s.x); if (d < bdA) { bdA = d; bestA = s.name; } }
  return bd < bdA ? best : bestA;
}

// Puerto Verde districts: Marina + Beachfront on the coast, Old Port in the
// south, Canal District along the canal and the west, Downtown in the middle.
export function districtAt(x, z) {
  if (x > 200) return z < 0 ? 'MARINA' : 'BEACHFRONT';
  if (z >= 235) return 'OLD PORT';
  if (z >= 185 || x < -90) return 'CANAL DISTRICT';
  if (Math.abs(x) < 90 && Math.abs(z) < 90) return 'DOWNTOWN';
  return 'DOWNTOWN';
}

export const DISTRICTS = ['MARINA', 'BEACHFRONT', 'DOWNTOWN', 'CANAL DISTRICT', 'OLD PORT'];

function windowTexture(rng, base, lit) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 64, 128);
  for (let y = 8; y < 120; y += 14) {
    for (let x = 6; x < 58; x += 12) {
      const on = rng() < 0.55;
      g.fillStyle = on ? lit : 'rgba(20,24,40,0.9)';
      g.fillRect(x, y, 8, 9);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function buildCity(scene, seed) {
  const rng = mulberry32(seed);
  const colliders = [];
  const group = new THREE.Group();
  group.name = 'city';
  scene.add(group);

  // Golden-hour sky: big gradient dome via scene background + fog handled in main.
  // Ground base (grass/concrete).
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x5d6b52 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, 0);
  group.add(ground);

  // Sand beach + sea to the east.
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 620),
    new THREE.MeshLambertMaterial({ color: 0xe8c98f }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(CITY.beachX + 20, 0.02, 0);
  group.add(sand);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 900),
    new THREE.MeshLambertMaterial({ color: 0x1f6f8b, transparent: true, opacity: 0.92 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(CITY.seaX + 140, 0.05, 0);
  group.add(sea);

  // Roads: dark asphalt strips on the grid + sidewalks.
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x2e2e36 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0x8a8a86 });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8c86a });
  for (let x = CITY.minX; x <= CITY.maxX; x += CITY.roadStep) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(11, 560), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.03, 0); group.add(r);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(17, 560), walkMat);
    w.rotation.x = -Math.PI / 2; w.position.set(x, 0.015, 0); group.add(w);
    for (let z = -260; z <= 260; z += 20) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 6), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.06, z); group.add(d);
    }
  }
  for (let z = CITY.minZ; z <= CITY.maxZ; z += CITY.roadStep) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(560, 11), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(0, 0.03, z); group.add(r);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(560, 17), walkMat);
    w.rotation.x = -Math.PI / 2; w.position.set(0, 0.015, z); group.add(w);
  }

  // Buildings: one per block, downtown taller, beachfront hotels.
  const palettes = ['#c9a37e', '#b98a6d', '#8fa3b8', '#a8b0a0', '#d8b48f', '#7e93a8', '#c4b49a', '#9a8fa8'];
  const litCols = ['#ffd98a', '#ffb36b', '#9fd8ff'];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4038 });
  for (let bx = CITY.minX + 30; bx <= CITY.maxX - 30; bx += CITY.roadStep) {
    for (let bz = CITY.minZ + 30; bz <= CITY.maxZ - 30; bz += CITY.roadStep) {
      if (Math.abs(bx) < 20 && Math.abs(bz) < 20) continue; // central plaza
      if (bz === 240) continue; // the canal row stays open water
      if (rng() < 0.12) continue; // empty lot / park
      const downtown = Math.abs(bx) < 100 && Math.abs(bz) < 100;
      const beach = bx > 180;
      const h = downtown ? range(rng, 28, 70) : beach ? range(rng, 18, 42) : range(rng, 8, 26);
      const w = range(rng, 26, 40), d = range(rng, 26, 40);
      const tex = windowTexture(rng, pick(rng, palettes), pick(rng, litCols));
      tex.repeat.set(Math.max(1, Math.round(w / 11)), Math.max(1, Math.round(h / 11)));
      const mat = new THREE.MeshLambertMaterial({ map: tex });
      const b = new THREE.Mesh(boxGeo, mat);
      b.scale.set(w, h, d);
      b.position.set(bx + range(rng, -4, 4), h / 2, bz + range(rng, -4, 4));
      group.add(b);
      const roof = new THREE.Mesh(boxGeo, roofMat);
      roof.scale.set(w + 1, 1.2, d + 1);
      roof.position.set(b.position.x, h + 0.6, b.position.z);
      group.add(roof);
      colliders.push({ minX: b.position.x - w / 2, maxX: b.position.x + w / 2, minZ: b.position.z - d / 2, maxZ: b.position.z + d / 2 });
    }
  }

  // Central plaza: fountain + palms.
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 1.2, 24),
    new THREE.MeshLambertMaterial({ color: 0x6fb3d8 }));
  plaza.position.set(0, 0.6, 0);
  group.add(plaza);

  // Palm trees along Ocean Drive and the beach.
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2f8f4e });
  const palms = [];
  function palm(x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.55 * s, 9 * s, 6), trunkMat);
    trunk.position.y = 4.5 * s; trunk.rotation.z = 0.08;
    g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 4.5 * s, 4), leafMat);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.8 * s, 9.2 * s, Math.sin(a) * 1.8 * s);
      leaf.rotation.z = Math.cos(a) * 1.1;
      leaf.rotation.x = -Math.sin(a) * 1.1;
      g.add(leaf);
    }
    g.position.set(x, 0, z);
    group.add(g);
    palms.push(g);
  }
  for (let z = -250; z <= 250; z += 30) {
    palm(228, z + range(rng, -6, 6), range(rng, 0.9, 1.3));
    palm(252, z + 15 + range(rng, -6, 6), range(rng, 0.9, 1.3));
    if (rng() < 0.6) palm(-246, z, range(rng, 0.9, 1.2));
  }
  for (let i = 0; i < 40; i++) palm(range(rng, -240, 200), range(rng, -240, 240), range(rng, 0.8, 1.3));

  // Street lamps along main roads.
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x333338 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  for (let x = -240; x <= 240; x += 60) {
    for (const z of [-180, -60, 60, 180]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), poleMat);
      pole.position.set(x + 8, 3.5, z + 8);
      group.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), lampMat);
      bulb.position.set(x + 8, 7.1, z + 8);
      group.add(bulb);
    }
  }

  // Pier reaching into the sea (mission landmark).
  const pierMat = new THREE.MeshLambertMaterial({ color: 0xa8825a });
  for (let i = 0; i < 14; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 9), pierMat);
    plank.position.set(330 + i * 9, 0.8, 0);
    group.add(plank);
  }
  const pierEnd = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 30), pierMat);
  pierEnd.position.set(470, 0.8, 0);
  group.add(pierEnd);

  // The canal: a water channel across the Canal District (z 234-246) with
  // a bridge deck at every north-south road crossing it.
  const canal = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 12),
    new THREE.MeshLambertMaterial({ color: 0x2a7a8a }));
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(0, 0.07, 240);
  group.add(canal);
  const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
  for (let x = -270; x <= 270; x += 60) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), bridgeMat);
    b.rotation.x = -Math.PI / 2;
    b.position.set(x, 0.09, 240);
    group.add(b);
  }

  // Harbor cranes (Old Port, south of the canal).
  const craneMat = new THREE.MeshLambertMaterial({ color: 0xc96a2e });
  for (const cx of [-180, -60, 60]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 42, 4), craneMat);
    tower.position.set(cx, 21, 262);
    group.add(tower);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(34, 3, 3), craneMat);
    arm.position.set(cx + 12, 40, 262);
    group.add(arm);
  }

  // Verde Garage in the Old Port: low wide building where cars get upgraded.
  const garage = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 18),
    new THREE.MeshLambertMaterial({ color: 0x3a4a6a }));
  garage.position.set(-180, 4.5, 262);
  group.add(garage);
  const garageRoof = new THREE.Mesh(new THREE.BoxGeometry(36, 1, 20),
    new THREE.MeshLambertMaterial({ color: 0xffd23a }));
  garageRoof.position.set(-180, 9.5, 262);
  group.add(garageRoof);
  colliders.push({ minX: -197, maxX: -163, minZ: 253, maxZ: 271 });

  return { group, colliders, palms, rng };
}

// Side activities for Puerto Verde: street races, taxi fares, courier
// deliveries and hidden packages. All playable, repeatable, and paying
// cash + district standing. Markers glow in the world; press T nearby.
import { dist2d } from './random.js';

export const MARKERS = [
  { type: 'race', x: 210, z: 60, label: 'STREET RACE', color: 0xff3a3a },
  { type: 'taxi', x: 90, z: 0, label: 'TAXI STAND', color: 0xffd23a },
  { type: 'delivery', x: -90, z: 210, label: 'COURIER DEPOT', color: 0x3ad86a },
];

export const RACE_GATES = [
  { x: 210, z: -180, label: 'GATE 1' },
  { x: 90, z: -240, label: 'GATE 2' },
  { x: -90, z: -180, label: 'GATE 3' },
  { x: -210, z: -60, label: 'GATE 4' },
  { x: -90, z: 180, label: 'GATE 5' },
  { x: 210, z: 180, label: 'GATE 6' },
];

const FARE_SPOTS = [
  { x: 210, z: -180, label: 'MARINA' }, { x: -210, z: 180, label: 'CANAL DISTRICT' },
  { x: 90, z: -120, label: 'DOWNTOWN' }, { x: -90, z: 60, label: 'WESTGATE' },
  { x: 270, z: 0, label: 'BEACHFRONT' }, { x: 0, z: 270, label: 'OLD PORT' },
  { x: -270, z: -180, label: 'NORTHGATE' }, { x: 150, z: 180, label: 'LUMEN AVE' },
];

export const PACKAGE_SPOTS = [
  { x: 210, z: -180 }, { x: 150, z: 60 }, { x: -30, z: -120 }, { x: -150, z: 30 },
  { x: 90, z: 180 }, { x: 270, z: 60 }, { x: -270, z: -60 }, { x: 30, z: -240 },
  { x: -90, z: -180 }, { x: 210, z: 240 },
];

export class Activities {
  constructor(rng) {
    this.rng = rng;
    this.active = null; // {type, code, name, objective, timer, target, checkpoints, visited, reward}
    this.timer = 0;
    this.visited = new Set();
    this.collected = new Set();
  }

  nearestMarker(px, pz, maxD) {
    let best = null, bd = maxD;
    for (const m of MARKERS) {
      const d = dist2d(px, pz, m.x, m.z);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  start(type) {
    if (this.active) return null;
    if (type === 'race') {
      this.active = {
        type, code: 'RACE', name: 'MALECON SPRINT',
        objective: 'Hit all 6 race gates before the clock runs out',
        checkpoints: RACE_GATES, target: RACE_GATES[0],
        timeLimit: 150, reward: 900,
      };
    } else if (type === 'taxi') {
      const spot = FARE_SPOTS[Math.floor(this.rng() * FARE_SPOTS.length)];
      this.active = {
        type, code: 'TAXI', name: 'TAXI FARE',
        objective: `Pick up the fare and drive them to ${spot.label}`,
        target: spot, timeLimit: 100, reward: 300,
      };
    } else if (type === 'delivery') {
      const spot = FARE_SPOTS[Math.floor(this.rng() * FARE_SPOTS.length)];
      this.active = {
        type, code: 'DELIVERY', name: 'COURIER DROP',
        objective: `Deliver the parcel to ${spot.label}`,
        target: spot, timeLimit: 110, reward: 350,
      };
    }
    if (!this.active) return null;
    this.timer = this.active.timeLimit;
    this.visited = new Set();
    return this.active;
  }

  targetPos() {
    if (!this.active) return null;
    if (this.active.checkpoints) {
      return this.active.checkpoints.find((c) => !this.visited.has(c.label)) || null;
    }
    return this.active.target;
  }

  progressText() {
    if (!this.active) return '';
    if (this.active.checkpoints) return `${this.visited.size}/${this.active.checkpoints.length} GATES`;
    return '';
  }

  update(dt, px, pz) {
    if (!this.active) return null;
    this.timer -= dt;
    if (this.timer <= 0) { this.active = null; return 'failed'; }
    const a = this.active;
    if (a.checkpoints) {
      for (const c of a.checkpoints) {
        if (!this.visited.has(c.label) && dist2d(px, pz, c.x, c.z) < 12) {
          this.visited.add(c.label);
          if (this.visited.size >= a.checkpoints.length) {
            this.lastReward = this.active.reward;
            this.active = null; return 'done';
          }
          return 'checkpoint';
        }
      }
      return null;
    }
    if (dist2d(px, pz, a.target.x, a.target.z) < 12) {
      this.lastReward = this.active.reward;
      this.active = null; return 'done';
    }
    return null;
  }

  cancel() { this.active = null; }
}

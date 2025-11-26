const rows = 17;
const columns = 33;

const gameState = {
  turn: 1,
  phase: 'token',
  activePlayer: 'german',
  actionTokens: { german: [], allies: [] },
  availableActions: { german: 0, allies: 0 },
  units: {},
  formations: {},
  board: board_data.board,
  rows: rows,
  columns: columns
};

function drawUnits() {
    $(".unit_display").remove();

    for (const id in gameState.units) {
        const u = gameState.units[id];
        const pos = getHexCenterPos(u.row, u.col);
        const x = pos[0] - hexRadius * zoom + "px";
        const y = pos[1] - hexHeight * zoom + "px";

        const img = $("<img>", {
            id: "unit_" + id,
            class: "unit_display",
            src: `assets/cell/${u.faction}/${u.faction}_standard.png`,
            css: {
                position: "absolute",
                left: x,
                top: y,
                width: hexRadius * 2 * zoom + "px",
                height: hexHeight * 2 * zoom + "px",
                pointerEvents: "none",
                zIndex: 1000
            }
        });

        $("#debug_board_container").append(img);
    }
}

function createUnit(id, faction, type, col, row, levels, movement, attack, defense, motorized) {
  return {
    id, faction, type, col, row, levels,
    movement, movementLeft: movement, attack, defense,
    motorized: !!motorized, used: false,
    supplyState: 'supplied', disrupted: false
  };
}

function seedUnitsExample() {
  gameState.units['u_01_01'] = createUnit('u_01_01', 'german', 'armor', 0, 0, 2, 9, 7, 5, true);
  gameState.units['u_10_05'] = createUnit('u_10_05', 'allies', 'infantry', 9, 4, 2, 4, 3, 4, false);
}
seedUnitsExample();

const terrainCost = { clear: { mot:1, inf:1 }, rough:{ mot:2, inf:3 }, woods:{ mot:2, inf:3 }, town:{ mot:1, inf:2 } };
const roadCost = 0.5;
const highwayCost = 0.5;
const enterOccupiedMotorizedExtra = 2;

function applySupplyAndDisruptionMovement(baseMovement, unit) {
  let m = baseMovement;
  if (unit.supplyState === 'out') m *= 2/3;
  if (unit.supplyState === 'isolated') m *= 1/3;
  if (unit.disrupted) m *= 2/3;
  return Math.max(0, m);
}

function getZOCForFaction(f) {
  const z = new Set();
  for (const id in gameState.units) {
    const u = gameState.units[id];
    if (u.faction === f && !u.disrupted) {
      const n = getHexNeighbors(u.row, u.col);
      n.forEach(v => z.add(v[0] + ':' + v[1]));
    }
  }
  return z;
}

function getHexNeighbors(r, c) {
  const even = [[-1,0],[-1,1],[0,1],[1,0],[0,-1],[-1,-1]];
  const odd  = [[-1,0],[0,1],[1,1],[1,0],[1,-1],[0,-1]];
  const d = (c % 2 === 0) ? even : odd;
  const out = [];
  for (const k of d) {
    const nr = r + k[0], nc = c + k[1];
    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.columns) out.push([nr, nc]);
  }
  return out;
}

function getMovementCostForEntry(unit, fromRow, fromCol, toRow, toCol) {
  const to = gameState.board[toCol][toRow];
  const terrain = ['clear','rough','woods','town'][to.terrainType] || 'clear';
  const road = to.roads && to.roads.length;
  const hwy = to.highways && to.highways.length;
  if (road || hwy) return roadCost;
  const typ = unit.motorized ? 'mot' : 'inf';
  let cost = terrainCost[terrain][typ];
  const occ = unitAt(toRow, toCol);
  if (occ && occ.motorized && unit.motorized) cost += enterOccupiedMotorizedExtra;
  return cost;
}

function unitAt(r, c) {
  for (const id in gameState.units) {
    const u = gameState.units[id];
    if (u.row === r && u.col === c) return u;
  }
  return null;
}

function executeMovementPath(unitId, path) {
  const u = gameState.units[unitId];
  if (!u) return { ok:false, msg:'Brak jednostki' };
  u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
  const ez = getZOCForFaction(u.faction === 'german' ? 'allies' : 'german');
  for (let i=0;i<path.length;i++){
    const [r,c] = path[i];
    const pr = (i===0) ? u.row : path[i-1][0];
    const pc = (i===0) ? u.col : path[i-1][1];
    const cost = getMovementCostForEntry(u, pr, pc, r, c);
    const fromKey = pr+':'+pc, toKey = r+':'+c;
    const fz = ez.has(fromKey), tz = ez.has(toKey);
    if (u.motorized && fz && tz) {
      const extra = 2;
      if (u.movementLeft < cost + extra) return { ok:false, msg:'Brak punktów ruchu' };
      const die = rollD10();
      const mod = 0;
      const res = die + mod;
      if (res >= 5) { u.movementLeft -= (cost + extra); u.row = r; u.col = c; }
      else { u.movementLeft = 0; u.disrupted = true; return { ok:false, msg:'Infiltracja nieudana' }; }
    } else {
      if (u.movementLeft < cost) return { ok:false, msg:'Brak punktów ruchu' };
      u.movementLeft -= cost; u.row = r; u.col = c;
    }
  }
  u.used = true;
  return { ok:true, msg:'Ruch wykonany' };
}

function rollD10(){ return Math.floor(Math.random()*10); }

function activateUnit(id) {
  const u = gameState.units[id];
  if (!u) return { ok:false, msg:'Brak jednostki' };
  if (u.used) return { ok:false, msg:'Jednostka już użyta' };
  u.used = false; u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
  return { ok:true, msg:'Jednostka aktywowana' };
}

function drawActionToken(f) {
  const c = Object.values(gameState.units).filter(u => u.faction === f);
  if (!c.length) return null;
  return c[Math.floor(Math.random()*c.length)].id;
}

const simpleCRT = {
  '4': {0:'2A',1:'2A',2:'2A',3:'1A',4:'1A',5:'1A',6:'1A',7:'1A',8:'1A',9:'-'},
  '3': {0:'2A',1:'1A',2:'1A',3:'1A',4:'1A',5:'1A',6:'-',7:'-',8:'-',9:'-'},
  '2': {0:'2A',1:'1A',2:'1A',3:'1A',4:'1A',5:'-',6:'-',7:'-',8:'-',9:'-'},
  '1': {0:'1A',1:'1A',2:'-',3:'-',4:'-',5:'-',6:'-',7:'-',8:'-',9:'-'},
  '0': {0:'1D',1:'1D',2:'1D',3:'1D',4:'1D',5:'1D',6:'1D',7:'1D',8:'1D',9:'1D'}
};

function resolveCombat(aIds, dIds, attackType) {
  const A = aIds.map(id => gameState.units[id]).filter(Boolean);
  const D = dIds.map(id => gameState.units[id]).filter(Boolean);
  if (!A.length || !D.length) return { ok:false, msg:'Brak jednostek' };

  const a = A.reduce((s,u)=>s+u.attack,0);
  const d = D.reduce((s,u)=>s+u.defense,0);

  const ratio = a / Math.max(1,d);
  let rk = '0';
  if (ratio >= 4) rk='4'; else if (ratio >=3) rk='3'; else if (ratio >=2) rk='2'; else if (ratio >=1) rk='1';

  let die = rollD10(), mod = 0;
  if (attackType === 'heavy') mod += 1;
  if (D.some(x => gameState.board[x.col][x.row].terrainType === 3)) mod -= 2;
  if (A.some(x => x.disrupted)) mod -= 2;

  const fin = clampDie(die + mod);
  const out = simpleCRT[rk][fin];

  const result = { attackerLossLevels:0, defenderLossLevels:0, retreat:false, disrupted:false, raw:{a,d,rk,die,mod,fin,out} };

  if (out === '-') {}
  else if (out.endsWith('A')) result.attackerLossLevels = parseInt(out[0]);
  else if (out.endsWith('D')) result.defenderLossLevels = parseInt(out[0]);
  else if (out === 'RD') { result.retreat = true; result.disrupted = true; }

  applyLossesToUnits(A, result.attackerLossLevels);
  applyLossesToUnits(D, result.defenderLossLevels);

  if (result.retreat) {
    const all = [...A, ...D];
    for (const u of all) {
      if (!u) continue;
      attemptRetreat(u, 2, u.row, u.col);
    }
  }

  A.forEach(u => { if (u) u.used = true; });
  D.forEach(u => { if (u) u.used = true; });

  return { ok:true, result };
}

function clampDie(v){ if (v<0) return 0; if (v>9) return 9; return v; }

function applyLossesToUnits(units, levels) {
  let remaining = levels;
  const sorted = [...units].sort((a,b) => (b.levels||0) - (a.levels||0));
  for (const u of sorted) {
    if (remaining <= 0) break;
    if (!u) continue;
    if (u.levels === 2) { u.levels = 1; remaining -= 1; }
    else if (u.levels === 1) { delete gameState.units[u.id]; remaining -= 1; }
  }
}


function attemptRetreat(unit, steps, fromRow, fromCol) {
  if (!unit) return false;
  if (!gameState.units[unit.id]) return false;

  const enemyZoc = getZOCForFaction(unit.faction === 'german' ? 'allies' : 'german');
  let curRow = unit.row, curCol = unit.col;

  for (let step = 0; step < steps; step++) {
    const candidates = getHexNeighbors(curRow, curCol).filter(([r,c]) => {
      const occ = unitAt(r,c);
      if (occ && occ.faction !== unit.faction) return false;
      return true;
    });

    if (candidates.length === 0) {
      delete gameState.units[unit.id];
      return false;
    }

    const scored = candidates.map(([r,c]) => {
      let score = 0;
      if (enemyZoc.has(r + ':' + c)) score += 100;
      const occ = unitAt(r,c);
      if (occ && occ.faction === unit.faction) score += 10;
      const dr = r - fromRow;
      const dc = c - fromCol;
      if (!matchesPreferredDirection(unit.faction, dr, dc)) score += 20;
      const dist = Math.abs(r - fromRow) + Math.abs(c - fromCol);
      score -= dist;
      return { r, c, score };
    });

    scored.sort((x,y) => x.score - y.score);
    const pick = scored[0];
    if (!pick) { delete gameState.units[unit.id]; return false; }

    const enteringZOC = enemyZoc.has(pick.r + ':' + pick.c);
    if (enteringZOC) {
      if (unit.disrupted) {
        if (unit.levels === 1) { delete gameState.units[unit.id]; return false; }
        unit.levels = Math.max(1, unit.levels - 1);
      } else {
        unit.disrupted = true;
      }
    }

    unit.row = pick.r;
    unit.col = pick.c;
    curRow = pick.r; curCol = pick.c;
  }

  return true;
}

function matchesPreferredDirection(faction, dr, dc) {
  if (faction === 'allies' || faction === 'us' || faction === 'brits') {
    if (dr < 0) return true;
    if (dr < 0 && dc < 0) return true;
    if (dr < 0 && dc > 0) return true;
    return false;
  }
  if (faction === 'brits') {
    if (dr < 0 && dc < 0) return true;
    if (dr > 0 && dc < 0) return true;
    return false;
  }
  if (faction === 'german') {
    if (dr > 0) return true;
    if (dr > 0 && dc > 0) return true;
    return false;
  }
  return false;
}


let selectedUnitId = null;

function handleClickSelectUnit() {
  if (!isMouseInBoard()) return;
  const rc = getHexRowCol(cx, cy);
  const row = Math.max(0, Math.min(rc[0], gameState.rows - 1));
  const col = Math.max(0, Math.min(rc[1], gameState.columns - 1));
  const u = unitAt(row, col);
  selectedUnitId = u ? u.id : null;
}

$(document).click(handleClickSelectUnit);

$(document).keyup(function (e) {
  if (e.key === 'A' || e.key === 'a') {
    if (selectedUnitId) {
      const res = activateUnit(selectedUnitId);
      console.log(res.msg);
    }
  }
  if (e.key === 'M' || e.key === 'm') {
    if (selectedUnitId) {
      const u = gameState.units[selectedUnitId];
      if (!u) return;
      const targetRow = u.row;
      const targetCol = Math.min(gameState.columns - 1, u.col + 1);
      const res = executeMovementPath(selectedUnitId, [[targetRow, targetCol]]);
      console.log(res.msg);
      if (typeof updateDebugMap === 'function') updateDebugMap();
      if (typeof moveMap === 'function') moveMap();
    }
  }
  if (e.key === 'C' || e.key === 'c') {
    if (selectedUnitId) {
      const u = gameState.units[selectedUnitId];
      if (!u) return;
      const neigh = getHexNeighbors(u.row, u.col);
      const enemies = [];
      neigh.forEach(n => {
        const victim = unitAt(n[0], n[1]);
        if (victim && victim.faction !== u.faction) enemies.push(victim.id);
      });
      if (enemies.length === 0) { console.log('Brak sąsiednich wrogów'); return; }
      const res = resolveCombat([selectedUnitId], enemies, 'medium');
      console.log('Combat result:', res);
      if (typeof updateDebugMap === 'function') updateDebugMap();
      if (typeof moveMap === 'function') moveMap();
    }
  }
});

function drawUnit(id) {
  const u = gameState.units[id];
  const model = u.model;
  const pos = getHexCenterPos(u.row, u.col);
  const x = pos[0] - hexRadius * zoom + "px";
  const y = pos[1] - hexHeight * zoom + "px";

  const img1 = $("<img>", {
    id: "unit_" + id,
    class: "unit_display",
    src: `assets/cell/${u.faction}/${u.faction}_standard.png`,
    css: {
      position: "absolute",
      left: x,
      top: y,
      width: hexRadius * 2 * zoom + "px",
      height: hexHeight * 2 * zoom + "px"
    }
  });

  const img2 = $("<img>", {
    id: "unit_" + id + "_outline",
    class: "unit_outline_display",
    src: `assets/cell/outline_white.png`,
    css: {
      position: "absolute",
      left: x,
      top: y,
      width: hexRadius * 2 * zoom + "px",
      height: hexHeight * 2 * zoom + "px"
    }
  });

  const img3 = $("<img>", {
    id: "unit_" + id + "_hull",
    class: "unit_hull_display",
    src: `assets/unit/${u.faction}/${model}_hull.png`,
    css: {
      position: "absolute",
      left: x,
      top: y,
      width: hexRadius * 2 * zoom + "px",
      height: hexHeight * 2 * zoom + "px"
    }
  });

  const img4 = $("<img>", {
    id: "unit_" + id + "_turret",
    class: "unit_turret_display",
    src: `assets/unit/${u.faction}/${model}_turret.png`,
    css: {
      position: "absolute",
      left: x,
      top: y,
      width: hexRadius * 2 * zoom + "px",
      height: hexHeight * 2 * zoom + "px"
    }
  });

  $("#debug_board_container").append(img1);
  $("#debug_board_container").append(img2);
  $("#debug_board_container").append(img3);
  $("#debug_board_container").append(img4);
}

function createUnit(id, faction, type, col, row, levels, movement, attack, defense, motorized, model) {
  return {
    id, faction, type, col, row, levels,
    movement, movementLeft: movement, attack, defense,
    motorized: !!motorized, used: false,
    supplyState: 'supplied', disrupted: false,
    model
  };
}

function seedUnitsExample() {
  gameState.units['u_01_01'] = createUnit('u_01_01', 'nazis', 'armor', 0, 0, 2, 9, 7, 5, true, "panzer3");
  gameState.units['u_10_05'] = createUnit('u_10_05', 'allies', 'infantry', 9, 4, 2, 4, 3, 4, false, "sherman");
}

function resolveCombat(aIds, dIds, attackType) {
  const A = aIds.map(id => gameState.units[id]).filter(Boolean);
  const D = dIds.map(id => gameState.units[id]).filter(Boolean);
  if (!A.length || !D.length) return { ok: false, msg: 'Brak jednostek' };

  const a = A.reduce((s, u) => s + u.attack, 0);
  const d = D.reduce((s, u) => s + u.defense, 0);

  const ratio = a / Math.max(1, d);
  let rk = '0';
  if (ratio >= 4) rk = '4'; else if (ratio >= 3) rk = '3'; else if (ratio >= 2) rk = '2'; else if (ratio >= 1) rk = '1';

  let die = rollD10(), mod = 0;
  if (attackType === 'heavy') mod += 1;
  if (D.some(x => gameState.board[x.col][x.row].terrainType === 3)) mod -= 2;
  if (A.some(x => x.disrupted)) mod -= 2;

  const fin = clampDie(die + mod);
  const out = simpleCRT[rk][fin];

  const result = { attackerLossLevels: 0, defenderLossLevels: 0, retreat: false, disrupted: false, raw: { a, d, rk, die, mod, fin, out } };

  if (out === '-') { }
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

  return { ok: true, result };
}

function applyLossesToUnits(units, levels) {
  let remaining = levels;
  const sorted = [...units].sort((a, b) => (b.levels || 0) - (a.levels || 0));
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

  const enemyZoc = getZOCForFaction(unit.faction === 'nazis' ? 'allies' : 'nazis');
  let curRow = unit.row, curCol = unit.col;

  for (let step = 0; step < steps; step++) {
    const candidates = getHexNeighbors(curRow, curCol).filter(([r, c]) => {
      const occ = unitAt(r, c);
      if (occ && occ.faction !== unit.faction) return false;
      return true;
    });

    if (candidates.length === 0) {
      delete gameState.units[unit.id];
      return false;
    }

    const scored = candidates.map(([r, c]) => {
      let score = 0;
      if (enemyZoc.has(r + ':' + c)) score += 100;
      const occ = unitAt(r, c);
      if (occ && occ.faction === unit.faction) score += 10;
      const dr = r - fromRow;
      const dc = c - fromCol;
      if (!matchesPreferredDirection(unit.faction, dr, dc)) score += 20;
      const dist = Math.abs(r - fromRow) + Math.abs(c - fromCol);
      score -= dist;
      return { r, c, score };
    });

    scored.sort((x, y) => x.score - y.score);
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

function applySupplyAndDisruptionMovement(baseMovement, unit) {
  let m = baseMovement;
  if (unit.supplyState === 'out') m *= 2 / 3;
  if (unit.supplyState === 'isolated') m *= 1 / 3;
  if (unit.disrupted) m *= 2 / 3;
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

function findBestPath(sr, sc, tr, tc, unit) {
    const dist = {};
    const prev = {};
    const vis = new Set();
    const pq = [[0, sr, sc]];

    dist[sr + ":" + sc] = 0;

    while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]);
        const [d, r, c] = pq.shift();
        const k = r + ":" + c;

        if (vis.has(k)) continue;
        vis.add(k);

        if (r === tr && c === tc) break;

        const neigh = getHexNeighbors(r, c);

        for (const [nr, nc] of neigh) {
            const cost = getMovementCostForEntry(unit, r, c, nr, nc);
            if (cost < 0) continue;

            const nk = nr + ":" + nc;
            const nd = d + cost;

            if (dist[nk] == null || nd < dist[nk]) {
                dist[nk] = nd;
                prev[nk] = k;
                pq.push([nd, nr, nc]);
            }
        }
    }

    let cur = tr + ":" + tc;

    if (!prev[cur] && cur !== (sr + ":" + sc)) return null;

    const path = [];

    while (cur) {
        const [rr, cc] = cur.split(":").map(Number);
        path.push([rr, cc]);
        if (cur === sr + ":" + sc) break;
        cur = prev[cur];
    }

    path.reverse();
    return path;
}


function getMovementCostForEntry(unit, fromRow, fromCol, toRow, toCol) {
  const to = gameState.board[toCol][toRow];
  const from = gameState.board[fromCol][fromRow];
  const terrain = terrainTypes[to.terrainType] || terrainTypes[0];
  const thisroad = from.roads && from.roads.length;
  const thishwy = from.highways && from.highways.length;
  const road = to.roads && to.roads.length;
  const hwy = to.highways && to.highways.length;
  const typ = unit.motorized ? 'mot' : 'inf';
  const fact = unit.faction;

  let currentCellPos = getHexCenterPos(fromRow, fromCol)
  let nextCellPos = getHexCenterPos(toRow, toCol);
  let yDif = nextCellPos[1] - currentCellPos[1];
  let xDif = nextCellPos[0] - currentCellPos[0];

  if (yDif == 0) return -1;

  let movementDirectionEdge = (xDif == 0 ? 0 : xDif / Math.abs(xDif)) + 1 + (yDif / Math.abs(yDif) + 1) * 1.5;

  let cost = -1;

  if (thisroad) {
    from.roads.forEach(edge => {
      if (edge == movementDirectionEdge) {
        cost = roadCost[typ];
      }
    });
  }
  if (thishwy) {
    from.highways.forEach(edge => {
      if (edge == movementDirectionEdge) {
        cost = highwayCost[typ];
      }
    });
  }
  if (cost > 0 && ((from.edges[movementDirectionEdge] == 0 && fact == "nazis") || fact != "nazis")) return cost;

  cost = terrainCost[terrain][typ];
  const occ = unitAt(toRow, toCol);
  if (occ && occ.motorized && unit.motorized) cost += enterOccupiedMotorizedExtra;
  console.log("base cost: ", cost);
  console.log("additional cost: ", edgeCost[edgeInfo[from.edges[movementDirectionEdge]]][typ]);
  return cost + edgeCost[edgeInfo[from.edges[movementDirectionEdge]]][typ];
}

function getMovementDirection(unit, fromRow, fromCol, toRow, toCol) {
  const to = gameState.board[toCol][toRow];
  const from = gameState.board[fromCol][fromRow];

  let currentCellPos = getHexCenterPos(fromRow, fromCol)
  let nextCellPos = getHexCenterPos(toRow, toCol);
  let yDif = nextCellPos[1] - currentCellPos[1];
  let xDif = nextCellPos[0] - currentCellPos[0];

  if (yDif == 0) return 0;

  let movementDirectionEdge = (xDif == 0 ? 0 : xDif / Math.abs(xDif)) + 1 + (yDif / Math.abs(yDif) + 1) * 1.5;

  return movementDirectionEdge;
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
  let pathCost = 0;
  if (!u) return { ok: false, msg: 'Brak jednostki', cost: 0 };
  u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
  const ez = getZOCForFaction(u.faction === 'nazis' ? 'allies' : 'nazis');
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    const pr = (i === 0) ? u.row : path[i - 1][0];
    const pc = (i === 0) ? u.col : path[i - 1][1];
    const edge = getMovementDirection(u, pr, pc, r, c);
    const cost = getMovementCostForEntry(u, pr, pc, r, c);
    pathCost += cost;
    console.log(cost);
    const fromKey = pr + ':' + pc, toKey = r + ':' + c;
    const fz = ez.has(fromKey), tz = ez.has(toKey);
    if (u.motorized && fz && tz) {
      const extra = 2;
      if (u.movementLeft < cost + extra) return { ok: false, msg: 'Brak punktów ruchu', cost: pathCost };
      const die = rollD10();
      const mod = 0;
      const res = die + mod;
      if (res >= 5) { u.movementLeft -= (cost + extra); u.row = r; u.col = c; }
      else { u.movementLeft = 0; u.disrupted = true; return { ok: false, msg: 'Infiltracja nieudana', cost: pathCost }; }
    } else {
      if (u.movementLeft < cost) return { ok: false, msg: 'Brak punktów ruchu', cost: pathCost };
      u.movementLeft -= cost; u.row = r; u.col = c;
    }

    $("#unit_" + unitId + "_turret").css({
        "transform": (edge > 2) ? `rotate(${180 - 60*(edge - 4)}deg)` : `rotate(${60*(edge - 1)}deg)`
    });

    $("#unit_" + unitId + "_hull").css({
        "transform": (edge > 2) ? `rotate(${180 - 60*(edge - 4)}deg)` : `rotate(${60*(edge - 1)}deg)`
    });

    selectedRow = path[i][0];
    selectedColumn = path[i][1];
  }
  u.used = true;
  return { ok: true, msg: 'Ruch wykonany', cost: pathCost };
}

function activateUnit(id) {
  const u = gameState.units[id];
  if (!u) return { ok: false, msg: 'Brak jednostki' };
  if (u.used) return { ok: false, msg: 'Jednostka już użyta' };
  u.used = false; u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
  return { ok: true, msg: 'Jednostka aktywowana' };
}

function moveUnitToTarget(unitId,tr,tc)
{
  const u=gameState.units[unitId];
  if(!u)return{ok:false};
  const path=findBestPath(u.row,u.col,tr,tc,u);
  if(!path)return{ok:false};
  let used=[];
  for(let i=1;i<path.length;i++)
    {
      const [r,c] = path[i];
      const pr = i===1 ? u.row : path[i-1][0];
      const pc = i===1 ? u.col : path[i-1][1];

      const cost = getMovementCostForEntry(u,pr,pc,r,c);
      if(cost < 0) return { ok:false };

      if(u.movementLeft < cost)
          return executeMovementPath(u.id, used);

      u.movementLeft -= cost;
      used.push([r,c]);
   }
  return executeMovementPath(u.id,used);
}
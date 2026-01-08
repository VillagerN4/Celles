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
  // console.log("base cost: ", cost);
  // console.log("additional cost: ", edgeCost[edgeInfo[from.edges[movementDirectionEdge]]][typ]);
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
    // console.log(cost);
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
  onUnitFinishedMovement(unitId);
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
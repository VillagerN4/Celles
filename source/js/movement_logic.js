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

    if (!prev[cur] && cur !== (sr + ":" + sc)){
        return null;
    }

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

    let occupied = false

    let currentCellPos = getHexCenterPos(fromRow, fromCol)
    let nextCellPos = getHexCenterPos(toRow, toCol);
    let yDif = nextCellPos[1] - currentCellPos[1];
    let xDif = nextCellPos[0] - currentCellPos[0];

    occupied = unitAt(toRow, toCol) != null;

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
    if (cost > 0 && ((from.edges[movementDirectionEdge] == 0 && fact == "nazis" || allowNazisBridge) || fact != "nazis")) return cost + (occupied ? 999999 : 0);

    cost = terrainCost[terrain][typ];
    // console.log("base cost: ", cost);
    // console.log("additional cost: ", edgeCost[edgeInfo[from.edges[movementDirectionEdge]]][typ]);
    return cost + edgeCost[edgeInfo[from.edges[movementDirectionEdge]]][typ] + (occupied ? 999999 : 0);
}

function getMovementDirection(fromRow, fromCol, toRow, toCol) {

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
        if (u.row === r && u.col === c && gameState.animatedUnits[id] == null) return u;
    }
    return null;
}

function applyRotation(unitId, rot, part){   
    let u = gameState.units[unitId];
    if(!u) return;
    
    if(part == "_turret"){
        u.currentTurretRotation = rot;
    }else{
        u.currentRotation = rot;  
    }

    $("#unit_" + unitId + part).css({
        "transform": `rotate(${rot}deg)`
    });
}

async function executeMovementPath(unitId, path) {
    $("#unit_" + unitId + "_turret").addClass("rotating");
    const u = gameState.units[unitId];

    gameState.animatedUnits[unitId] = path;

    let visualizePath = [];
    let pathCost = 0;
    let lastAction = "end";

    if (!u) return { ok: false, msg: 'Brak jednostki', cost: 0 };

    u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
    const ez = getZOCForFaction(u.faction === 'nazis' ? 'allies' : 'nazis');
    const startCell = [u.row, u.col];

    clearPathVizualizers();
    createPathGuide(false);

    u.startMoveSound();

    selectedUnitId = null;
    selectedRow = null;
    selectedColumn = null;

    function stopPath(r, c){
        console.log("stopped");
        u.row = r; 
        u.col = c;
        u.row_offset = 0;
        u.col_offset = 0;
        u.offsetProgress = 0;
        $("#unit_" + unitId + "_turret").removeClass("rotating");

        updateUnits();
        gameState.animatedUnits[unitId] = null;
    }

    for (let i = 0; i < path.length; i++) {
        const [r, c] = path[i];
        const pr = (i === 0) ? u.row : path[i - 1][0];
        const pc = (i === 0) ? u.col : path[i - 1][1];
        const nr = (i === path.length-1) ? r : path[i + 1][0];
        const nc = (i === path.length-1) ? c : path[i + 1][1];
        const edge = getMovementDirection(pr, pc, r, c);
        const nedge = getMovementDirection(r, c, nr, nc);
        const cost = getMovementCostForEntry(u, pr, pc, r, c);
        pathCost += cost;
        // console.log(cost);
        const fromKey = pr + ':' + pc, toKey = r + ':' + c;
        const fz = ez.has(fromKey), tz = ez.has(toKey);

        let deltaRotation = shortestRotation(u.currentRotation, edge);
        let deltaTurretRotation = shortestRotation(u.currentTurretRotation, edge);
        let nextDelta = shortestRotation(u.currentRotation + deltaRotation, nedge);

        visualizePath[i] = path[i];

        if(deltaRotation != 0){
            applyRotation(unitId, u.currentRotation + deltaRotation, "_hull");
            applyRotation(unitId, u.currentTurretRotation + deltaTurretRotation, "_turret");
            await tweenOffsetProgress(u, 8000 * unitSpeedModifier, "mid");
        }

        if(i==path.length-1){
            if(path.length < 2){
                u.quickMoveSound();
            }else{
                u.stopMoveSound();
            }
        }

        u.row_offset = r - pr;
        u.col_offset = c - pc;
        u.offsetProgress = 1;

        if((nextDelta!=0 || i > (path.length-2)) && lastAction=="end"){
            lastAction = "both";
        }

        if((nextDelta!=0 || i > (path.length-2)) && lastAction == "start"){ 
            lastAction = "mid";
        }

        await tweenOffsetProgress(u, (lastAction=="start" ? 5000 * unitSpeedModifier : 10000 * unitSpeedModifier), lastAction=="end" ? "start" : (lastAction=="mid" ? "end" : (lastAction=="both" ? "inout" : "mid")));

        if(lastAction=="end"){
            lastAction = "start";
        }

        if(lastAction=="both"){
            lastAction = "end";
        }

        if(lastAction=="mid"){
            lastAction = "end";
        }

        if (u.motorized && fz && tz) {
            const extra = 2;
            if (u.movementLeft < cost + extra){ 
                u.stopMoveSound();
                stopPath(r, c);
                return { ok: false, msg: 'Brak punktów ruchu', cost: pathCost }
            };

            const die = rollD10();
            const mod = 0;
            const res = die + mod;

            if (res >= 5) { 
                u.movementLeft -= (cost + extra); 
            }
            else { 
                u.movementLeft = 0; u.disrupted = true; 
                u.stopMoveSound();
                stopPath(r, c);
                sendLog(`Unit: ${unitId} had its movement disrupted.`);
                return { ok: false, msg: 'Infiltracja nieudana', cost: pathCost }; 
            }
        } else {
            if (u.movementLeft < cost){ 
                u.stopMoveSound();
                stopPath(r, c);
                return { ok: false, msg: 'Brak punktów ruchu', cost: pathCost }
            };

            u.movementLeft -= cost;
        }

        u.row = r; 
        u.col = c;
        u.row_offset = 0;
        u.col_offset = 0;
        u.offsetProgress = 0;
        
    }
    onUnitFinishedMovement(unitId, pathCost);
    stopPath(u.row, u.col);
    return { ok: true, msg: 'Ruch wykonany', cost: pathCost };
}

function activateUnit(id) {
    const u = gameState.units[id];
    if (!u) return { ok: false, msg: 'Brak jednostki' };
    if (u.used) return { ok: false, msg: 'Jednostka już użyta' };
    u.used = true; u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
    return { ok: true, msg: 'Jednostka aktywowana' };
}

function moveUnitToTarget(unitId, tr, tc) {
    const u = gameState.units[unitId];
    if (!u) return { ok: false };
    const path = findBestPath(u.row, u.col, tr, tc, u);
    if (!path) return { ok: false };
    let used = [];
    for (let i = 1; i < path.length; i++) {
        const [r, c] = path[i];
        const pr = i === 1 ? u.row : path[i - 1][0];
        const pc = i === 1 ? u.col : path[i - 1][1];

        const cost = getMovementCostForEntry(u, pr, pc, r, c);
        if (cost < 0) return { ok: false };

        if (u.movementLeft < cost)
            return executeMovementPath(u.id, used);

        u.movementLeft -= cost;
        used.push([r, c]);
    }
    return executeMovementPath(u.id, used);
}

function createPathGuide(isGuide){
    if(selectedColumn!=null && selectedRow!=null && selectedUnitId!=null){
        let su = gameState.units[selectedUnitId];
        let path = findBestPath(su.row, su.col, selectedRow, selectedColumn, su);
        if(path){
            let block = null;
            let pathCost = 0;
            for (let i = 0; i < path.length; i++) {
                const [r, c] = path[i];
                const pr = (i === 0) ? su.row : path[i - 1][0];
                const pc = (i === 0) ? su.col : path[i - 1][1];
                const cost = getMovementCostForEntry(su, pr, pc, r, c);
                pathCost += cost;
                if(cost > 90000){
                    block = [pr, pc];
                }
            }
            
            createPathVizualizer([...path], (pathCost >= su.movementLeft ? false : (isGuide ? "guide" : true)), block);
        }
    }
}

function isCellPartOfPath(r, c){
    for (const [unit, path] of Object.entries(gameState.animatedUnits)) {
        if(path != null){
            for(i = 0; i < path.length; i++){
                let [pr, pc] = path[i];
                if(pr == r && pc == c) return true;
            }
        }
    }
    return false;
}

function matchesPreferredDirection(faction, dr, dc) {

    if (faction === "allies") {
        return ((dr === -1 && dc === -1) || (dr === -1 && dc ===  0) || (dr === -1 && dc ===  1));
    }

    if (faction === "brits") {
        return ((dr === -1 && dc === -1) || (dr ===  0 && dc === -1));
    }

    if (faction === "nazis") {
        return ((dr ===  1 && dc ===  0) || (dr ===  0 && dc === -1));
    }

    return false;
}

function buildRetreatPath(unit, steps, fromRow, fromCol) {
    const enemyZoc = getZOCForFaction(unit.faction === 'nazis' ? 'allies' : 'nazis');

    let curRow = unit.row;
    let curCol = unit.col;
    const path = [];

    for (let step = 0; step < steps; step++) {
        const candidates = getHexNeighbors(curRow, curCol).filter(([r, c]) => {
            const occ = unitAt(r, c);
            if (occ && occ.faction !== unit.faction) return false;
            return true;
        });

        if (candidates.length === 0) return null;

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

        scored.sort((a, b) => a.score - b.score);
        const pick = scored[0];
        if (!pick) return null;

        path.push([pick.r, pick.c]);
        curRow = pick.r;
        curCol = pick.c;
    }

    return path;
}

async function executeForcedPath(unitId, path) {
    const u = gameState.units[unitId];
    if (!u || !path || path.length === 0) return false;

    $("#unit_" + unitId + "_turret").addClass("rotating");
    gameState.animatedUnits[unitId] = path;
    let lastAction = "end";

    u.startMoveSound();

    for (let i = 0; i < path.length; i++) {
        const [r, c] = path[i];
        const pr = (i === 0) ? u.row : path[i - 1][0];
        const pc = (i === 0) ? u.col : path[i - 1][1];
        const nr = (i === path.length-1) ? r : path[i + 1][0];
        const nc = (i === path.length-1) ? c : path[i + 1][1];

        const edge = getMovementDirection(pr, pc, r, c);
        const nedge = getMovementDirection(r, c, nr, nc);
        let deltaRotation = shortestRotation(u.currentRotation, edge);
        let deltaTurretRotation = shortestRotation(u.currentTurretRotation, edge);
        let nextDelta = shortestRotation(u.currentRotation + deltaRotation, nedge);
        

        if (deltaRotation !== 0) {
            applyRotation(unitId, u.currentRotation + deltaRotation, "_hull");
            applyRotation(unitId, u.currentTurretRotation + deltaTurretRotation, "_turret");
            await tweenOffsetProgress(u, 8000 * unitSpeedModifier, "mid");
        }

        if(i==path.length-1){
            if(path.length < 2){
                u.quickMoveSound();
            }else{
                u.stopMoveSound();
            }
        }

        u.row_offset = r - pr;
        u.col_offset = c - pc;
        u.offsetProgress = 1;

        if((nextDelta!=0 || i > (path.length-2)) && lastAction=="end"){
            lastAction = "both";
        }

        if((nextDelta!=0 || i > (path.length-2)) && lastAction == "start"){ 
            lastAction = "mid";
        }

        await tweenOffsetProgress(u, (lastAction=="start" ? 5000 * unitSpeedModifier : 10000 * unitSpeedModifier), lastAction=="end" ? "start" : (lastAction=="mid" ? "end" : (lastAction=="both" ? "inout" : "mid")));
        
        if(lastAction=="end"){
            lastAction = "start";
        }

        if(lastAction=="both"){
            lastAction = "end";
        }

        if(lastAction=="mid"){
            lastAction = "end";
        }

        u.row = r;
        u.col = c;
        u.row_offset = 0;
        u.col_offset = 0;
        u.offsetProgress = 0;
    }

    u.stopMoveSound();
    $("#unit_" + unitId + "_turret").removeClass("rotating");
    gameState.animatedUnits[unitId] = null;

    updateUnits();
    return true;
}
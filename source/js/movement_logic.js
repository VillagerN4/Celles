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
        if (u.row === r && u.col === c) return u;
    }
    return null;
}

async function executeMovementPath(unitId, path) {
    const u = gameState.units[unitId];

    gameState.animatedUnits.push(unitId);
    const animUID = gameState.animatedUnits.length - 1;

    let visualizePath = [];
    let pathCost = 0;
    let lastAction = "end";

    if (!u) return { ok: false, msg: 'Brak jednostki', cost: 0 };

    u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
    const ez = getZOCForFaction(u.faction === 'nazis' ? 'allies' : 'nazis');
    const startCell = [u.row, u.col];

    u.startMoveSound();

    function stopPath(r, c){
        u.row = r; 
        u.col = c;
        u.row_offset = 0;
        u.col_offset = 0;
        u.offsetProgress = 0;

        updateUnits();
        u.stopMoveSound();
        gameState.animatedUnits.splice(animUID);
    }

    function applyRotation(rot){   
        $("#unit_" + unitId + "_turret").css({
            "transform": `rotate(${rot}deg)`
        });

        $("#unit_" + unitId + "_hull").css({
            "transform": `rotate(${rot}deg)`
        });
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

        let currentRotation = getElementRotation("unit_" + unitId + "_hull");
        let deltaRotation = shortestRotation(currentRotation, edge);
        let nextDelta = shortestRotation(currentRotation + deltaRotation, nedge);

        visualizePath[i] = path[i];

        if (u.motorized && fz && tz) {
            const extra = 2;
            if (u.movementLeft < cost + extra){ 
                createPathVizualizer([startCell, ...visualizePath], false);
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
                stopPath(r, c);
                return { ok: false, msg: 'Infiltracja nieudana', cost: pathCost }; 
            }
        } else {
            if (u.movementLeft < cost){ 
                createPathVizualizer([startCell, ...visualizePath], false);
                stopPath(r, c);
                return { ok: false, msg: 'Brak punktów ruchu', cost: pathCost }
            };

            u.movementLeft -= cost;
        }

        selectedUnitId = unitId;
        if(r==selectedRow && c==selectedColumn){
            selectedRow = null;
            selectedColumn = null;
        }else{
            createPathGuide();
        } 

        if(deltaRotation != 0){
            applyRotation(currentRotation + deltaRotation);
            await tweenOffsetProgress(u, 6000, "mid");
        }

        u.row_offset = r - pr;
        u.col_offset = c - pc;
        u.offsetProgress = 1;

        console.log("movementstart", lastAction);

        if((nextDelta!=0 || i == path.length-2) && lastAction=="end"){
            lastAction = "both";
        }

        if((nextDelta!=0 || i == path.length-2) && lastAction == "start"){ 
            lastAction = "mid";
        }

        await tweenOffsetProgress(u, (lastAction=="start" ? 5000 : 10000), lastAction=="end" ? "start" : (lastAction=="mid" ? "end" : (lastAction=="both" ? "inout" : "mid")));

        if(lastAction=="end"){
            lastAction = "start";
        }

        if(lastAction=="both"){
            lastAction = "end";
        }

        if(lastAction=="mid"){
            lastAction = "end";
        }

        console.log("movementend", lastAction);

        if(i==path.length-1)
            u.stopMoveSound();

        u.row = r; 
        u.col = c;
        u.row_offset = 0;
        u.col_offset = 0;
        u.offsetProgress = 0;
        
    }
    onUnitFinishedMovement(unitId);
    createPathVizualizer([startCell, ...visualizePath], true);
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

function createPathGuide(){
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
            
            createPathVizualizer([...path], (pathCost >= su.movementLeft ? false : "guide"), block);
        }
    }
}
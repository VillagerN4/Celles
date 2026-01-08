function collectEngagements() {
    const engagements = [];
    const seen = new Set();
    for (const id in gameState.units) {
        const u = gameState.units[id];
        if (u.faction !== gameState.activePlayer) continue;
        const neigh = getHexNeighbors(u.row, u.col);
        for (const [r, c] of neigh) {
            const enemy = unitAt(r, c);
            if (enemy && enemy.faction !== u.faction) {
                const key = [u.id, enemy.id].sort().join(':');
                if (!seen.has(key)) {
                    engagements.push({ attacker: u.id, defender: enemy.id });
                    seen.add(key);
                }
            }
        }
    }
    return engagements;
}

function resolveAllEngagements() {
    const engagements = collectEngagements();
    for (const e of engagements) {
        const atk = [e.attacker];
        const defNeighbors = [];
        const aUnit = gameState.units[e.attacker];
        if (!aUnit) continue;
        const neigh = getHexNeighbors(aUnit.row, aUnit.col);
        for (const [r, c] of neigh) {
            const v = unitAt(r, c);
            if (v && v.faction !== aUnit.faction) defNeighbors.push(v.id);
        }
        if (defNeighbors.length === 0) continue;
        resolveCombat(atk, defNeighbors, 'medium');
    }
    if (typeof updateDebugMap === 'function') updateDebugMap();
    if (typeof moveMap === 'function') moveMap();
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
    const out = CRT[rk][fin];

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
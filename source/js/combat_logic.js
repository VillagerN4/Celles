function resolveCombat(aIds, dIds, attackType) {
    const A = aIds.map(id => gameState.units[id]).filter(Boolean);
    const D = dIds.map(id => gameState.units[id]).filter(Boolean);
    if (!A.length || !D.length) return { ok: false, msg: 'Brak jednostek'};

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
    console.log(out);
    if (out === '-') { }
    else if (out === 'RD') { result.retreat = true; result.disrupted = true; }
    else if (out.endsWith('A')) result.attackerLossLevels = parseInt(out[0]);
    else if (out.endsWith('D')) result.defenderLossLevels = parseInt(out[0]);

    if (result.retreat) {
        const all = [...A, ...D];
        for (const u of all) {
            if (!u) continue;
            // attemptRetreat(u, 2, u.row, u.col);
        }
    }

    A.forEach(u => { if (u) u.used = true; });
    D.forEach(u => { if (u) u.used = true; });

    return { ok: true, result };
}

function applySingleLoss(u) {
    if (u.levels === 2) {
        u.levels = 1;
        return true;
    }
    if (u.levels === 1) {
        if (u.id === selectedUnitId) selectedUnitId = null;
        selectedUnitsIds[u.id] = null;
        explodeUnit(u.id);
        delete gameState.units[u.id];
        return true;
    }
    return false;
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

function startCombat(primaryId) {
    const u = gameState.units[primaryId];
    if (!u) return;

    const defenders = collectAllAdjacentEnemies(u);
    if (defenders.length === 0) return;

    gameState.combat = {
        primary: primaryId,
        attackers: [primaryId],
        defenders: defenders
    };
}


function collectAllAdjacentEnemies(unit) {
    const out = [];
    const neigh = getHexNeighbors(unit.row, unit.col);
    const isNazi = unit.faction == "nazis";
    for (const [r, c] of neigh) {
        const e = unitAt(r, c);
        if (e && ((isNazi && e.faction != "nazis") || (!isNazi && e.faction == "nazis"))) out.push(e.id);
    }
    return out;
}

function getAttackSupportCandidates(defenderIds, faction) {
    const set = new Set();
    const isNazi = faction == "nazis";

    for (const dId of defenderIds) {
        const d = gameState.units[dId];
        if (!d) continue;

        const neigh = getHexNeighbors(d.row, d.col);
        for (const [r, c] of neigh) {
            const u = unitAt(r, c);
            if (u && ((isNazi && u.faction != "nazis") || (!isNazi && u.faction == "nazis"))) set.add(u.id);
        }
    }
    return [...set];
}

function buildFirePairs(fromIds, toIds) {
    const pairs = [];

    for (const aId of fromIds) {
        const a = gameState.units[aId];
        if (!a) continue;

        for (const dId of toIds) {
            const d = gameState.units[dId];
            if (!d) continue;

            if (areAdjacent(a.row, a.col, d.row, d.col)) {
                pairs.push({ from: aId, to: dId });
            }
        }
    }

    return shuffle(pairs);
}

async function resolveAnimatedShot(pair, doomed, remainingShots, success) {
    const { from, to } = pair;

    if (!gameState.units[from] || !gameState.units[to]) return;

    await animateAttack(from, to, success);

    const shotsLeft = remainingShots.get(to) - 1;
    remainingShots.set(to, shotsLeft);

    if (shotsLeft === 0 && doomed.has(to)) {
        const fate = doomed.get(to);
        const u = gameState.units[to];

        if (!u) return;

        if (fate.loseLevel) {
            u.levels = 1;
        } else if (fate.die) {
            if (to === selectedUnitId) selectedUnitId = null;
            explodeUnit(to);
            delete gameState.units[to];
        }
    }
}

async function playCombatAnimation(attackerIds, defenderIds, attackerCas, defenderCas, lossPool) {
    const A = buildFirePairs(attackerIds, defenderIds);
    const D = buildFirePairs(defenderIds, attackerIds);

    const doomed = new Map();

    [...attackerCas, ...defenderCas].forEach(c => {
        doomed.set(c.id, c);
    });

    const remainingShots = new Map();

    [...A, ...D].forEach(({ to }) => {
        remainingShots.set(to, (remainingShots.get(to) || 0) + 1);
    });

    let i = 0;

    while (i < A.length || i < D.length) {

        if (i < A.length) {
            await resolveAnimatedShot(A[i], doomed, remainingShots, lossPool.defender > 0);
        }

        if (i < D.length) {
            await resolveAnimatedShot(D[i], doomed, remainingShots, lossPool.attacker > 0);
        }

        i++;
    }
}

async function resolveCurrentCombat() {
    const { attackers, defenders } = gameState.combat;
    
    const combat_result = resolveCombat(attackers, defenders, 'medium');

    sendLog(`Started combat.`);
    console.log(combat_result);

    const lossPool = {
        attacker: combat_result.result.attackerLossLevels,
        defender: combat_result.result.defenderLossLevels
    };
    const attackerCasualties = selectCasualties(attackers, combat_result.result.attackerLossLevels);
    const defenderCasualties = selectCasualties(defenders, combat_result.result.defenderLossLevels);

    if(!combat_result.result.retreat) await playCombatAnimation(attackers, defenders, attackerCasualties, defenderCasualties, lossPool);

    sendLog(`Finished combat.`);

    gameState.combat = null;
}

async function rotateTurretToTarget(attacker, defenderId) {
    const d = gameState.units[defenderId];
    if (!d) return;

    const edge = getMovementDirection(attacker.row, attacker.col, d.row, d.col);

    const current = attacker.currentTurretRotation;

    const delta = shortestRotation(current, edge);
    if (delta === 0) return;

    attacker.currentTurretRotation = current + delta;

    $("#unit_" + attacker.id + "_turret").addClass("rotating");

    updateUnits();

    await new Promise(r => setTimeout(r, 10));

    attacker.playTurnSound();

    applyRotation(attacker.id, attacker.currentTurretRotation, "_turret");

    await tweenOffsetProgress(attacker, 8000 * unitSpeedModifier, "inout");
    $("#unit_" + attacker.id + "_turret").removeClass("rotating");
    await new Promise(r => setTimeout(r, 10));
}

async function fireWeapon(attacker, defenderId, success) {
    const recoil = 2 * zoom;
    const id = attacker.id;
    const rot = attacker.currentTurretRotation;

    function applyTurretTransform(unitId, rotation, recoil = 0) {
        $("#unit_" + unitId + "_turret").css(
            "transform",
            `rotate(${rotation}deg) translateY(${recoil}px)`
        );
    }


    $("#unit_" + id + "_turret").css({
        transition: `transform 0.01s linear`
    });

    applyTurretTransform(id, rot, recoil);
    shootShell(id, recoil);

    await new Promise(r => setTimeout(r, 10));

    $("#unit_" + attacker.id + "_turret").addClass("firing");
    updateUnits();

    attacker.playShootSound();

    await new Promise(r => setTimeout(r, 120));

    explodeAtUnit(defenderId, success, rot);

    applyTurretTransform(id, rot, 0);

    await new Promise(r => setTimeout(r, 1200));

    $("#unit_" + attacker.id + "_turret").removeClass("firing");
}

async function animateAttack(attackerId, defenderId, success) {
    const attacker = gameState.units[attackerId];
    const defender = gameState.units[defenderId];

    if (!attacker || !defender) return;
    if (!gameState.units[attackerId] || !gameState.units[defenderId]) return;

    await rotateTurretToTarget(attacker, defenderId);

    await new Promise(r => setTimeout(r, 1200));

    await fireWeapon(attacker, defenderId, success);
}

function selectCasualties(units, lossLevels) {
    const result = [];
    let remaining = lossLevels;

    const sorted = [...units]
        .map(u => gameState.units[u])
        .filter(Boolean)
        .sort((a, b) => (b.levels || 0) - (a.levels || 0));

    for (const u of sorted) {
        if (remaining <= 0) break;

        if (u.levels === 2) {
            result.push({ id: u.id, loseLevel: true });
            remaining -= 1;
        } else if (u.levels === 1) {
            result.push({ id: u.id, die: true });
            remaining -= 1;
        }
    }

    return result;
}

function countIncomingShots(firePairs) {
    const map = new Map();
    for (const { to } of firePairs) {
        map.set(to, (map.get(to) || 0) + 1);
    }
    return map;
}
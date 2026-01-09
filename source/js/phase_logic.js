function startTurn(player) {
    gameState.activePlayer = player;
    gameState.phase = 'movement';
    for (const id in gameState.units) {
        const u = gameState.units[id];
        if (u.faction === player) {
            u.used = false;
            u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
        }
    }
}

function startPhase(phase) {
    gameState.phase = phase;
    if (phase === 'movement') {
        for (const id in gameState.units) {
            const u = gameState.units[id];
            if (u.faction === gameState.activePlayer) {
                u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
            }
        }
    }
}

function endPhase() {
    if (gameState.phase === 'movement') {
        gameState.phase = 'combat';
        return { ok: true, phase: 'combat' };
    } else if (gameState.phase === 'combat') {
        resolveAllEngagements();
        gameState.phase = 'supply';
        return { ok: true, phase: 'supply' };
    } else if (gameState.phase === 'supply') {
        supplyAndRecoveryPhase();
        endTurn();
        return { ok: true, phase: 'end' };
    }
    return { ok: false };
}

function endTurn() {
    const prev = gameState.activePlayer;
    const next = (prev === 'nazis') ? 'allies' : 'nazis';
    gameState.activePlayer = next;
    gameState.phase = 'movement';
    for (const id in gameState.units) {
        const u = gameState.units[id];
        if (u.faction === next) {
            u.used = false;
            u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
        }
    }
    if (next === 'nazis') gameState.turn += 1;
    if (typeof updateDebugMap === 'function') updateDebugMap();
    if (typeof moveMap === 'function') moveMap();
}

let unitQueue = [];
let queueIndex = 0;

function buildUnitQueue() {
    unitQueue = [];
    for (const id in gameState.units) {
        const u = gameState.units[id];
        if (u.faction === gameState.activePlayer) {
            if (!u.used) unitQueue.push(id);
        }
    }
    queueIndex = 0;
}

onUnitFinishedMovement = function (unitId) {
    const u = gameState.units[unitId];
    if (!u) return;

    u.used = true;

    setCellInfPar("Jednostka zakończyła ruch:" + unitId)
}

function startTurnWithQueue(player) {
    // $("body").css({ "background-color": gameState.activePlayer == "nazis" ? "#a6acbdff" : "#77ab79ff" });
    setCellInfPar("TURN:" + gameState.turn + "PLAYER:" + gameState.activePlayer + "PHASE:" + gameState.phase);
    startTurn(player);
    buildUnitQueue();

    if (unitQueue.length === 0) {
        setCellInfPar("Brak jednostek dla gracza:" + player);
        return;
    }

    setCellInfPar("Tura gracza:" + player);
}
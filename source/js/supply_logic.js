function isUnitInSupply(unit) {
    const cell = gameState.board[unit.col][unit.row];
    if (!cell) return false;
    if (cell.hasVillage) return true;
    if (cell.terrainType === 3) return true;
    if (unit.col === 0 || unit.col === gameState.columns - 1) return true;
    return false;
}

function supplyAndRecoveryPhase() {
    for (const id in gameState.units) {
        const u = gameState.units[id];
        if (u.faction !== gameState.activePlayer) continue;
        if (isUnitInSupply(u)) u.supplyState = 'supplied';
        else u.supplyState = 'out';
        if (u.disrupted) {
            const die = rollD10();
            if (die >= 4) u.disrupted = false;
        }
    }
}

function applySupplyAndDisruptionMovement(baseMovement, unit) {
    let m = baseMovement;
    if (unit.supplyState === 'out') m *= 2 / 3;
    if (unit.supplyState === 'isolated') m *= 1 / 3;
    if (unit.disrupted) m *= 2 / 3;
    return Math.max(0, m) * movementMultiplier;
}
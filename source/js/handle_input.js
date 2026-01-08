function handleClick(event) {
    if (isMouseInBoard() && gameState.page == "game") {
        let row_col = getHexRowCol(cx, cy);
        const row = Math.max(0, Math.min(row_col[0], gameState.rows - 1));
        const col = Math.max(0, Math.min(row_col[1], gameState.columns - 1));
        const u = unitAt(row, col);

        selectedRow = row;
        selectedColumn = col;
        selectedUnitId = u ? u.id : null;

        updateMapBoundry();
        moveMap();
    }
}

function handleMouseMovement(event) {
    if (gameState.page == "game") {
        pos1 = pos3 - event.clientX;
        pos2 = pos4 - event.clientY;
        pos3 = event.clientX;
        pos4 = event.clientY;

        // $("#debug_hex_info").show();

        if (selectedColumn == null || selectedRow == null) {
            $("#debug_hex_dis").hide();
        } else {
            $("#debug_hex_dis").show();
        }

        if (isMouseInBoard()) {
            $("#cell_display").show();
        } else {
            $("#cell_display").hide();
        }

        if (mouseDown && isMouseInBoard()) {
            camX -= pos1;
            camY -= pos2;
        }

        updateMapBoundry();
        moveMap();
    } else {
        applyMenuParallax(event);
    }
}

function handleKeyboardInput(event) {

    if (gameState.page == "game") {
        if (event.keyCode == 32) {
            let ix = (boardWidth - cx / zoom);
            let iy = (boardHeight - cy / zoom);

            if (zoom == 1)
                zoom = 3;
            else
                zoom = 1;

            camX = ix * zoom - (boardWidth / 2) * (zoom - 1);
            camY = iy * zoom - (boardHeight / 2) * (zoom - 1);

            updateMapBoundry();
            updateDebugMap();
            updatePathVizualizers();
            moveMap();
        }
        if (gameState.page == "game") {

            if (event.key === 'A' || event.key === 'a') {
                if (gameState.phase !== 'movement') {
                    setCellInfPar("Nie można aktywować jednostki poza fazą ruchu");
                    return;
                }
            }

            if (event.key === 'M' || event.key === 'm') {
                if (gameState.phase !== 'movement') {
                    setCellInfPar("Ruch tylko w fazie movement");
                    return;
                }
            }

            if (event.key === 'C' || event.key === 'c') {
                if (gameState.phase !== 'combat') {
                    setCellInfPar("Walka tylko w fazie combat");
                    return;
                }
            }
        }
        if (event.key === 'A' || event.key === 'a') {
            if (selectedUnitId) {
                const res = activateUnit(selectedUnitId);
                setCellInfPar(res.msg);
            }
        }
        if (event.key === 'M' || event.key === 'm') {
            if (selectedUnitId) {
                const u = gameState.units[selectedUnitId];
                if (!u || (u.faction == "nazis" && u.faction != gameState.activePlayer) || (u.faction != "nazis" && "nazis" == gameState.activePlayer)) return;

                let rowcol = getHexRowCol(cx, cy);
                let row = rowcol[0];
                let col = rowcol[1];

                const targetRow = row;
                const targetCol = col;
                const res = moveUnitToTarget(selectedUnitId, targetRow, targetCol);
                setCellInfPar(res.msg);
                if (typeof updateDebugMap === 'function') updateDebugMap();
                if (typeof moveMap === 'function') moveMap();

                $("#cost_info").text("Movement cost: " + res.cost);
            }
        }
        if (event.key === 'C' || event.key === 'c') {
            if (selectedUnitId) {
                const u = gameState.units[selectedUnitId];
                if (!u) return;
                const neigh = getHexNeighbors(u.row, u.col);
                const enemies = [];
                neigh.forEach(n => {
                    const victim = unitAt(n[0], n[1]);
                    if (victim && victim.faction !== u.faction) enemies.push(victim.id);
                });
                if (enemies.length === 0) { setCellInfPar('Brak sąsiednich wrogów'); return; }
                const res = resolveCombat([selectedUnitId], enemies, 'medium');
                setCellInfPar('Combat result:' + res);
                if (typeof updateDebugMap === 'function') updateDebugMap();
                if (typeof moveMap === 'function') moveMap();
            }
        }
        if (event.key === 'F' || event.key === 'f') {
            const res = endPhase();
            setCellInfPar("TURN:" + gameState.turn + "PLAYER:" + gameState.activePlayer + "PHASE:" + gameState.phase + "<br>" + "PHASE:" + gameState.phase + res);

            if (typeof updateDebugMap === 'function') updateDebugMap();
            if (typeof moveMap === 'function') moveMap();

            $("body").css({ "background-color": gameState.activePlayer == "nazis" ? "#a6acbdff" : "#77ab79ff" });
        }
    }
}
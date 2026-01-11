function handleClick(event) {
    if (isMouseInBoard() && gameState.page == "game") {
        let row_col = getHexRowCol(cx, cy);
        const row = Math.max(0, Math.min(row_col[0], gameState.rows - 1));
        const col = Math.max(0, Math.min(row_col[1], gameState.columns - 1));
        const u = unitAt(row, col);

        if(event.button == 0){
            
            if(u && u.id){
                selectedUnitId = u ? (selectedUnitId != u.id ? u.id : null) : null;
            }else{
                selectedUnitId = null;
            }

            clearPathVizualizers();
        }else if(event.button == 2){

            if(!u){
                if(selectedRow==row && selectedColumn==col){
                    selectedRow = null;
                    selectedColumn = null;
                }else{
                    selectedRow = row;
                    selectedColumn = col;
                }
            }else{
                selectedRow=null;
                selectedColumn=null;
            }

            clearPathVizualizers();
        }

        if(selectedUnitId && gameState.phase == "movement" && ((gameState.units[selectedUnitId].faction == "nazis" && gameState.activePlayer == "nazis") || (gameState.activePlayer != "nazis" && gameState.units[selectedUnitId].faction != "nazis"))){
            createPathGuide(true);
        }

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
                    sendLog("You can only activate units during the MOVEMENT phase.");
                    return;
                }
            }

            if (event.key === 'M' || event.key === 'm') {
                if (gameState.phase !== 'movement') {
                    sendLog("You can only move units during the MOVEMENT phase.");
                    return;
                }
            }

            if (event.key === 'C' || event.key === 'c') {
                if (gameState.phase !== 'combat') {
                    sendLog("You can only engage in combat during the COMBAT phase.");
                    return;
                }
            }
        }
        if (event.key === 'A' || event.key === 'a') {
            if (selectedUnitId && gameState.animatedUnits[selectedUnitId] == null) {
                const res = activateUnit(selectedUnitId);
                if (typeof updateDebugMap === 'function') updateDebugMap();
                sendLog(`Activated unit: ${selectedUnitId}.`);
            }
        }
        if (event.key === 'M' || event.key === 'm') {
            if (selectedUnitId!=null && selectedColumn!=null && selectedRow!=null && gameState.animatedUnits[selectedUnitId] == null && !isCellPartOfPath(selectedRow, selectedColumn)) {
                clearPathVizualizers();
                const u = gameState.units[selectedUnitId];
                if (!u || (u.faction == "nazis" && u.faction != gameState.activePlayer) || (u.faction != "nazis" && "nazis" == gameState.activePlayer)) return;

                const targetRow = selectedRow;
                const targetCol = selectedColumn;

                sendLog(`Began movement for unit: ${selectedUnitId} to cell: ${padLeft(targetCol + 1, 2) + padLeft(targetRow, 2)}.`);

                const res = moveUnitToTarget(selectedUnitId, targetRow, targetCol);
                if (typeof updateDebugMap === 'function') updateDebugMap();
                if (typeof moveMap === 'function') moveMap();
            }
        }
        if (event.key === 'C' || event.key === 'c') {
            if (selectedUnitId && gameState.animatedUnits[selectedUnitId] == null) {
                const u = gameState.units[selectedUnitId];
                if (!u) return;
                const neigh = getHexNeighbors(u.row, u.col);
                const enemies = [];
                neigh.forEach(n => {
                    const victim = unitAt(n[0], n[1]);
                    if (victim && victim.faction !== u.faction) enemies.push(victim.id);
                });
                if (enemies.length === 0) { sendLog("No neighboring enemies."); return; }
                const res = resolveCombat([selectedUnitId], enemies, 'medium');
                sendLog(`Combat result: ${res}.`);
                if (typeof updateDebugMap === 'function') updateDebugMap();
                if (typeof moveMap === 'function') moveMap();
            }
        }
    }
}
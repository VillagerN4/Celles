function handleClick(event) {
    const mClickRelease = document.getElementById("m_click_rel");
    const mClick = document.getElementById("m_click");

    if (isMouseInBoard() && gameState.page == "game") {
        let row_col = getHexRowCol(cx, cy);
        const row = Math.max(0, Math.min(row_col[0], gameState.rows - 1));
        const col = Math.max(0, Math.min(row_col[1], gameState.columns - 1));
        const u = unitAt(row, col);

        if(event.button == 0){
            
            if(u && u.id){
                if(selectedUnitId == u.id && gameState.terminalTab == 'unit' && lastSelectedEnemy == null){
                    setTerminalPage('log');
                    selectedUnitId = null;
                    mClick.currentTime = 0;
                    mClick.play();
                }else{
                    if(((u.faction == "nazis" && gameState.activePlayer == "nazis") || (gameState.activePlayer != "nazis" && u.faction != "nazis"))){
                        selectedUnitId = u.id;
                        lastSelectedEnemy = null;

                        setTerminalPage('unit');
                        mClickRelease.currentTime = 0;
                        mClickRelease.play();
                    }else{
                        if(selectedEnemyUnitsIds[u.id] == "SELECTED"){
                            if(lastSelectedEnemy == u.id){
                                selectedEnemyUnitsIds[u.id] = null;
                                if(selectedUnitId == null) setTerminalPage('log');
                                lastSelectedEnemy = null;
                                mClick.currentTime = 0;
                                mClick.play();
                            }else{
                                selectedEnemyUnitsIds[u.id] = "SELECTED";
                                lastSelectedEnemy = u.id;

                                setTerminalPage('unit');
                                mClickRelease.currentTime = 0;
                                mClickRelease.play();
                            }
                        }else{
                                selectedEnemyUnitsIds[u.id] = "SELECTED";
                                lastSelectedEnemy = u.id;
                                mClickRelease.currentTime = 0;
                                mClickRelease.play();
                                
                                setTerminalPage('unit');
                        }
                    }
                }
            }else{
                selectedUnitId = null; 
                setTerminalPage('log');
            }

            clearPathVizualizers();
        }else if(event.button == 2){

            if(!u){
                if(selectedRow==row && selectedColumn==col && gameState.terminalTab == 'cell'){
                    selectedRow = null;
                    selectedColumn = null;
                    setTerminalPage('log');
                    mClick.currentTime = 0;
                    mClick.play();
                }else{
                    setTerminalPage('cell');
                    selectedRow = row;
                    selectedColumn = col;
                    mClickRelease.currentTime = 0;
                    mClickRelease.play();
                }
            }else{
                selectedRow=null;
                selectedColumn=null;
                setTerminalPage('log');
            }

            clearPathVizualizers();
        }

        if(selectedUnitId && gameState.phase == "movement" && ((gameState.units[selectedUnitId].faction == "nazis" && gameState.activePlayer == "nazis") || (gameState.activePlayer != "nazis" && gameState.units[selectedUnitId].faction != "nazis"))){
            createPathGuide(true);
        }

        updateMapBoundry();
        updateUnits();
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
        // if (event.key === 'C' || event.key === 'c') {
        //     if (selectedUnitId && gameState.animatedUnits[selectedUnitId] == null) {
        //         const u = gameState.units[selectedUnitId];
        //         if (!u) return;
        //         const neigh = getHexNeighbors(u.row, u.col);
        //         const enemies = [];
        //         neigh.forEach(n => {
        //             const victim = unitAt(n[0], n[1]);
        //             if (victim && victim.faction !== u.faction) enemies.push(victim.id);
        //         });
        //         if (enemies.length === 0) { sendLog("No neighboring enemies."); return; }
        //         const res = resolveCombat([selectedUnitId], enemies, 'medium');
        //         sendLog(`Combat result: ${res}.`);
        //         if (typeof updateDebugMap === 'function') updateDebugMap();
        //         if (typeof moveMap === 'function') moveMap();
        //     }
    }
}
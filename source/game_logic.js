$( document ).ready(function() {

const container = document.getElementById("board_container");
container.style.width = boardWidth + "px";
container.style.height = boardHeight + "px";
container.style.top = mapOffsetY + "px";
container.style.left = mapOffsetX + "px";



$("#debug_hex_dis").hide();
$("#debug_hex_info").hide();
$("#cell_display").hide();



function handleClick(event){
    if(isMouseInBoard()){
        let row_col = getHexRowCol(cx, cy);
        const row = Math.max(0, Math.min(row_col[0], gameState.rows - 1));
        const col = Math.max(0, Math.min(row_col[1], gameState.columns - 1));
        const u = unitAt(row, col);

        selectedRow = row;
        selectedColumn = col;
        selectedUnitId = u ? u.id : null;
    }
}

function handleMouseMovement(event){
    pos1 = pos3 - event.clientX;
    pos2 = pos4 - event.clientY;
    pos3 = event.clientX;
    pos4 = event.clientY;

    $("#debug_hex_info").show();

    if(selectedColumn == null || selectedRow == null){
        $("#debug_hex_dis").hide();
    }else{
        $("#debug_hex_dis").show();
    }
    // $("#cell_display").show();

    if(mouseDown && isMouseInBoard()){
        camX -= pos1;
        camY -= pos2;
    }
    
    updateMapBoundry();
    moveMap();
}

function handleKeyboardInput(event){
   if(event.keyCode == 32){
       let ix = (boardWidth - cx/zoom);
    let iy = (boardHeight - cy/zoom);

    if(zoom == 1)
        zoom = 3;
    else
        zoom = 1;

    camX = ix*zoom - (boardWidth/2) * (zoom - 1);
    camY = iy*zoom - (boardHeight/2) * (zoom - 1);
    
    updateMapBoundry();
    updateDebugMap();
    moveMap();
   }
  if (event.key === 'A' || event.key === 'a') {
    if (selectedUnitId) {
      const res = activateUnit(selectedUnitId);
      console.log(res.msg);
    }
  }
  if (event.key === 'M' || event.key === 'm') {
    if (selectedUnitId) {
      const u = gameState.units[selectedUnitId];
      if (!u) return;

      let rowcol = getHexRowCol(cx, cy);
      let row = rowcol[0];
      let col = rowcol[1];

      const targetRow = row;
      const targetCol = col;
      const res = executeMovementPath(selectedUnitId, [[targetRow, targetCol]]);
      
      if (typeof updateDebugMap === 'function') updateDebugMap();
      if (typeof drawUnits === 'function') drawUnits();
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
      if (enemies.length === 0) { console.log('Brak sąsiednich wrogów'); return; }
      const res = resolveCombat([selectedUnitId], enemies, 'medium');
      console.log('Combat result:', res);
      if (typeof updateDebugMap === 'function') updateDebugMap();
      if (typeof drawUnits === 'function') drawUnits();
      if (typeof moveMap === 'function') moveMap();
    }
  }
}

$(document).mousemove(handleMouseMovement);
$(document).mousedown(function(event){mouseDown = true && event.which == 2;});
$(document).mouseup(function(){mouseDown = false;});
$(document).click(handleClick);
$(document).keyup(handleKeyboardInput);
$(document).on("contextmenu", function(event) {
    event.preventDefault();
});

seedUnitsExample();
createDebugMap();
drawUnits();

$("#page_game").hide();
});
$( document ).ready(function() {

const menuMusic = document.getElementById("menu_music");
const gameMusic = document.getElementById("game_music");
const mHover = document.getElementById("m_hover");
const mClick = document.getElementById("m_click");
const mClickRelease = document.getElementById("m_click_rel");
const container = document.getElementById("board_container");
container.style.width = boardWidth + "px";
container.style.height = boardHeight + "px";
container.style.top = mapOffsetY + "px";
container.style.left = mapOffsetX + "px";



$("#debug_hex_dis").hide();
$("#debug_hex_info").hide();
$("#cell_display").hide();



function handleClick(event){
    if(isMouseInBoard() && gameState.page == "game"){
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

function handleMouseMovement(event){
  if(gameState.page == "game"){
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

    if(isMouseInBoard()){
      $("#cell_display").show();
    }else{
      $("#cell_display").hide();
    }

    if(mouseDown && isMouseInBoard()){
        camX -= pos1;
        camY -= pos2;
    }
    
    updateMapBoundry();
    moveMap();
  }else{
    applyMenuParallax(event);
  }
}

function handleKeyboardInput(event){
  if(gameState.page == "game"){
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
        const res = moveUnitToTarget(selectedUnitId, targetRow, targetCol);
        console.log(res);
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
}

$(document).mousemove(handleMouseMovement);
$(document).mousedown(function(event){mouseDown = true && event.which == 2;});
$(document).mouseup(function(){mouseDown = false;});
$(document).click(handleClick);
$(document).keyup(handleKeyboardInput);
$(document).on("contextmenu", function(event) {
    event.preventDefault();
});

$(document).one("click", function(){
    pageAnimating = true;
    menuMusic.play();
    mHover.currentTime = 0;
    mHover.play();

    musicStarted = true;

    $("body").css("background-color", "white");
    $("#tap_anywhere").fadeOut(!debugMode ? 500 : 1);

    $("#title_holder").fadeIn(!debugMode ? 3500 : 1, function(){
      $("#menu_buttons").addClass("slide");
      pageAnimating = false;
    });

    $("#page_menu").show();
    $("#menu_panorama").fadeIn(!debugMode ? 500 : 1);
});

$("#begin").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;
    gameState.page = "game";

    gameMusic.volume = 0;
    gameMusic.play();

    fadeAudio(menuMusic, menuMusic.volume, 0, 2000);
    fadeAudio(gameMusic, gameMusic.volume, 1, 4000);

    $("#menu_panorama").fadeOut(pageFadeTime);
    $("#page_menu").fadeOut(pageFadeTime, function(){$("#page_game").fadeIn(pageFadeTime, function(){pageAnimating=false})});

    seedUnitsExample();
    updateDisplayParams();
    createDebugMap();
    drawUnits();
  }
});

$("#controls").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;
    gameState.page = "controls";

    $("#page_menu").fadeOut(pageFadeTime, function(){$("#page_controls").fadeIn(pageFadeTime, function(){pageAnimating=false})});
  }
});

$("#quit").click(function(event){
  if(!pageAnimating){
    window.open(' ','_self');
    window.close();
  }
});

$("#config").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;
    gameState.page = "config";
  
    updateDisplayParams();

    $("#page_menu").fadeOut(pageFadeTime, function(){$("#page_displayconfig").fadeIn(pageFadeTime, function(){pageAnimating=false})});
  }
});

$(".to_menu").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;

    $(gameState.page == "config" ? "#page_displayconfig" : "#page_controls").fadeOut(pageFadeTime, function(){$("#page_menu").fadeIn(pageFadeTime, function(){pageAnimating=false})});
    
    gameState.page = "menu";
  }
});

$(".button").mouseover(function(event){
  if(!pageAnimating){
    mHover.currentTime = 0;
    mHover.play();
  }
});

$(".button").mousedown(function(event){
  if(!pageAnimating && event.which == 1){
    mClick.currentTime = 0;
    mClick.play();
  }
});

$(".button").mouseup(function(event){
  if(!pageAnimating && event.which == 1){
    mClickRelease.currentTime = 0;
    mClickRelease.play();
  }
});

$("#board_size").mousemove(function(){
  sizeFactor = $(this).val();

  updateDisplayParams();
});

$("#page_game").hide();
$("#page_controls").hide();
$("#page_displayconfig").hide();
$("#page_menu").hide();
$("#title_holder").hide();
$("#menu_panorama").hide();
$("#cover").hide();
});
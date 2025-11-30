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

    // $("#debug_hex_info").show();

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

    $("body").css({"background-color": gameState.activePlayer == "nazis" ? "#a6acbdff" : "#77ab79ff"});
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
    menuMusic.volume = musicVolume;
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
    fadeAudio(gameMusic, gameMusic.volume, musicVolume, 4000);

    $("#menu_panorama").fadeOut(pageFadeTime);
    $("#page_menu").fadeOut(pageFadeTime, function(){$("#page_game").fadeIn(pageFadeTime, function(){pageAnimating=false})});

    seedUnitsExample();
    updateDisplayParams();
    createDebugMap();
    for (let id in gameState.units) {
      drawUnit(id);
    }
    startTurnWithQueue("nazis");

    blurMenu();
  }
});

$("#controls").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;
    gameState.page = "controls";

    $("#page_menu").fadeOut(pageFadeTime, function(){$("#page_controls").fadeIn(pageFadeTime, function(){pageAnimating=false})});

    blurMenu();
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

    blurMenu();
  }
});

$(".to_menu").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;

    $(gameState.page == "config" ? "#page_displayconfig" : "#page_controls").fadeOut(pageFadeTime, function(){$("#page_menu").fadeIn(pageFadeTime, function(){pageAnimating=false})});
    
    gameState.page = "menu";

    blurMenu();
  }
});

$(".to_options").click(function(event){
  if(!pageAnimating){

    pageAnimating = true;

    $("#preview").fadeOut(pageFadeTime, function(){$("#settings_p").fadeIn(pageFadeTime, function(){pageAnimating=false})});
  }
});

$("#to_preview").click(function(event){
  if(!pageAnimating){    

    pageAnimating = true;

    $("#settings_p").fadeOut(pageFadeTime, function(){$("#preview").fadeIn(pageFadeTime, function(){pageAnimating=false})});

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

function endPhase() {
  if (gameState.phase === 'movement') {
    gameState.phase = 'combat';
    return { ok:true, phase:'combat' };
  } else if (gameState.phase === 'combat') {
    resolveAllEngagements();
    gameState.phase = 'supply';
    return { ok:true, phase:'supply' };
  } else if (gameState.phase === 'supply') {
    supplyAndRecoveryPhase();
    endTurn();
    return { ok:true, phase:'end' };
  }
  return { ok:false };
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


function goToNextUnit() {
    queueIndex++;

    if (queueIndex >= unitQueue.length) {
        setCellInfPar("Brak kolejnych jednostek – zakończ fazę klawiszem F.");
        selectedUnitId = null;
        return;
    }

    const nextId = unitQueue[queueIndex];
    selectedUnitId = nextId;
    const u = gameState.units[nextId];

    setCellInfPar("Przechodzisz do kolejnej jednostki:" + nextId + "na polu" + u.row + u.col);
}

globalThis.onUnitFinishedMovement = function(unitId) {
    const u = gameState.units[unitId];
    if (!u) return;

    u.used = true;

    setCellInfPar("Jednostka zakończyła ruch:" + unitId);

    goToNextUnit();
}

function startTurnWithQueue(player) {
    $("body").css({"background-color": gameState.activePlayer == "nazis" ? "#a6acbdff" : "#77ab79ff"});
    setCellInfPar("TURN:" + gameState.turn + "PLAYER:" + gameState.activePlayer + "PHASE:" + gameState.phase);
    startTurn(player);
    buildUnitQueue();

    if (unitQueue.length === 0) {
        setCellInfPar("Brak jednostek dla gracza:" + player);
        return;
    }

    selectedUnitId = unitQueue[0];
    const u = gameState.units[selectedUnitId];
    setCellInfPar("Tura gracza:" + player + "– pierwsza jednostka:" + selectedUnitId);
}

$("#music_volume").mousemove(function(){
  musicVolume = $(this).val();
  menuMusic.volume = musicVolume;
});

$("#page_game").hide();
$("#page_controls").hide();
$("#page_displayconfig").hide();
$("#page_menu").hide();
$("#title_holder").hide();
$("#preview").hide();
$("#menu_panorama").hide();
$("#cover").hide();
});
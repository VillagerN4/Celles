$( document ).ready(function() {

let debCounter = 1;

const sqrt3 = Math.sqrt(3);

const mapOffsetX = 10;
const mapOffsetY = 10;
const rows = 17;
const columns = 33;

const sizeFactor = 0.7;

const boardWidth = 1153 * sizeFactor;
const boardHeight = 700 * sizeFactor;

const hexRadius = 23.085 * sizeFactor;
const hexHeight = hexRadius * sqrt3 / 2;

const container = document.getElementById("board_container");
container.style.width = boardWidth + "px";
container.style.height = boardHeight + "px";

var zoom = 1;
var camX = boardWidth/2;
var camY = boardHeight/2;

var leftBoundry = 0;
var rightBoundry = 0;
var topBoundry = 0;
var bottomBoundry = 0;

var pos1 = 0;
var pos2 = 0;
var pos3 = 0;
var pos4 = 0;
var cx = 0;
var cy = 0;
var mouseDown = false;
var selectedRow = null;
var selectedColumn = null;

const factions = ["allies", "nazis", "brits"];
const modes = ["reduced", "standard", "active"];

const edgeInfo = ["none", "river", "large river"];
const edgeNames = ["top-left", "top", "top-right", "bottom-left", "bottom", "bottom-right"];
const terrainTypes = ["clear", "rough", "woods", "town"];

$("#debug_hex_dis").hide();
$("#debug_hex_info").hide();
$("#cell_display").hide();

// ------------------------------------------------------------ //

function updateMapBoundry(){
    leftBoundry = boardWidth/2 - (boardWidth/2)*(zoom - 1);
    rightBoundry = boardWidth/2 + (boardWidth/2)*(zoom - 1);
    topBoundry = boardHeight/2 - (boardHeight/2)*(zoom - 1);
    bottomBoundry = boardHeight/2 + (boardHeight/2)*(zoom - 1);

    if(camX < leftBoundry){
        camX = leftBoundry;
    }
    if(camX > rightBoundry){
        camX = rightBoundry;
    }
    if(camY < topBoundry){
        camY = topBoundry;
    }
    if(camY > bottomBoundry){
        camY = bottomBoundry;
    }
}


// ------------------------------------------------------------ //


function degToRad(deg){
    return deg * Math.PI / 180;
}

function radToDeg(rad){
    return (rad / Math.PI) * 180;
}

function isPointInsideHexagon(px, py, cx, cy, radius) {

    let dx = (px - cx) / radius;
    let dy = (py - cy) / radius;

    return dy > -sqrt3 / 2
        && dy < sqrt3 / 2
        && sqrt3 * dx + sqrt3 > dy
        && sqrt3 * dx - sqrt3 < dy
        && -sqrt3 * dx + sqrt3 > dy
        && -sqrt3 * dx - sqrt3 < dy;
}

function getHexCenterPos(row, column){
    let x = (hexRadius + (1.5*column) * hexRadius) * zoom;
    let y = (hexHeight + (2*row + column % 2) * hexHeight) * zoom;

    return [x, y];
}

function getHexRowCol(x, y){
    let lx = Math.floor(x/(hexRadius * zoom));
    let ly = Math.floor(y/(hexHeight * zoom));

    let column = Math.floor(lx / 1.5);
    let row = Math.floor(ly / 2 - (column % 2)/2);

    let thisCenterPos = getHexCenterPos(row, column);
    let isInHex = isPointInsideHexagon(x, y, thisCenterPos[0], thisCenterPos[1], hexRadius * zoom);

    if(!isInHex){
        let row_diff = y - thisCenterPos[1];
        let col_diff = x - thisCenterPos[0];

        let r1 = row_diff / Math.abs(row_diff);
        if(r1 < 0){
            row += r1;
        }

        column += col_diff / Math.abs(col_diff);
    }

    return [row, column];
}

function padLeft(nr, n, str){
    return Array(n - String(nr).length + 1).join(str||'0') + nr;
}


// ------------------------------------------------------------ //

function isMouseInBoard(){
    return (pos3 + window.scrollX) >= mapOffsetX && (pos3 + window.scrollX) <= (mapOffsetX + boardWidth) && (pos4 + window.scrollY) >= mapOffsetY && (pos4 + window.scrollY) <= (mapOffsetY + boardHeight);
}

function debugSwitchCellDisplay(){
    const cell_dis = document.getElementById("cell_display");

    cell_dis.src = `assets/cell/${factions[Math.floor(debCounter/3)]}/${factions[Math.floor(debCounter/3)]}_${modes[debCounter % 3]}.png`;

    debCounter++;

    if(debCounter > 8) debCounter = 0;
}

function handleClick(event){
    if(isMouseInBoard()){
        let row_col = getHexRowCol(cx, cy);

        selectedRow = Math.max(0,Math.min(row_col[0],rows-1));
        selectedColumn = Math.max(0,Math.min(row_col[1],columns-1));
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

function moveMap(){
    cx = pos3 - mapOffsetX + window.scrollX - camX + boardWidth * zoom/2;
    cy = pos4 - mapOffsetY + window.scrollY - camY + boardHeight * zoom/2;

    const deb_hex = document.getElementById("debug_hex_info");
    const cell_inf = document.getElementById("cell_info");
    const board_img = document.getElementById("board");
    const debug_board = document.getElementById("debug_board_container");

    const debug_hex = document.getElementById("debug_hex_dis");
    const cell_dis = document.getElementById("cell_display");

    let row_col = getHexRowCol(cx, cy);
    let board_row = Math.max(0,Math.min(row_col[0],rows-1));
    let board_col = Math.max(0,Math.min(row_col[1],columns-1));

    let pos = getHexCenterPos(board_row, board_col);
    let sel_pos = getHexCenterPos(selectedRow, selectedColumn);

    debug_hex.style.left = camX - boardWidth * zoom/2 + sel_pos[0] - hexRadius * zoom + "px";
    debug_hex.style.top = camY - boardHeight * zoom/2 + sel_pos[1] - hexHeight * zoom + "px";

    // cell_dis.style.left = camX - boardWidth * zoom/2 + sel_pos[0] - hexRadius * zoom + "px";
    // cell_dis.style.top = camY - boardHeight * zoom/2 + sel_pos[1] - hexHeight * zoom + "px";

    deb_hex.innerHTML = padLeft(board_col + 1, 2) + padLeft(board_row, 2)
     + "<br>" + board_row + " " + board_col
     + "<br>" + cx + " " + cy;
    deb_hex.style.left = pos3 + 15 + "px";
    deb_hex.style.top = pos4 + 15 + "px";

    let this_cell_inf = board_data.board[board_col][board_row];
    cell_inf.innerHTML = ""
    + "<br>Terrain type: " + terrainTypes[this_cell_inf.terrainType]
    + "<br>Has village: " + this_cell_inf.hasVillage
    + "<br>Edge info: ";
    for(let i = 0; i < 6; i++) {
        cell_inf.innerHTML += `<br> - ${edgeNames[i]}: ${edgeInfo[this_cell_inf.edges[i]]}`;
    };

    board_img.style.width = boardWidth * zoom + "px";
    board_img.style.height = boardHeight * zoom + "px";
    board_img.style.top = camY - boardHeight * zoom/2 + "px";
    board_img.style.left = camX - boardWidth * zoom/2 + "px";

    debug_board.style.top = camY - boardHeight * zoom/2 + "px";
    debug_board.style.left = camX - boardWidth * zoom/2 + "px";

    debug_hex.style.width = hexRadius*2 * zoom + "px";
    debug_hex.style.height = hexHeight*2 * zoom + "px";

    cell_dis.style.width = hexRadius*2  * zoom + "px";
    cell_dis.style.height = hexHeight*2 * zoom + "px";
}


$(document).mousemove(handleMouseMovement);
$(document).mousedown(function(event){mouseDown = true && event.which == 2;});
$(document).mouseup(function(){mouseDown = false;});
$(document).click(handleClick);
$(document).keyup(function(event){
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
});
$(document).on("contextmenu", function(event) {
    event.preventDefault();
});

function createCellEdgeDetail(x, y, class_name, parent, sprite, edge, r, c){
    jQuery('<img>', {
        id: sprite + padLeft(c + 1, 2) + padLeft(r, 2) + edge,
        class: class_name,
        src: `assets/debug/${sprite}/base.png`,
        css: {
            position: "absolute",
            transform: (edge > 2) ? `rotate(${180 - 60*(edge - 4)}deg)` : `rotate(${60*(edge - 1)}deg)`,
            left: x,
            top: y,
            width: hexRadius*2 + "px",
            height: hexHeight*2 + "px"
        }
    }).appendTo(parent);
}

function createDebugMap(){
    for(let c = 0; c < columns; c++){
        for(let r = 0; r < rows; r++){
            let cell = board_data.board[c][r];
            let cell_pos = getHexCenterPos(r, c);
            let x = cell_pos[0] - hexRadius*zoom + "px";
            let y = cell_pos[1] - hexHeight*zoom  + "px";
            let uncoveredHouses = [0, 0, 0, 0, 0, 0];

            if(cell.hasVillage){
                jQuery('<img>', {
                    id: "village_marker" + padLeft(c + 1, 2) + padLeft(r, 2),
                    class: "debug_village_display",
                    src: "assets/debug/village.png",
                    css: {
                        position: "absolute",
                        left: x,
                        top: y,
                        width: hexRadius*2 + "px",
                        height: hexHeight*2 + "px"
                    }
                }).appendTo('#debug_board_container');
            }

            jQuery('<img>', {
                id: padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_hex_display",
                src: "assets/debug/terrain/" + cell.terrainType + ".png",
                css: {
                    position: "absolute",
                    left: x,
                    top: y,
                    width: hexRadius*2 + "px",
                    height: hexHeight*2 + "px"
                }
            }).appendTo('#debug_board_container');

            if(cell.terrainType == 2){
            jQuery('<img>', {
                id: "trees" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_tree_display",
                src: "assets/debug/terrain/2_" + Math.round(Math.random()) + ".png",
                css: {
                    position: "absolute",
                    left: x,
                    top: y,
                    width: hexRadius*2 + "px",
                    height: hexHeight*2 + "px"
                }
            }).appendTo('#debug_board_container');
            }

            if (cell.units && cell.units.length > 0) {

                let unit = cell.units.find(u =>
                    ["nazis", "brits", "us"].includes(u.faction)
                );

                if (unit) {
                    let faction = faction;
                    jQuery('<img>', {
                        id: "unit_" + padLeft(c + 1, 2) + padLeft(r, 2),
                        class: "unit_display",
                        src: `assets/cell/${faction}/${faction}_standard.png`,
                        css: {
                            position: "absolute",
                            left: x,
                            top: y,
                            pointerEvents: "none",
                            width: hexRadius*2 + "px",
                            height: hexHeight*2 + "px"
                        }
                    }).appendTo('#debug_board_container');
                }
            }

            for(let i = 0; i < 6; i++) {
                if(cell.edges[i] > 0)
                    createCellEdgeDetail(x, y, "debug_river_display", "#board_rivers", (cell.edges[i] == 1) ? "river" : "large_river", i, r, c);

            };

            cell.highways.forEach(edge => {
            createCellEdgeDetail(x, y, "debug_highway_display", "#board_highways", "highway", edge, r, c);
            uncoveredHouses[edge] += 1;
            });

            cell.roads.forEach(edge => {
            createCellEdgeDetail(x, y, "debug_road_display", "#board_roads", "road", edge, r, c);
            uncoveredHouses[edge] += 1;
            });


            for(let i = 0; i < 6; i++) {
                if(uncoveredHouses[i] == 0 && cell.terrainType == 3)
                    jQuery('<img>', {
                        id: "houses" + padLeft(c + 1, 2) + padLeft(r, 2) + i,
                        class: "debug_house_display",
                        src: `assets/debug/terrain/3_${i}.png`,
                        css: {
                            position: "absolute",
                            left: x,
                            top: y,
                            width: hexRadius*2 + "px",
                            height: hexHeight*2 + "px"
                        }
                    }).appendTo("#debug_board_container");

            };


            jQuery('<div>', {
                id: "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_cell_label_display",
                css: {
                    position: "absolute",
                    left: x,
                    top: y,
                    width: hexRadius*2 + "px",
                    height: hexHeight*2 + "px"
                }
            }).appendTo('#debug_board_container');

            jQuery('<p>', {
                id: "label_cell" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_cell_label_text",
                text: padLeft(c + 1, 2) + padLeft(r, 2),
                css: {
                    width: hexRadius*2 + "px",
                    'font-size': "8px"
                }
            }).appendTo('#' + "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2));

            jQuery('<p>', {
                id: "label_cell_inner" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_cell_label_text_inner",
                text: padLeft(c + 1, 2) + padLeft(r, 2),
                css: {
                    width: hexRadius*2 + "px",
                    'font-size': "8px"
                }
            }).appendTo('#' + "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2));
        }
    }
}

function updateDebugMap(){
    for(let c = 0; c < columns; c++){
        for(let r = 0; r < rows; r++){
            let cell = board_data.board[c][r];
            let cell_pos = getHexCenterPos(r, c);
            let x = cell_pos[0] - hexRadius*zoom + "px";
            let y = cell_pos[1] - hexHeight*zoom  + "px";
            $("#village_marker" + padLeft(c + 1, 2) + padLeft(r, 2)).css({
                "width": hexRadius*2*zoom + "px",
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            });
            $("#" + padLeft(c + 1, 2) + padLeft(r, 2)).css({
                "width": hexRadius*2*zoom + "px", 
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            });
            $("#trees" + padLeft(c + 1, 2) + padLeft(r, 2)).css({
                "width": hexRadius*2*zoom + "px", 
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            });
            for(let i = 0; i < 6; i++) {
                if(cell.edges[i] > 0){
                    $("#" + (cell.edges[i] == 1 ? "river" : "large_river") + padLeft(c + 1, 2) + padLeft(r, 2) + i).css({
                        "width": hexRadius*2*zoom + "px", 
                        "height": hexHeight*2*zoom + "px", 
                        "left": x,
                        "top": y
                    });
                }

                if(cell.terrainType == 3){
                    $("#" + "houses" + padLeft(c + 1, 2) + padLeft(r, 2) + i).css({
                        "width": hexRadius*2*zoom + "px", 
                        "height": hexHeight*2*zoom + "px", 
                        "left": x,
                        "top": y
                    });
                }
            }
            cell.highways.forEach(edge => {
            $("#" + "highway" + padLeft(c + 1, 2) + padLeft(r, 2) + edge).css({
                "width": hexRadius*2*zoom + "px", 
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            });
            });
            cell.roads.forEach(edge => {
            $("#" + "road" + padLeft(c + 1, 2) + padLeft(r, 2) + edge).css({
                "width": hexRadius*2*zoom + "px", 
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            });
            });
            $("#labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2)).css({
                "width": hexRadius*2*zoom + "px", 
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            });
            $("#label_cell" + padLeft(c + 1, 2) + padLeft(r, 2)).css({
                "width": hexRadius*2*zoom + "px",
                "font-size": 8*Math.sqrt(zoom) + "px"
            });
            $("#label_cell_inner" + padLeft(c + 1, 2) + padLeft(r, 2)).css({
                "width": hexRadius*2*zoom + "px",
                "font-size": 8*Math.sqrt(zoom)  + "px"
            });
        }
    }
}
const gameState = {
  turn: 1,
  phase: 'token',
  activePlayer: 'german',
  actionTokens: { german: [], allies: [] },
  availableActions: { german: 0, allies: 0 },
  units: {},
  formations: {},
  board: board_data.board,
  rows: rows,
  columns: columns
};

function drawUnits() {
    $(".unit_display").remove();

    for (const id in gameState.units) {
        const u = gameState.units[id];
        const pos = getHexCenterPos(u.row, u.col);
        const x = pos[0] - hexRadius * zoom + "px";
        const y = pos[1] - hexHeight * zoom + "px";

        const img = $("<img>", {
            id: "unit_" + id,
            class: "unit_display",
            src: `assets/cell/${u.faction}/${u.faction}_standard.png`,
            css: {
                position: "absolute",
                left: x,
                top: y,
                width: hexRadius * 2 * zoom + "px",
                height: hexHeight * 2 * zoom + "px",
                pointerEvents: "none",
                zIndex: 1000
            }
        });

        $("#debug_board_container").append(img);
    }
}

function createUnit(id, faction, type, col, row, levels, movement, attack, defense, motorized) {
  return {
    id, faction, type, col, row, levels,
    movement, movementLeft: movement, attack, defense,
    motorized: !!motorized, used: false,
    supplyState: 'supplied', disrupted: false
  };
}

function seedUnitsExample() {
  gameState.units['u_01_01'] = createUnit('u_01_01', 'german', 'armor', 0, 0, 2, 9, 7, 5, true);
  gameState.units['u_10_05'] = createUnit('u_10_05', 'allies', 'infantry', 9, 4, 2, 4, 3, 4, false);
}
seedUnitsExample();

const terrainCost = { clear: { mot:1, inf:1 }, rough:{ mot:2, inf:3 }, woods:{ mot:2, inf:3 }, town:{ mot:1, inf:2 } };
const roadCost = 0.5;
const highwayCost = 0.5;
const enterOccupiedMotorizedExtra = 2;

function applySupplyAndDisruptionMovement(baseMovement, unit) {
  let m = baseMovement;
  if (unit.supplyState === 'out') m *= 2/3;
  if (unit.supplyState === 'isolated') m *= 1/3;
  if (unit.disrupted) m *= 2/3;
  return Math.max(0, m);
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

function getHexNeighbors(r, c) {
  const even = [[-1,0],[-1,1],[0,1],[1,0],[0,-1],[-1,-1]];
  const odd  = [[-1,0],[0,1],[1,1],[1,0],[1,-1],[0,-1]];
  const d = (c % 2 === 0) ? even : odd;
  const out = [];
  for (const k of d) {
    const nr = r + k[0], nc = c + k[1];
    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.columns) out.push([nr, nc]);
  }
  return out;
}

function getMovementCostForEntry(unit, fromRow, fromCol, toRow, toCol) {
  const to = gameState.board[toCol][toRow];
  const terrain = ['clear','rough','woods','town'][to.terrainType] || 'clear';
  const road = to.roads && to.roads.length;
  const hwy = to.highways && to.highways.length;
  if (road || hwy) return roadCost;
  const typ = unit.motorized ? 'mot' : 'inf';
  let cost = terrainCost[terrain][typ];
  const occ = unitAt(toRow, toCol);
  if (occ && occ.motorized && unit.motorized) cost += enterOccupiedMotorizedExtra;
  return cost;
}

function unitAt(r, c) {
  for (const id in gameState.units) {
    const u = gameState.units[id];
    if (u.row === r && u.col === c) return u;
  }
  return null;
}

function executeMovementPath(unitId, path) {
  const u = gameState.units[unitId];
  if (!u) return { ok:false, msg:'Brak jednostki' };
  u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
  const ez = getZOCForFaction(u.faction === 'german' ? 'allies' : 'german');
  for (let i=0;i<path.length;i++){
    const [r,c] = path[i];
    const pr = (i===0) ? u.row : path[i-1][0];
    const pc = (i===0) ? u.col : path[i-1][1];
    const cost = getMovementCostForEntry(u, pr, pc, r, c);
    const fromKey = pr+':'+pc, toKey = r+':'+c;
    const fz = ez.has(fromKey), tz = ez.has(toKey);
    if (u.motorized && fz && tz) {
      const extra = 2;
      if (u.movementLeft < cost + extra) return { ok:false, msg:'Brak punktów ruchu' };
      const die = rollD10();
      const mod = 0;
      const res = die + mod;
      if (res >= 5) { u.movementLeft -= (cost + extra); u.row = r; u.col = c; }
      else { u.movementLeft = 0; u.disrupted = true; return { ok:false, msg:'Infiltracja nieudana' }; }
    } else {
      if (u.movementLeft < cost) return { ok:false, msg:'Brak punktów ruchu' };
      u.movementLeft -= cost; u.row = r; u.col = c;
    }
  }
  u.used = true;
  return { ok:true, msg:'Ruch wykonany' };
}

function rollD10(){ return Math.floor(Math.random()*10); }

function activateUnit(id) {
  const u = gameState.units[id];
  if (!u) return { ok:false, msg:'Brak jednostki' };
  if (u.used) return { ok:false, msg:'Jednostka już użyta' };
  u.used = false; u.movementLeft = applySupplyAndDisruptionMovement(u.movement, u);
  return { ok:true, msg:'Jednostka aktywowana' };
}

function drawActionToken(f) {
  const c = Object.values(gameState.units).filter(u => u.faction === f);
  if (!c.length) return null;
  return c[Math.floor(Math.random()*c.length)].id;
}

const simpleCRT = {
  '4': {0:'2A',1:'2A',2:'2A',3:'1A',4:'1A',5:'1A',6:'1A',7:'1A',8:'1A',9:'-'},
  '3': {0:'2A',1:'1A',2:'1A',3:'1A',4:'1A',5:'1A',6:'-',7:'-',8:'-',9:'-'},
  '2': {0:'2A',1:'1A',2:'1A',3:'1A',4:'1A',5:'-',6:'-',7:'-',8:'-',9:'-'},
  '1': {0:'1A',1:'1A',2:'-',3:'-',4:'-',5:'-',6:'-',7:'-',8:'-',9:'-'},
  '0': {0:'1D',1:'1D',2:'1D',3:'1D',4:'1D',5:'1D',6:'1D',7:'1D',8:'1D',9:'1D'}
};

function resolveCombat(aIds, dIds, attackType) {
  const A = aIds.map(id => gameState.units[id]).filter(Boolean);
  const D = dIds.map(id => gameState.units[id]).filter(Boolean);
  if (!A.length || !D.length) return { ok:false, msg:'Brak jednostek' };

  const a = A.reduce((s,u)=>s+u.attack,0);
  const d = D.reduce((s,u)=>s+u.defense,0);

  const ratio = a / Math.max(1,d);
  let rk = '0';
  if (ratio >= 4) rk='4'; else if (ratio >=3) rk='3'; else if (ratio >=2) rk='2'; else if (ratio >=1) rk='1';

  let die = rollD10(), mod = 0;
  if (attackType === 'heavy') mod += 1;
  if (D.some(x => gameState.board[x.col][x.row].terrainType === 3)) mod -= 2;
  if (A.some(x => x.disrupted)) mod -= 2;

  const fin = clampDie(die + mod);
  const out = simpleCRT[rk][fin];

  const result = { attackerLossLevels:0, defenderLossLevels:0, retreat:false, disrupted:false, raw:{a,d,rk,die,mod,fin,out} };

  if (out === '-') {}
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

  return { ok:true, result };
}

function clampDie(v){ if (v<0) return 0; if (v>9) return 9; return v; }

function applyLossesToUnits(units, levels) {
  let remaining = levels;
  const sorted = [...units].sort((a,b) => (b.levels||0) - (a.levels||0));
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

  const enemyZoc = getZOCForFaction(unit.faction === 'german' ? 'allies' : 'german');
  let curRow = unit.row, curCol = unit.col;

  for (let step = 0; step < steps; step++) {
    const candidates = getHexNeighbors(curRow, curCol).filter(([r,c]) => {
      const occ = unitAt(r,c);
      if (occ && occ.faction !== unit.faction) return false;
      return true;
    });

    if (candidates.length === 0) {
      delete gameState.units[unit.id];
      return false;
    }

    const scored = candidates.map(([r,c]) => {
      let score = 0;
      if (enemyZoc.has(r + ':' + c)) score += 100;
      const occ = unitAt(r,c);
      if (occ && occ.faction === unit.faction) score += 10;
      const dr = r - fromRow;
      const dc = c - fromCol;
      if (!matchesPreferredDirection(unit.faction, dr, dc)) score += 20;
      const dist = Math.abs(r - fromRow) + Math.abs(c - fromCol);
      score -= dist;
      return { r, c, score };
    });

    scored.sort((x,y) => x.score - y.score);
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

function matchesPreferredDirection(faction, dr, dc) {
  if (faction === 'allies' || faction === 'us' || faction === 'brits') {
    if (dr < 0) return true;
    if (dr < 0 && dc < 0) return true;
    if (dr < 0 && dc > 0) return true;
    return false;
  }
  if (faction === 'brits') {
    if (dr < 0 && dc < 0) return true;
    if (dr > 0 && dc < 0) return true;
    return false;
  }
  if (faction === 'german') {
    if (dr > 0) return true;
    if (dr > 0 && dc > 0) return true;
    return false;
  }
  return false;
}


let selectedUnitId = null;

function handleClickSelectUnit() {
  if (!isMouseInBoard()) return;
  const rc = getHexRowCol(cx, cy);
  const row = Math.max(0, Math.min(rc[0], gameState.rows - 1));
  const col = Math.max(0, Math.min(rc[1], gameState.columns - 1));
  const u = unitAt(row, col);
  selectedUnitId = u ? u.id : null;
}

$(document).click(handleClickSelectUnit);

$(document).keyup(function (e) {
  if (e.key === 'A' || e.key === 'a') {
    if (selectedUnitId) {
      const res = activateUnit(selectedUnitId);
      console.log(res.msg);
    }
  }
  if (e.key === 'M' || e.key === 'm') {
    if (selectedUnitId) {
      const u = gameState.units[selectedUnitId];
      if (!u) return;
      const targetRow = u.row;
      const targetCol = Math.min(gameState.columns - 1, u.col + 1);
      const res = executeMovementPath(selectedUnitId, [[targetRow, targetCol]]);
      console.log(res.msg);
      if (typeof updateDebugMap === 'function') updateDebugMap();
      if (typeof moveMap === 'function') moveMap();
    }
  }
  if (e.key === 'C' || e.key === 'c') {
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
      if (typeof moveMap === 'function') moveMap();
    }
  }
});

createDebugMap();
drawUnits();
});
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
                    let faction = unit.faction;

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

createDebugMap();

});
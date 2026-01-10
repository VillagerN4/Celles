var mapOffsetX = 10;
var mapOffsetY = 100;
const rows = 17;
const columns = 33;

var sizeFactor = 0.7;

var boardWidth = 1153 * sizeFactor;
var boardHeight = 700 * sizeFactor;

var hexRadius = 23.085 * sizeFactor;
var hexHeight = hexRadius * sqrt3 / 2;

var zoom = 1;
var camX = boardWidth / 2;
var camY = boardHeight / 2;

var leftBoundry = 0;
var rightBoundry = 0;
var topBoundry = 0;
var bottomBoundry = 0;


function sendLog(message) {
    jQuery('<p>', {
        class: `log_entry unread`,
        text: message
    }).appendTo('#log_history');
    if(gameState.terminalTab != "log"){
        gameState.unreadLogs += 1;
    }

    $("#tab_log_b").toggleClass("unread", gameState.unreadLogs > 0).attr("data-unread", gameState.unreadLogs > 99 ? "99+" : gameState.unreadLogs);

    if(gameState.terminalTab == "log"){
        scrollLogToBottom();
    }
}

function scrollLogToBottom(){
    const log = document.getElementById("log_history");
    let targetTop = log.scrollHeight;

    log.scrollTo({
        top: targetTop,
        behavior: "smooth"
    });
}

function scrollToFirstUnread(){
    const log = document.getElementById("log_history");
    const firstUnread = log.querySelector(".log_entry.unread");

    if (!firstUnread) return scrollLogToBottom();

    let targetTop = firstUnread.offsetTop - log.offsetTop;

    log.scrollTo({
        top: targetTop,
        behavior: "smooth"
    });
}

function clearLogs(){
    $(".log_entry").remove();
    gameState.unreadLogs = 0;
}


function updateDisplayParams() {
    boardWidth = 1153 * sizeFactor;
    boardHeight = 700 * sizeFactor;

    mapOffsetY = window.innerHeight / 2 - boardHeight / 2;

    hexRadius = 23.085 * sizeFactor;
    hexHeight = hexRadius * sqrt3 / 2;

    $("#board_placeholder").css({
        "width": boardWidth + "px",
        "height": boardHeight + "px",
        "left": window.innerWidth / 2 - mapOffsetX - boardWidth / 2,
        "top": window.innerHeight - 20 - boardHeight
    });
    $("#board_container").css({
        "width": boardWidth + "px",
        "height": boardHeight + "px",
        "left": mapOffsetX,
        "top": mapOffsetY
    });

    let terminalWidth = window.innerWidth - boardWidth - 100;
    let insideWidth = Math.min(terminalWidth, 450);

    $("#game_terminal").css({
        "width": terminalWidth + "px",
        "height": window.innerHeight - 50 + "px",
        "gap": insideWidth * 0.02 + "px"
    });
    $("#phase_info").css({
        "gap": insideWidth * 0.05 + "px"
    });
    $(".phase").css({
        "width": insideWidth * 0.21 + "px",
        "letter-spacing": insideWidth * 0.007 + "px",
        "padding": insideWidth * 0.03 + "px",
        "font-size": insideWidth * 0.03 + "px"
    });
    $(".game_button").css({
        "width": insideWidth * 0.31 + "px",
        "letter-spacing": insideWidth * 0.01 + "px",
        "font-size": insideWidth * 0.03 + "px"
    });
    $("#turn_n").css({
        "letter-spacing": insideWidth * 0.014 + "px",
        "font-size": insideWidth * 0.06 + "px"
    });
    $(".terminal_tab").css({
        "width": insideWidth * 0.87 + "px",
        "height": window.innerHeight - 420 + "px"
    });
    $(".ter_preview").css({
        "width": insideWidth * 0.214 + "px",
    });
    $("#terminal_tabs").css({
        "height": window.innerHeight - 320 + "px"
    });
}



function updateMapBoundry() {
    leftBoundry = boardWidth / 2 - (boardWidth / 2) * (zoom - 1);
    rightBoundry = boardWidth / 2 + (boardWidth / 2) * (zoom - 1);
    topBoundry = boardHeight / 2 - (boardHeight / 2) * (zoom - 1);
    bottomBoundry = boardHeight / 2 + (boardHeight / 2) * (zoom - 1);

    if (camX < leftBoundry) {
        camX = leftBoundry;
    }
    if (camX > rightBoundry) {
        camX = rightBoundry;
    }
    if (camY < topBoundry) {
        camY = topBoundry;
    }
    if (camY > bottomBoundry) {
        camY = bottomBoundry;
    }
}

function getHexCenterPos(row, column) {
    let x = (hexRadius + (1.5 * column) * hexRadius) * zoom;
    let y = (hexHeight + (2 * row + column % 2) * hexHeight) * zoom;

    return [x, y];
}

function getHexRowCol(x, y) {
    let lx = Math.floor(x / (hexRadius * zoom));
    let ly = Math.floor(y / (hexHeight * zoom));

    let column = Math.floor(lx / 1.5);
    let row = Math.floor(ly / 2 - (column % 2) / 2);

    let thisCenterPos = getHexCenterPos(row, column);
    let isInHex = isPointInsideHexagon(x, y, thisCenterPos[0], thisCenterPos[1], hexRadius * zoom);

    if (!isInHex) {
        let row_diff = y - thisCenterPos[1];
        let col_diff = x - thisCenterPos[0];

        let r1 = row_diff / Math.abs(row_diff);
        if (r1 < 0) {
            row += r1;
        }

        column += col_diff / Math.abs(col_diff);
    }

    return [row, column];
}

function isMouseInBoard() {
    return (pos3 + window.scrollX) >= mapOffsetX && (pos3 + window.scrollX) <= (mapOffsetX + boardWidth) && (pos4 + window.scrollY) >= mapOffsetY && (pos4 + window.scrollY) <= (mapOffsetY + boardHeight);
}

function moveMap() {
    cx = pos3 - mapOffsetX + window.scrollX - camX + boardWidth * zoom / 2;
    cy = pos4 - mapOffsetY + window.scrollY - camY + boardHeight * zoom / 2;

    const deb_hex = document.getElementById("debug_hex_info");
    const board_img = document.getElementById("board");
    const debug_board = document.getElementById("debug_board_container");

    const cell_info_id = document.getElementById("cell_info_id");
    const cell_preview = document.getElementById("cell_preview");

    const cell_detail_terrain = document.getElementById("cell_detail_type");
    const cell_detail_cost = document.getElementById("cell_detail_cost");
    const cell_detail_roads = document.getElementById("cell_detail_roads");
    const cell_detail_highways = document.getElementById("cell_detail_hways");
    const cell_detail_addcost = document.getElementById("cell_detail_addcost");
    const cell_detail_imp = document.getElementById("cell_detail_imp");

    const debug_hex = document.getElementById("debug_hex_dis");
    const debug_uhex = document.getElementById("debug_unithex_dis");
    const cell_dis = document.getElementById("cell_display");

    let row_col = getHexRowCol(cx, cy);
    let board_row = Math.max(0, Math.min(row_col[0], rows - 1));
    let board_col = Math.max(0, Math.min(row_col[1], columns - 1));

    let pos = getHexCenterPos(board_row, board_col);
    let sel_u_pos = !selectedUnitId ? [0,0] : getHexCenterPos(gameState.units[selectedUnitId].row, gameState.units[selectedUnitId].col);
    let sel_pos = getHexCenterPos(selectedRow, selectedColumn);

    debug_hex.style.left = camX - boardWidth * zoom / 2 + sel_pos[0] - hexRadius * zoom + "px";
    debug_hex.style.top = camY - boardHeight * zoom / 2 + sel_pos[1] - hexHeight * zoom + "px";

    debug_uhex.style.left = camX - boardWidth * zoom / 2 + sel_u_pos[0] - hexRadius * zoom + "px";
    debug_uhex.style.top = camY - boardHeight * zoom / 2 + sel_u_pos[1] - hexHeight * zoom + "px";

    cell_dis.style.left = camX - boardWidth * zoom / 2 + pos[0] - hexRadius * zoom + "px";
    cell_dis.style.top = camY - boardHeight * zoom / 2 + pos[1] - hexHeight * zoom + "px";

    deb_hex.innerHTML = padLeft(board_col + 1, 2) + padLeft(board_row, 2)
        + "<br>" + board_row + " " + board_col
        + "<br>" + cx + " " + cy;
    deb_hex.style.left = pos3 + 15 + "px";
    deb_hex.style.top = pos4 + 15 + "px";

    board_img.style.width = boardWidth * zoom + "px";
    board_img.style.height = boardHeight * zoom + "px";
    board_img.style.top = camY - boardHeight * zoom / 2 + "px";
    board_img.style.left = camX - boardWidth * zoom / 2 + "px";

    debug_board.style.top = board_img.style.top;
    debug_board.style.left = board_img.style.left;

    debug_hex.style.width = hexRadius * 2 * zoom + "px";
    debug_hex.style.height = hexHeight * 2 * zoom + "px";

    debug_uhex.style.width = debug_hex.style.width;
    debug_uhex.style.height = debug_uhex.style.height;

    cell_dis.style.width = debug_hex.style.width;
    cell_dis.style.height = debug_uhex.style.height;


    let selUnit = selectedUnitId == null ? (isMouseInBoard() ? unitAt(board_row, board_col) : null) : gameState.units[selectedUnitId];

    if(selUnit == null){
        $("#tab_unit_available").hide();
        $("#tab_unit_notavailable").show();
    }else{
        $("#tab_unit_notavailable").hide();
        $("#tab_unit_available").show();
    }




    let cell_data = board_data.board[board_col][board_row];
    let cell_data_id = padLeft(board_col + 1, 2) + padLeft(board_row, 2);
    let additional_count = 0;
    let impassable_count = 0;

    if (selectedColumn == null || selectedRow == null) {
        $("#debug_hex_dis").hide();
        if(!isMouseInBoard()){
            $("#tab_cell_available").hide();
            $("#tab_cell_notavailable").show();
        }else{
            $("#tab_cell_notavailable").hide();
            $("#tab_cell_available").show();
        }
    } else {
        cell_data = board_data.board[selectedColumn][selectedRow];
        cell_data_id = padLeft(selectedColumn + 1, 2) + padLeft(selectedRow, 2);
        
        $("#debug_hex_dis").show();
    }

    function isBridge(i){
       return (!cell_data.roads.includes(i) && !cell_data.highways.includes(i)) || (gameState.activePlayer == "nazis" && !allowNazisBridge);
    }

    cell_preview.src = `assets/ui/terrain_preview/${terrainTypes[cell_data.terrainType]}.png`;
    cell_info_id.innerHTML = `CELL ID: ${cell_data_id}`;
    
    cell_detail_terrain.innerHTML = `TERRAIN TYPE: <br>${terrainTypes[cell_data.terrainType].toUpperCase()}`;
    cell_detail_cost.innerHTML = `ENTRY COST: <br>[MOT:${terrainCost[terrainTypes[cell_data.terrainType]]['mot']} ; INF:${terrainCost[terrainTypes[cell_data.terrainType]]['inf']}]`;
    
    cell_detail_addcost.innerHTML = `ADDITIONAL <br>[MOT:${edgeCost[edgeInfo[1]]['mot']} ; INF:${edgeCost[edgeInfo[1]]['inf']}] AT: <br>[`;
    for(i = 0; i < cell_data.edges.length; i++){
        if(cell_data.edges[i] == 1){
            if(isBridge(i)){
                additional_count += 1;
            }
        }
    }
    let inserted_cost = 0;
    for(i = 0; i < cell_data.edges.length; i++){
        if(cell_data.edges[i] == 1){
            if(isBridge(i)){
                cell_detail_addcost.innerHTML += edgeNames[i].toUpperCase();
                inserted_cost += 1;

                if(inserted_cost < additional_count)
                    cell_detail_addcost.innerHTML += ", ";
            }
        }
    }
    cell_detail_addcost.innerHTML += "]";

    
    cell_detail_imp.innerHTML = `IMPASSABLE AT: <br>[`;
    for(i = 0; i < cell_data.edges.length; i++){
        if(cell_data.edges[i] == 2){
            if(isBridge(i)){
                impassable_count += 1;
            }
        }
    }
    let impass_insert = 0;
    for(i = 0; i < cell_data.edges.length; i++){
        if(cell_data.edges[i] == 2){
            if(isBridge(i)){
                cell_detail_imp.innerHTML += edgeNames[i].toUpperCase();
                impass_insert += 1;

                if(impass_insert < impassable_count)
                    cell_detail_imp.innerHTML += ", ";
            }
        }
    }
    cell_detail_imp.innerHTML += "]";


    cell_detail_roads.innerHTML = "ROADS AT: <br>[";
    for(i = 0; i < cell_data.roads.length; i++){
            cell_detail_roads.innerHTML += edgeNames[cell_data.roads[i]].toUpperCase();

            if(i < cell_data.roads.length - 1)
                cell_detail_roads.innerHTML += ", ";
    }
    cell_detail_roads.innerHTML += "]";

    cell_detail_highways.innerHTML = "HIGHWAYS AT: <br>[";
    for(i = 0; i < cell_data.highways.length; i++){
            cell_detail_highways.innerHTML += edgeNames[cell_data.highways[i]].toUpperCase();

            if(i < cell_data.highways.length - 1)
                cell_detail_highways.innerHTML += ", ";
    }
    cell_detail_highways.innerHTML += "]";

    if(cell_data.terrainType == 3 || cell_data.hasVillage){
        $("#cell_detail_village").show();
    }else{
        $("#cell_detail_village").hide();
    }

    if(cell_data.roads.length > 0){
        $("#cell_detail_roads").show();
    }else{
        $("#cell_detail_roads").hide();
    }
    if(cell_data.highways.length > 0){
        $("#cell_detail_hways").show();
    }else{
        $("#cell_detail_hways").hide();
    }

    if(additional_count > 0){
        $("#cell_detail_addcost").show();
    }else{
        $("#cell_detail_addcost").hide();
    }

    if(impassable_count > 0){
        $("#cell_detail_imp").show();
    }else{
        $("#cell_detail_imp").hide();
    }

    if (selectedUnitId == null) {
        $("#debug_unithex_dis").hide();
    } else {
        $("#debug_unithex_dis").show();
    }
}

function updateTerminalTabButtons(){
    if(gameState.terminalTab == "cell"){
        $("#tab_cell_b").addClass("selected");
        $("#tab_unit_b").removeClass("selected");
        $("#tab_log_b").removeClass("selected");
        $("#tab_cell").show();
        $("#tab_unit").hide();
        $("#tab_log").hide();
    }
    if(gameState.terminalTab == "unit"){
        $("#tab_cell_b").removeClass("selected");
        $("#tab_unit_b").addClass("selected");
        $("#tab_log_b").removeClass("selected");
        $("#tab_cell").hide();
        $("#tab_unit").show();
        $("#tab_log").hide();
    }
    if(gameState.terminalTab == "log"){
        gameState.unreadLogs = 0;
        $("#tab_cell_b").removeClass("selected");
        $("#tab_unit_b").removeClass("selected");
        $("#tab_log_b").addClass("selected");
        $("#tab_cell").hide();
        $("#tab_unit").hide();
        $("#tab_log").show();
        $("#tab_log_b").removeClass("unread");
        scrollToFirstUnread();
    }
}

function createCellEdgeDetail(x, y, class_name, parent, sprite, edge, r, c) {
    jQuery('<img>', {
        id: sprite + padLeft(c + 1, 2) + padLeft(r, 2) + edge,
        class: class_name,
        src: `assets/map/${sprite}/base.png`,
        css: {
            position: "absolute",
            transform: (edge > 2) ? `rotate(${180 - 60 * (edge - 4)}deg)` : `rotate(${60 * (edge - 1)}deg)`,
            left: x,
            top: y,
            width: hexRadius * 2 + "px",
            height: hexHeight * 2 + "px"
        }
    }).appendTo(parent);
}


function getHexNeighbors(r, c) {
    const even = [[-1, 0], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, -1]];
    const odd = [[-1, 0], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
    const d = (c % 2 === 0) ? even : odd;
    const out = [];
    for (const k of d) {
        const nr = r + k[0], nc = c + k[1];
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.columns) out.push([nr, nc]);
    }
    return out;
}
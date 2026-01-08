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


function setCellInfPar(message) {
    const cell_inf = document.getElementById("cell_info");
    cell_inf.innerHTML = message;
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

    const debug_hex = document.getElementById("debug_hex_dis");
    const cell_dis = document.getElementById("cell_display");

    let row_col = getHexRowCol(cx, cy);
    let board_row = Math.max(0, Math.min(row_col[0], rows - 1));
    let board_col = Math.max(0, Math.min(row_col[1], columns - 1));

    let pos = getHexCenterPos(board_row, board_col);
    let sel_pos = getHexCenterPos(selectedRow, selectedColumn);

    debug_hex.style.left = camX - boardWidth * zoom / 2 + sel_pos[0] - hexRadius * zoom + "px";
    debug_hex.style.top = camY - boardHeight * zoom / 2 + sel_pos[1] - hexHeight * zoom + "px";

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

    debug_board.style.top = camY - boardHeight * zoom / 2 + "px";
    debug_board.style.left = camX - boardWidth * zoom / 2 + "px";

    debug_hex.style.width = hexRadius * 2 * zoom + "px";
    debug_hex.style.height = hexHeight * 2 * zoom + "px";

    cell_dis.style.width = hexRadius * 2 * zoom + "px";
    cell_dis.style.height = hexHeight * 2 * zoom + "px";

    if (selectedColumn == null || selectedRow == null) {
        $("#debug_hex_dis").hide();
    } else {
        $("#debug_hex_dis").show();
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
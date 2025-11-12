var angle = 0;
let debCounter = 0;

const sqrt3 = Math.sqrt(3);

const mapOffsetX = 10;
const mapOffsetY = 10;
const rows = 17;
const collumns = 33;

const factions = ["allies", "nazis", "brits"];
const modes = ["reduced", "standard", "active"];

const hexRadius = 23.085;
const hexHeight = hexRadius * sqrt3 / 2;

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

function getHexCenterPos(row, collumn){
    let x = hexRadius + (1.5*collumn) * hexRadius;
    let y = hexHeight + (2*row + collumn % 2) * hexHeight;

    return [x, y];
}

function getHexRowCol(x, y){
    let lx = Math.floor(x/hexRadius);
    let ly = Math.floor(y/hexHeight);

    let collumn = Math.floor(lx / 1.5);
    let row = Math.floor(ly / 2 - (collumn % 2)/2);

    let thisCenterPos = getHexCenterPos(row, collumn);
    let isInHex = isPointInsideHexagon(x, y, thisCenterPos[0], thisCenterPos[1], hexRadius);

    if(!isInHex){
        let row_diff = y - thisCenterPos[1];
        let col_diff = x - thisCenterPos[0];

        let r1 = row_diff / Math.abs(row_diff);
        if(r1 < 0){
            row += r1;
        }

        collumn += col_diff / Math.abs(col_diff);
    }

    return [row, collumn];
}

function padLeft(nr, n, str){
    return Array(n - String(nr).length + 1).join(str||'0') + nr;
}

// ------------------------------------------------------------ //


function updatemap(){
    const angle = document.getElementById("angle_slider").value;
    const board = document.getElementById("board_container");
    const debug_hex = document.getElementById("debug_hex_dis");

    board.style.width = "1153px";
    board.style.height = "700px";
}

function debugSwitchCellDisplay(){
    const cell_dis = document.getElementById("cell_display");

    cell_dis.src = `assets/cell/${factions[Math.floor(debCounter/3)]}/${factions[Math.floor(debCounter/3)]}_${modes[debCounter % 3]}.png`

    debCounter++;
    
    if(debCounter > 8) debCounter = 0;
}

function debug(event){
    const deb_hex = document.getElementById("debug_hex");

    let cx = event.clientX - mapOffsetX + window.scrollX;
    let cy = event.clientY - mapOffsetY + window.scrollY;

    const debug_hex = document.getElementById("debug_hex_dis");
    const cell_dis = document.getElementById("cell_display");

    let row_col = getHexRowCol(cx, cy);
    let board_row = Math.max(0,Math.min(row_col[0],rows-1));
    let board_col = Math.max(0,Math.min(row_col[1],collumns-1));

    let pos = getHexCenterPos(board_row, board_col);

    debug_hex.style.left = mapOffsetX + pos[0] - hexRadius + "px";
    debug_hex.style.top = mapOffsetY + pos[1] - hexHeight + "px";

    cell_dis.style.left = mapOffsetX + pos[0] - hexRadius + "px";
    cell_dis.style.top = mapOffsetY + pos[1] - hexHeight + "px";

    deb_hex.innerHTML = padLeft(board_col + 1, 2) + padLeft(board_row, 2)
     + "<br>" + board_row + " " + board_col
     + "<br>" + cx + " " + cy;
    deb_hex.style.left = cx + mapOffsetX + "px";
    deb_hex.style.top = cy + mapOffsetY + "px";
}
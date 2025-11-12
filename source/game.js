var angle = 0;

const sqrt3 = Math.sqrt(3);

const mapOffsetX = 10;
const mapOffsetY = 10;
const rows = 17;
const collumns = 33;

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

// ------------------------------------------------------------ //


function updatemap(){
    const angle = document.getElementById("angle_slider").value;
    const board = document.getElementById("board_container");
    const debug_hex = document.getElementById("debug_hex_dis");

    board.style.width = "1153px";
    board.style.height = "700px";
}


function debug(event){
    const deb_hex = document.getElementById("debug_hex");

    let cx = event.clientX - mapOffsetX + window.scrollX;
    let cy = event.clientY - mapOffsetY + window.scrollY;

    const debug_hex = document.getElementById("debug_hex_dis");
    let row_col = getHexRowCol(cx, cy);
    let pos = getHexCenterPos(Math.max(0,Math.min(row_col[0],rows-1)), Math.max(0,Math.min(row_col[1],collumns-1)));

    debug_hex.style.left = mapOffsetX + pos[0] - hexRadius + "px";
    debug_hex.style.top = mapOffsetY + pos[1] - hexHeight + "px";

    deb_hex.innerHTML = ""
     + "<br>" + row_col[0] + " " + row_col[1]
     + "<br>" + cx + " " + cy;
    deb_hex.style.left = cx + mapOffsetX + "px";
    deb_hex.style.top = cy + mapOffsetY + "px";
}
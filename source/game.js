var angle = 0;

const sqrt3 = Math.sqrt(3);

const mapOffsetX = 10;
const mapOffsetY = 10;
const rows = 33;
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

function getHexCenterPos(row, collumn, include_negative_rows){
    let x = hexRadius + (1.5*collumn) * hexRadius;
    let y = hexHeight + (collumn + 2*row) * hexHeight;
    if(!include_negative_rows){
        y = hexHeight + (collumn + 2*(row - (rows - 1)/2)) * hexHeight;
    }

    return [x, y];
}

// ------------------------------------------------------------ //


function updatemap(){
    const angle = document.getElementById("angle_slider").value;
    const board = document.getElementById("board_container");
    const debug_hex = document.getElementById("debug_hex_dis");

    board.style.width = "1153px";
    board.style.height = "700px";

    board.style.transformOrigin = "center bottom";
    board.style.transform = `perspective(1000px) rotateX(${angle}deg)`;
}


function debug(event){
    let cx = event.clientX - mapOffsetX;
    let cy = event.clientY - mapOffsetY;

    const debug_hex = document.getElementById("debug_hex_dis");
    let pos = getHexCenterPos(0, 32, true);

    debug_hex.style.left = mapOffsetX + pos[0] - hexRadius + "px";
    debug_hex.style.top = mapOffsetY + pos[1] - hexHeight + "px";

    console.log(pos[0], pos[1]);

    document.getElementById("debug_hex").innerHTML = isPointInsideHexagon(cx, cy, 22, 19, 22);
}
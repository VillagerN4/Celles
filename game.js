$( document ).ready(function() {

let debCounter = 1;

const sqrt3 = Math.sqrt(3);

const mapOffsetX = 10;
const mapOffsetY = 10;
const rows = 17;
const collumns = 33;

const factions = ["allies", "nazis", "brits"];
const modes = ["reduced", "standard", "active"];

const edgeInfo = ["none", "river", "large river"];
const edgeNames = ["top-left", "top", "top-right", "botom-left", "bottom", "bottom-right"];
const terrainTypes = ["clear", "rough", "woods", "town"];

const hexRadius = 23.085;
const hexHeight = hexRadius * sqrt3 / 2;

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

function debugSwitchCellDisplay(){
    const cell_dis = document.getElementById("cell_display");

    // cell_dis.src = `assets/cell/${factions[Math.floor(debCounter/3)]}/${factions[Math.floor(debCounter/3)]}_${modes[debCounter % 3]}.png`

    debCounter++;
    
    if(debCounter > 8) debCounter = 0;
}

function debug(event){
    const deb_hex = document.getElementById("debug_hex_info");
    const cell_inf = document.getElementById("cell_info");

    let cx = event.clientX - mapOffsetX + window.scrollX;
    let cy = event.clientY - mapOffsetY + window.scrollY;

    const debug_hex = document.getElementById("debug_hex_dis");
    const cell_dis = document.getElementById("cell_display");

    let row_col = getHexRowCol(cx, cy);
    let board_row = Math.max(0,Math.min(row_col[0],rows-1));
    let board_col = Math.max(0,Math.min(row_col[1],collumns-1));

    let pos = getHexCenterPos(board_row, board_col);

    debug_hex.style.left = mapOffsetX + pos[0] - hexRadius - 1 + "px";
    debug_hex.style.top = mapOffsetY + pos[1] - hexHeight + "px";

    cell_dis.style.left = mapOffsetX + pos[0] - hexRadius - 1 + "px";
    cell_dis.style.top = mapOffsetY + pos[1] - hexHeight + "px";

    deb_hex.innerHTML = padLeft(board_col + 1, 2) + padLeft(board_row, 2)
     + "<br>" + board_row + " " + board_col
     + "<br>" + cx + " " + cy;
    deb_hex.style.left = cx + mapOffsetX + "px";
    deb_hex.style.top = cy + mapOffsetY + "px";

    let this_cell_inf = board_data.board[board_col][board_row];
    cell_inf.innerHTML = ""
    + "<br>Terrain type: " + terrainTypes[this_cell_inf.terrainType]
    + "<br>Has village: " + this_cell_inf.hasVillage
    + "<br>Edge info: ";
    for(let i = 0; i < 6; i++) {
        cell_inf.innerHTML += `<br> - ${edgeNames[i]}: ${edgeInfo[this_cell_inf.edges[i]]}`;
    };
}


$(document).mousemove(debug);
$(document).click(debugSwitchCellDisplay);

function createCellEdgeDetail(x, y, class_name, parent, sprite, edge, r, c){
    jQuery('<img>', {
        id: sprite + padLeft(c + 1, 2) + padLeft(r, 2) + edge,
        class: class_name,
        src: `assets/debug/${sprite}/base.png`,
        css: {
            position: "absolute",
            transform: (edge > 2) ? `rotate(${180 - 60*(edge - 4)}deg)` : `rotate(${60*(edge - 1)}deg)`,
            left: x,
            top: y
        }
    }).appendTo(parent);
}


for(let c = 0; c < collumns; c++){
    for(let r = 0; r < rows; r++){
        let cell = board_data.board[c][r];
        let cell_pos = getHexCenterPos(r, c);
        let x = mapOffsetX + cell_pos[0] - hexRadius + "px";
        let y = mapOffsetY + cell_pos[1] - hexHeight + "px";
        
        if(cell.hasVillage){
            jQuery('<img>', {
                id: "village_marker" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_village_display",
                src: "assets/debug/village.png",
                css: {
                    position: "absolute",
                    left: x,
                    top: y
                }
            }).appendTo('#board_container');
        }

        jQuery('<img>', {
            id: padLeft(c + 1, 2) + padLeft(r, 2),
            class: "debug_hex_display",
            src: "assets/debug/terrain/" + cell.terrainType + ".png",
            css: {
                position: "absolute",
                left: x,
                top: y
            }
        }).appendTo('#board_container');

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
                        width: "46px",
                        pointerEvents: "none"
                    }
                }).appendTo('#board_container');
            }
        }

        for(let i = 0; i < 6; i++) {
            if(cell.edges[i] > 0)
                createCellEdgeDetail(x, y, "debug_river_display", "#board_rivers", (cell.edges[i] == 1) ? "river" : "large_river", i, r, c);

        };

        cell.highways.forEach(edge => {
           createCellEdgeDetail(x, y, "debug_highway_display", "#board_highways", "highway", edge, r, c);
        });

        cell.roads.forEach(edge => {
           createCellEdgeDetail(x, y, "debug_road_display", "#board_roads", "road", edge, r, c);
        });

        

        jQuery('<div>', {
            id: "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2),
            class: "debug_cell_label_display",
            css: {
                position: "absolute",
                left: x,
                top: y
            }
        }).appendTo('#board_container');

        jQuery('<p>', {
            id: "label_cell" + padLeft(c + 1, 2) + padLeft(r, 2),
            class: "debug_cell_label_text",
            text: padLeft(c + 1, 2) + padLeft(r, 2)
        }).appendTo('#' + "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2));

        jQuery('<p>', {
            id: "label_cell_inner" + padLeft(c + 1, 2) + padLeft(r, 2),
            class: "debug_cell_label_text_inner",
            text: padLeft(c + 1, 2) + padLeft(r, 2)
        }).appendTo('#' + "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2));
    }
}

});
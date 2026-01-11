function createDebugMap() {
    jQuery('<img>', {
        id: "rivers",
        class: "debug_river_display",
        src: "assets/map/rivers.png",
        css: {
            position: "absolute",
            width: boardWidth * zoom + "px",
            height: boardHeight * zoom + "px"
        }
    }).appendTo('#debug_board_container');

    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
            let cell = board_data.board[c][r];
            let cell_pos = getHexCenterPos(r, c);
            let x = cell_pos[0] - hexRadius * zoom + "px";
            let y = cell_pos[1] - hexHeight * zoom + "px";
            let uncoveredHouses = [0, 0, 0, 0, 0, 0];
            let neighbors = getHexNeighbors(r, c);
            let forests = 0;
            let roughs = 0;

            const c_css = {
                position: "absolute",
                left: x,
                top: y,
                width: hexRadius*2*zoom + "px",
                height: hexHeight*2*zoom + "px"
            };

            const l_css = {
                width: hexRadius*2 + "px",
                'font-size': "8px"
            };

            neighbors.forEach(n => {
                if (board_data.board[n[1]][n[0]].terrainType == 2) forests++;
                if (board_data.board[n[1]][n[0]].terrainType == 1) roughs++;
            });

            if (cell.hasVillage) {
                jQuery('<img>', {
                    id: "village_marker" + padLeft(c + 1, 2) + padLeft(r, 2),
                    class: "debug_village_display",
                    src: "assets/map/village_houses_" + Math.round(Math.random() * 2) + ".png",
                    css: {
                        ...c_css,
                        transform: `rotate(${60 * (-1 + Math.floor(Math.random())*2)}deg)`
                    }
                }).appendTo('#debug_board_container');
            }

            jQuery('<img>', {
                id: padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_hex_display",
                src: "assets/map/terrain/" + cell.terrainType + (cell.terrainType == 0 ? "_" + Math.floor((forests + roughs)/2) : "") + ".png",
                css: c_css
            }).appendTo('#debug_board_container');

            if (cell.terrainType == 2) {
                jQuery('<img>', {
                    id: "trees" + padLeft(c + 1, 2) + padLeft(r, 2),
                    class: "debug_tree_display",
                    src: "assets/map/terrain/2_" + Math.round(Math.random() * 2) + "_" + forests + ".png",
                    css: {
                        ...c_css,
                        filter: `opacity(${forests*3 - Math.random()*5 + 82}%)`
                    }
                }).appendTo('#debug_board_container');
            } else {
                if (cell.terrainType == 1 && forests > 0) {
                    jQuery('<img>', {
                        id: "trees" + padLeft(c + 1, 2) + padLeft(r, 2),
                        class: "debug_tree_display",
                        src: "assets/map/terrain/_" + Math.round(Math.random() * 2) + "_" + Math.floor(forests) + ".png",
                        css: {
                            ...c_css,
                            filter: `opacity(${forests*3 + 66}%)`
                        }
                    }).appendTo('#debug_board_container');
                }
            }

            cell.highways.forEach(edge => {
                createCellEdgeDetail(x, y, "debug_highway_display", "#board_highways", "highway", edge, r, c);
                uncoveredHouses[edge] += 1;
            });

            cell.roads.forEach(edge => {
                createCellEdgeDetail(x, y, "debug_road_display", "#board_roads", "road", edge, r, c);
                uncoveredHouses[edge] += 1;
            });


            for (let i = 0; i < 6; i++) {
                if (uncoveredHouses[i] == 0 && cell.terrainType == 3)
                    jQuery('<img>', {
                        id: "houses" + padLeft(c + 1, 2) + padLeft(r, 2) + i,
                        class: "debug_house_display",
                        src: `assets/map/terrain/3_${i}.png`,
                        css: c_css
                    }).appendTo("#debug_board_container");

            };


            jQuery('<div>', {
                id: "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_cell_label_display",
                css: c_css
            }).appendTo('#debug_board_container');

            jQuery('<p>', {
                id: "label_cell" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_cell_label_text",
                text: padLeft(c + 1, 2) + padLeft(r, 2),
                css: l_css
            }).appendTo('#' + "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2));

            jQuery('<p>', {
                id: "label_cell_inner" + padLeft(c + 1, 2) + padLeft(r, 2),
                class: "debug_cell_label_text_inner",
                text: padLeft(c + 1, 2) + padLeft(r, 2),
                css: l_css
            }).appendTo('#' + "labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2));
        }
    }
}

function updateDebugMap() {
    $("#rivers").css({
        "width": boardWidth * zoom + "px",
        "height": boardHeight * zoom + "px"
    });

    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
            let cell = board_data.board[c][r];
            let cell_pos = getHexCenterPos(r, c);
            let x = cell_pos[0] - hexRadius*zoom + "px";
            let y = cell_pos[1] - hexHeight*zoom  + "px";

            const c_css = {
                "width": hexRadius*2*zoom + "px",
                "height": hexHeight*2*zoom + "px", 
                "left": x,
                "top": y
            };

            const l_css = {
                "width": hexRadius*2*zoom + "px",
                "font-size": 8*Math.sqrt(zoom) + "px"
            };

            $("#village_marker" + padLeft(c + 1, 2) + padLeft(r, 2)).css(c_css);
            $("#" + padLeft(c + 1, 2) + padLeft(r, 2)).css(c_css);
            $("#trees" + padLeft(c + 1, 2) + padLeft(r, 2)).css(c_css);
            for(let i = 0; i < 6; i++) {
                if(cell.terrainType == 3){
                    $("#" + "houses" + padLeft(c + 1, 2) + padLeft(r, 2) + i).css(c_css);
                }
            }

            cell.highways.forEach(edge => {
            $("#" + "highway" + padLeft(c + 1, 2) + padLeft(r, 2) + edge).css(c_css);
            });
            cell.roads.forEach(edge => {
            $("#" + "road" + padLeft(c + 1, 2) + padLeft(r, 2) + edge).css(c_css);
            });
            $("#labeldiv" + padLeft(c + 1, 2) + padLeft(r, 2)).css(c_css);

            $("#label_cell" + padLeft(c + 1, 2) + padLeft(r, 2)).css(l_css);
            $("#label_cell_inner" + padLeft(c + 1, 2) + padLeft(r, 2)).css(l_css);

            updateUnits();
        }
    }
}

function updateUnits(){
    for (let id in gameState.units) {
        const u = gameState.units[id];
        const pos = getHexCenterPos(u.row, u.col);
        const ux = pos[0] - hexRadius * zoom;
        const uy = pos[1] - hexHeight * zoom;

        let rop = Math.abs(u.row_offset);
        let cop = Math.abs(u.col_offset);

        let offsetrow = u.row + Math.ceil(rop * (u.row_offset < 0 ? -1 : 1));
        let offsetcol = u.col + Math.ceil(cop * (u.col_offset < 0 ? -1 : 1));

        const offsetpos = getHexCenterPos(offsetrow, offsetcol);

        const tux = offsetpos[0] - hexRadius * zoom;
        const tuy = offsetpos[1] - hexHeight * zoom;

        const x_diff = (tux - ux);
        const y_diff = (tuy - uy);
        const delta_x = x_diff*u.offsetProgress;
        const delta_y = y_diff*u.offsetProgress;

        const u_css = {
            "width": hexRadius*2*zoom + "px",
            "height": hexHeight*2*zoom + "px", 
            "left": ux + x_diff * Math.round(u.offsetProgress) + "px",
            "top": uy + y_diff * Math.round(u.offsetProgress) + "px"
        };

        const off_u_css = {
            "width": hexRadius*2*zoom + "px",
            "height": hexHeight*2*zoom + "px", 
            "left": ux + delta_x + "px",
            "top": uy + delta_y + "px"
        };

        $("#unit_" + id).css(u_css);
        $("#unit_" + id).attr("src", `assets/cell/${u.faction}/${u.faction}_${u.used ? "active" : (u.disrupted ? "reduced" : "standard")}.png`);
        $("#unit_" + id + "_outline").css(u_css);
        $("#unit_" + id + "_hull").css(off_u_css);
        $("#unit_" + id + "_turret").css(off_u_css);
    }
}

function clearPathVizualizers(){
    gameState.pathVisualizers.forEach(vis => {
        vis.elementIds.forEach(e_id => {
            $("#" + e_id).remove();
        });
    });
}

function createPathVizualizer(path, success, blockade){
    if(path.length > 1){
        gameState.pathVisualizers.push({success, path, elementIds:[]});

        const path_vis_id = gameState.pathVisualizers.length - 1;

        for(i = 0; i < path.length; i++){
            let [r, c] = path[i];
            let cell_pos = getHexCenterPos(r, c);
            let x = cell_pos[0] - hexRadius * zoom + "px";
            let y = cell_pos[1] - hexHeight * zoom + "px";
            let is_last = i+1 == path.length;
            let [nr, nc] = is_last ? [-1,-1] : path[i+1];
            let [pr, pc] = i==0 ? [-1,-1] : path[i-1];
            let arrow_type = success == "guide"? "guide" : (success ? "success" : "fail");

            const a_css = {
                position: "absolute",
                left: x,
                top: y,
                width: hexRadius*2*zoom + "px",
                height: hexHeight*2*zoom + "px"
            };

            if(!is_last){
                let exit_edge = getMovementDirection(r, c, nr, nc);

                jQuery('<img>', {
                    id: `path${path_vis_id}_arrow_${i}_0`,
                    class: "debug_path_visualizer",
                    src: `assets/cell/path/arrow_${arrow_type}.png`,
                    css: {
                        ...a_css,
                        transform: (exit_edge > 2) ? `rotate(${180 - 60 * (exit_edge - 4)}deg)` : `rotate(${60 * (exit_edge - 1)}deg)`
                    }
                }).appendTo('#board_paths');

                if(blockade != null){
                    if(r == blockade[0] && c == blockade[1]){
                        console.log("this is a blockade");
                        jQuery('<img>', {
                            id: `path${path_vis_id}_arrow_${i}_block`,
                            class: "debug_path_visualizer",
                            src: `assets/cell/path/impassable.png`,
                            css: {
                                ...a_css,
                                transform: (exit_edge > 2) ? `rotate(${180 - 60 * (exit_edge - 4)}deg)` : `rotate(${60 * (exit_edge - 1)}deg)`
                            }
                        }).appendTo('#board_paths');

                        gameState.pathVisualizers[path_vis_id].elementIds.push(`path${path_vis_id}_arrow_${i}_block`);
                    }
                }

                gameState.pathVisualizers[path_vis_id].elementIds.push(`path${path_vis_id}_arrow_${i}_0`);
            }

            if(i>0){
                let entry_edge = getMovementDirection(r, c, pr, pc);

                jQuery('<img>', {
                    id: `path${path_vis_id}_arrow_${i}_1`,
                    class: "debug_path_visualizer",
                    src: `assets/cell/path/arrow_${arrow_type}${is_last ? "_end" : ""}.png`,
                    css: {
                        ...a_css,
                        transform: (entry_edge > 2) ? `rotate(${180 - 60 * (entry_edge - 4)}deg)` : `rotate(${60 * (entry_edge - 1)}deg)`
                    }
                }).appendTo('#board_paths');

                gameState.pathVisualizers[path_vis_id].elementIds.push(`path${path_vis_id}_arrow_${i}_1`);
            }
        }

    }
}

function updatePathVizualizers(){
    for(j=0; j<gameState.pathVisualizers.length; j++){
        let vis = gameState.pathVisualizers[j];

        const path = vis.path;
        if(path.length > 1){

            for(i = 0; i < path.length; i++){
                let [r, c] = path[i];
                let cell_pos = getHexCenterPos(r, c);
                let x = cell_pos[0] - hexRadius * zoom + "px";
                let y = cell_pos[1] - hexHeight * zoom + "px";
                let is_last = i+1 == path.length;

                const a_css = {
                    position: "absolute",
                    left: x,
                    top: y,
                    width: hexRadius*2*zoom + "px",
                    height: hexHeight*2*zoom + "px"
                };

                if(!is_last){
                    $(`#path${j}_arrow_${i}_0`).css(a_css);
                    $(`#path${j}_arrow_${i}_block`).css(a_css);
                }

                if(i>0){
                    $(`#path${j}_arrow_${i}_1`).css(a_css);
                }
            }

        };
    }
}

function updateTurnDisplays(){
    $("#turn_nazis_on").attr("src",`assets/ui/turn/turn_nazis_on_${schoolMode}.png`);
    $("#turn_nazis").attr("src",`assets/ui/turn/turn_nazis_off_${schoolMode}.png`);

    $("#turn_nazis_on").css({
        filter: `opacity(${gameState.activePlayer == "nazis" ? 1 : 0})`
    });
    $("#turn_allies_on").css({
        filter: `opacity(${gameState.activePlayer == "nazis" ? 0 : 1})`
    });
}
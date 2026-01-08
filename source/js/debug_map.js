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
                width: hexRadius*2 + "px",
                height: hexHeight*2 + "px"
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

            for (let id in gameState.units) {
                const u = gameState.units[id];
                const pos = getHexCenterPos(u.row, u.col);
                const ux = pos[0] - hexRadius * zoom + "px";
                const uy = pos[1] - hexHeight * zoom + "px";

                const u_css = {
                    "width": hexRadius*2*zoom + "px",
                    "height": hexHeight*2*zoom + "px", 
                    "left": ux,
                    "top": uy
                };

                $("#unit_" + id).css(u_css);
                $("#unit_" + id + "_outline").css(u_css);
                $("#unit_" + id + "_hull").css(u_css);
                $("#unit_" + id + "_turret").css(u_css);
            }
        }
    }
}
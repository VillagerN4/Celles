function drawUnit(id) {
    const u = gameState.units[id];
    const model = u.model;
    const pos = getHexCenterPos(u.row, u.col);
    const x = pos[0] - hexRadius * zoom + "px";
    const y = pos[1] - hexHeight * zoom + "px";

    const u_css = {
        position: "absolute",
        left: x,
        top: y,
        width: hexRadius * 2 * zoom + "px",
        height: hexHeight * 2 * zoom + "px"
    }

    const img1 = $("<img>", {
        id: "unit_" + id,
        class: "unit_display",
        src: `assets/cell/${u.faction}/${u.faction}_standard.png`,
        css: u_css
    });

    const img2 = $("<img>", {
        id: "unit_" + id + "_outline",
        class: "unit_outline_display",
        src: `assets/cell/outline_white.png`,
        css: u_css
    });

    const img3 = $("<img>", {
        id: "unit_" + id + "_hull",
        class: "unit_hull_display",
        src: `assets/unit/${u.faction}/${model}_hull.png`,
        css: u_css
    });

    const img4 = $("<img>", {
        id: "unit_" + id + "_turret",
        class: "unit_turret_display",
        src: `assets/unit/${u.faction}/${model}_turret.png`,
        css: u_css
    });

    $("#debug_board_container").append(img1);
    $("#debug_board_container").append(img2);
    $("#debug_board_container").append(img3);
    $("#debug_board_container").append(img4);
}

function createUnit(id, faction, type, col, row, levels, movement, attack, defense, motorized, model) {
    return {
        id, faction, type, col, row, levels,
        movement, movementLeft: movement, attack, defense,
        motorized: !!motorized, used: false,
        supplyState: 'supplied', disrupted: false,
        model
    };
}

function seedUnitsExample() {
    gameState.units['u_01_01'] = createUnit('u_01_01', 'nazis', 'armor', 0, 0, 2, 9, 7, 5, true, "panzer3");
    gameState.units['u_10_05'] = createUnit('u_10_05', 'allies', 'infantry', 9, 4, 2, 4, 3, 4, false, "sherman");
    gameState.units['u_05_05'] = createUnit('u_05_05', 'brits', 'armor', 14, 8, 2, 4, 3, 4, false, "sherman");
}
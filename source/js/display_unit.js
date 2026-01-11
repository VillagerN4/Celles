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

    const unitC = $("<div>", {
        id: "unit_" + id + "_container"
    });

    const img1 = $("<img>", {
        id: "unit_" + id,
        class: `unit_display ${id}_explodable`,
        src: `assets/cell/${u.faction}/${u.faction}_${u.used ? "active" : (u.disrupted ? "reduced" : "standard")}.png`,
        css: u_css
    });

    const img2 = $("<img>", {
        id: "unit_" + id + "_outline",
        class: `unit_outline_display ${id}_explodable`,
        src: `assets/cell/outline_white.png`,
        css: u_css
    });

    const img3 = $("<img>", {
        id: "unit_" + id + "_hull",
        class: `unit_hull_display ${id}_explodable`,
        src: `assets/unit/${u.faction}/${model}_hull.png`,
        css: {...u_css, transform: `rotate(${edgeToAngle[u.starterAngleEdge]}deg)`}
    });

    const img4 = $("<img>", {
        id: "unit_" + id + "_turret",
        class: `unit_turret_display ${id}_explodable`,
        src: `assets/unit/${u.faction}/${model}_turret.png`,
        css: {...u_css, transform: `rotate(${edgeToAngle[u.starterAngleEdge]}deg)`}
    });

    const moveSound = $("<audio>", {
        id: "unit_" + id + "_moving_sound",
        src: 'assets/audio/unit/tank_move.mp3',
        loop: true
    });

    const shootSound = $("<audio>", {
        id: "unit_" + id + "_shooting_sound",
        src: 'assets/audio/unit/tank_shoot.mp3'
    });

    const debrisSound = $("<audio>", {
        id: "unit_" + id + "_debris_sound",
        src: 'assets/audio/unit/tank_explode_debris.mp3'
    });

    const explodeSound = $("<audio>", {
        id: "unit_" + id + "_exploding_sound",
        src: `assets/audio/unit/tank_explode${1 + Math.floor(Math.random() * 3)}.mp3`
    });

    let contId = "#unit_" + id + "_container";

    $("#board_units").append(unitC);
    $(contId).append(img1);
    $(contId).append(img2);
    $(contId).append(img3);
    $(contId).append(img4);
    $(contId).append(moveSound);
    $(contId).append(shootSound);
    $(contId).append(explodeSound);
    $(contId).append(debrisSound);

    u.setupSounds();
}

function createUnit(id, faction, type, col, row, levels, movement, attack, defense, motorized, model, starterAngleEdge) {
    return {
        id, faction, type, col, row, levels,
        movement, movementLeft: movement, attack, defense,
        motorized: !!motorized, used: false,
        supplyState: 'supplied', disrupted: false,
        model, moveSound: null, shootSound: null, debrisSound: null, explodeSound: null,
        startMoveSound: function(){
            this.moveSound.currentTime = Math.random() * 10;
            this.moveSound.play();
            fadeAudio(this.moveSound, 0, 0.5, 8000);
        },
        stopMoveSound: function(){
            fadeAudio(this.moveSound, 0.5, 0, 8000);
        },
        quickMoveSound: function(){
            let u = this;
            fadeAudio(u.moveSound, 0, 0.5, 4000, function(){fadeAudio(u.moveSound, 0.5, 0, 4000)});
        },
        playShootSound: function(){
            this.shootSound.currentTime = 0;
            this.shootSound.play();
        },
        playExplodeSound: function(){
            this.explodeSound.volume = 1
            this.explodeSound.currentTime = 0;
            this.explodeSound.play();
            this.debrisSound.currentTime = 0;
            this.debrisSound.play();
        },
        setupSounds: function(){
            this.moveSound = document.getElementById("unit_" + id + "_moving_sound");
            this.shootSound = document.getElementById("unit_" + id + "_shooting_sound");
            this.debrisSound = document.getElementById("unit_" + id + "_debris_sound");
            this.explodeSound = document.getElementById("unit_" + id + "_exploding_sound");
        },
        starterAngleEdge, currentRotation: edgeToAngle[starterAngleEdge], col_offset: 0, row_offset: 0,
        offsetProgress: 0
    };
}

function explodeUnit(id){
    if(gameState.animatedUnits[id] == null){
        const u = gameState.units[id];
        if(!u) return false;
        const pos = getHexCenterPos(u.row, u.col);

        let size = 92;

        const x = pos[0] - size/2 * zoom + "px";
        const y = pos[1] - size/2 * zoom + "px";

        gameState.units[id].playExplodeSound();

        $(`.${id}_explodable`).remove();

        
        const img1 = $("<img>", {
            id: "unit_" + id + "_explosion",
            class: `explosion_display`,
            src: `assets/explosion/explosion.gif`,
            css: {
                position: "absolute",
                left: x,
                top: y,
                width: size * zoom + "px",
                height: size * zoom + "px"
            }
        });

        $("#unit_" + id + "_container").append(img1);

        return true;
    }
    return false;
}

function seedUnitsExample() {
    gameState.units['u_01_01'] = createUnit('u_01_01', 'nazis', 'armor', 0, 0, 2, 9, 7, 5, true, "panzer3", 4);
    gameState.units['u_10_05'] = createUnit('u_10_05', 'allies', 'infantry', 9, 4, 2, 4, 3, 4, false, "sherman", 0);
    gameState.units['u_05_05'] = createUnit('u_05_05', 'brits', 'armor', 14, 8, 2, 4, 3, 4, false, "sherman", 2);
}
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

    const turnSound = $("<audio>", {
        id: "unit_" + id + "_turning_sound",
        src: `assets/audio/unit/tank_turret.mp3`
    });

    const hitSound = $("<audio>", {
        id: "unit_" + id + "_hitting_sound",
        src: `assets/audio/unit/hit_success${1 + Math.floor(Math.random() * 2)}.mp3`
    });

    const missSound = $("<audio>", {
        id: "unit_" + id + "_missing_sound",
        src: `assets/audio/unit/hit_fail${1 + Math.floor(Math.random() * 2)}.mp3`
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
    $(contId).append(hitSound);
    $(contId).append(missSound);
    $(contId).append(debrisSound);
    $(contId).append(turnSound);

    u.setupSounds();
}

function createUnit(id, faction, type, col, row, levels, movement, attack, defense, motorized, model, starterAngleEdge) {
    return {
        id, faction, type, col, row, levels,
        movement, movementLeft: movement, attack, defense,
        motorized: !!motorized, used: false,
        supplyState: 'supplied', disrupted: false,
        model, moveSound: null, shootSound: null, debrisSound: null, explodeSound: null, turnSound: null,
        startMoveSound: function(){
            this.moveSound.currentTime = Math.random() * 10;
            this.moveSound.play();
            fadeAudio(this.moveSound, 0, 0.5 * sfxVolume, 8000 * unitSpeedModifier);
        },
        stopMoveSound: function(){
            fadeAudio(this.moveSound, 0.5 * sfxVolume, 0, 8000 * unitSpeedModifier);
        },
        quickMoveSound: function(){
            let u = this;
            fadeAudio(u.moveSound, 0, 0.5 * sfxVolume, 4000 * unitSpeedModifier, function(){fadeAudio(u.moveSound, 0.5 * sfxVolume, 0, 4000 * unitSpeedModifier)});
        },
        playShootSound: function(){
            this.shootSound.volume = sfxVolume;
            this.shootSound.currentTime = 0;
            this.shootSound.play();
        },
        playTurnSound: function(){
            let u = this;
            u.turnSound.volume = 0;
            u.turnSound.currentTime = 0;
            u.turnSound.play();
            fadeAudio(u.turnSound, 0, sfxVolume, 4000 * unitSpeedModifier, function(){fadeAudio(u.turnSound, sfxVolume, 0, 4000 * unitSpeedModifier)});
        },
        playExplodeSound: function(){
            this.explodeSound.volume = sfxVolume;
            this.debrisSound.volume = sfxVolume;
            this.explodeSound.currentTime = 0;
            this.explodeSound.play();
            this.debrisSound.currentTime = 0;
            this.debrisSound.play();
        },
        playHitSound: function(success){
            if(success){
                this.hitSound.volume = sfxVolume;
                this.hitSound.currentTime = 0;
                this.hitSound.play();
            }else{
                this.missSound.volume = sfxVolume;
                this.missSound.currentTime = 0;
                this.missSound.play();
            }
        },
        setupSounds: function(){
            this.moveSound = document.getElementById("unit_" + id + "_moving_sound");
            this.shootSound = document.getElementById("unit_" + id + "_shooting_sound");
            this.debrisSound = document.getElementById("unit_" + id + "_debris_sound");
            this.explodeSound = document.getElementById("unit_" + id + "_exploding_sound");
            this.hitSound = document.getElementById("unit_" + id + "_hitting_sound");
            this.missSound = document.getElementById("unit_" + id + "_missing_sound");
            this.turnSound = document.getElementById("unit_" + id + "_turning_sound");
        },
        starterAngleEdge, currentRotation: edgeToAngle[starterAngleEdge], currentTurretRotation: edgeToAngle[starterAngleEdge], col_offset: 0, row_offset: 0,
        offsetProgress: 0
    };
}

function explodeUnit(id) {
    if (gameState.animatedUnits[id] != null) return false;

    const u = gameState.units[id];
    if (!u) return false;

    const pos = getHexCenterPos(u.row, u.col);

    const size = 92;
    const frameCount = 64;
    const duration = 1400;

    const x = pos[0] - (size / 2) * zoom + "px";
    const y = pos[1] - (size / 2) * zoom + "px";

    u.playExplodeSound();

    $(`.${id}_explodable`).remove();

    const $img = $("<img>", {
        id: "unit_" + id + "_explosion",
        class: "explosion_display",
        src: "assets/explosion/big_frames/explosion (1).png",
        css: {
            position: "absolute",
            left: x,
            top: y,
            width: size * zoom + "px",
            height: size * zoom + "px",
            transform: `rotate(${Math.random() * 360}deg)`
        }
    });

    $("#unit_" + id + "_container").append($img);

    const start = performance.now();

    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const frame = Math.floor(t * frameCount) + 1;

        if (frame <= frameCount) {
            $img.attr(
                "src",
                `assets/explosion/big_frames/explosion (${Math.min(Math.max(frame,1), frameCount)}).png`
            );
            requestAnimationFrame(step);
            if (t > 0.8) {
                $img.css("opacity", (1 - t) / 0.2);
            }
        } else {
            $img.remove();
        }
    }

    requestAnimationFrame(step);
    return true;
}

function explodeAtUnit(id, success, fromDir) {
    if (gameState.animatedUnits[id] != null) return false;

    const u = gameState.units[id];
    if (!u) return false;

    const pos = getHexCenterPos(u.row, u.col);

    const size = 15 * (success ? 1.2 : 1.1);
    const frameCount = 16;
    const duration = 800;

    const x = pos[0] - (size / 2) * zoom + "px";
    const y = pos[1] - (size / 2) * zoom + "px";

    u.playHitSound(success);

    const $img = $("<img>", {
        id: "unit_" + id + "_hitexplosion",
        class: "hit_explosion_display",
        src: "assets/explosion/hit_frames/explosion (1).png",
        css: {
            position: "absolute",
            left: x,
            top: y,
            width: size * zoom + "px",
            height: size * zoom + "px",
            transform: `rotate(${fromDir}deg)  translateY(${(hexHeight/4) * zoom}px)`
        }
    });

    $("#unit_" + id + "_container").append($img);

    const start = performance.now();

    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const frame = Math.floor(t * frameCount) + 1;

        if (frame <= frameCount) {
            $img.attr(
                "src",
                `assets/explosion/hit_frames/explosion (${Math.min(Math.max(frame,1), frameCount)}).png`
            );
            requestAnimationFrame(step);
            if (t > 0.8) {
                $img.css("opacity", (1 - t) / 0.2);
            }
        } else {
            $img.remove();
        }
    }

    requestAnimationFrame(step);
    return true;
}

function shootShell(id, recoil) {
    if (gameState.animatedUnits[id] != null) return false;

    const u = gameState.units[id];
    if (!u) return false;

    const pos = getHexCenterPos(u.row, u.col);

    const size = 15;
    const frameCount = 44;
    const duration = 700;

    const x = pos[0] - (size / 2) * zoom + "px";
    const y = pos[1] - (size / 2) * zoom + "px";

    const $img = $("<img>", {
        id: "unit_" + id + "_shootexplosion",
        class: "shoot_explosion_display",
        src: "assets/explosion/shoot_frames/explosion (1).png",
        css: {
            position: "absolute",
            left: x,
            top: y,
            width: size * zoom + "px",
            height: size * zoom + "px",
            transform: `rotate(${u.currentTurretRotation}deg) translateY(${recoil - (hexHeight/1.5 + size/2) * zoom}px)`
        }
    });

    $("#unit_" + id + "_container").append($img);

    const start = performance.now();

    function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const frame = Math.floor(t * frameCount) + 1;

        if (frame <= frameCount) {
            $img.attr(
                "src",
                `assets/explosion/shoot_frames/explosion (${Math.min(Math.max(frame,1), frameCount)}).png`
            );
            requestAnimationFrame(step);
            if (t > 0.8) {
                $img.css("opacity", (1 - t) / 0.2);
            }
        } else {
            $img.remove();
        }
    }

    requestAnimationFrame(step);
    return true;
}

function seedUnitsExample() {
    gameState.units['u_01_01'] = createUnit('u_01_01', 'nazis', 'armor', 0, 0, 2, 9, 7, 5, true, "panzer3", 4);
    gameState.units['u_10_05'] = createUnit('u_10_05', 'allies', 'infantry', 9, 4, 2, 4, 3, 4, false, "sherman", 0);
    gameState.units['u_05_05'] = createUnit('u_05_05', 'brits', 'armor', 14, 8, 2, 4, 3, 4, false, "sherman", 2);
    gameState.units['u_05_06'] = createUnit('u_05_06', 'allies', 'armor', 0, 1, 2, 4, 3, 4, false, "sherman", 2);
    gameState.units['u_06_06'] = createUnit('u_06_06', 'allies', 'armor', 1, 1, 2, 4, 3, 4, false, "sherman", 2);
    gameState.units['u_01_02'] = createUnit('u_01_02', 'nazis', 'armor', 1, 0, 2, 9, 7, 5, true, "panzer3", 4);
}
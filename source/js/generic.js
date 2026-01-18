const sqrt3 = Math.sqrt(3);



function padLeft(nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

function radToDeg(rad) {
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

function rollD10() {
    return Math.floor(Math.random() * 10);
}

function clampDie(v) {
    if (v < 0) return 0;
    if (v > 9) return 9;
    return v;
}

function drawActionToken(f) {
    const c = Object.values(gameState.units).filter(u => u.faction === f);
    if (!c.length) return null;
    return c[Math.floor(Math.random() * c.length)].id;
}

function fadeAudio(audio, startVolume, endVolume, duration, callback) {
    const steps = 30;
    const stepTime = duration / steps;
    const volumeStep = (endVolume - startVolume) / steps;

    let currentStep = 0;
    audio.volume = startVolume;

    let fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = startVolume + volumeStep * currentStep;

        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            if (endVolume === 0) audio.pause();
            if (callback) callback();
        }
    }, stepTime);
}

function applyMenuParallax(event) {

    const speed = [
        0,
        3,
        10,
        20,
        30,
        40
    ];

    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;

    let offsetX = (event.clientX - centerX) / centerX;
    let offsetY = (event.clientY - centerY) / centerY;

    $(".panorama").each(function (index) {
        let moveX = offsetX * speed[index];
        let moveY = offsetY * speed[index];

        $(this).css({
            top: `${moveY}px`,
            left: `${centerX - $(this).width() / 2 + moveX}px`
        });
    });
}

function blurMenu() {
    $(".panorama").each(function () {
        $(this).css({
            filter: `blur(${gameState.page == "menu" ? 0 : panBlurAmount}px) brightness(${gameState.page == "menu" ? 100 : 150}%)`
        });
    });
}

function getElementRotation(element){
    var el = document.getElementById(element);
    var st = window.getComputedStyle(el, null);
    var tr = st.getPropertyValue("transform") || "FAIL";

    var values = tr.split('(')[1].split(')')[0].split(',');
    var a = values[0];
    var b = values[1];

    var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
    return angle;
}

function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
}

function shortestRotation(currentAngle, edge) {
    const target = normalizeAngle(edgeToAngle[edge]);
    const current = normalizeAngle(currentAngle);

    let delta = target - current;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    return delta;
}

function tweenOffsetProgress(u, duration, fade = "mid") {
    return new Promise(resolve => {
        const start = performance.now();
        const ease = easing[fade] || easing.mid;
        
        function step(now) {
            const t = Math.min((now - start) / duration, 1);
            u.offsetProgress = ease(t);
            updateUnits();

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                u.offsetProgress = 1;
                resolve();
            }
        }

        requestAnimationFrame(step);
    });
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}
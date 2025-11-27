const sqrt3 = Math.sqrt(3);



function padLeft(nr, n, str){
    return Array(n - String(nr).length + 1).join(str||'0') + nr;
}

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

function rollD10(){ 
    return Math.floor(Math.random()*10); 
}

function clampDie(v){ 
    if (v<0) return 0; 
    if (v>9) return 9; 
    return v; 
}

function drawActionToken(f) {
  const c = Object.values(gameState.units).filter(u => u.faction === f);
  if (!c.length) return null;
  return c[Math.floor(Math.random()*c.length)].id;
}
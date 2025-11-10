var angle = 0;

function degToRad(deg){
    return deg * Math.PI / 180;
}

function radToDeg(rad){
    return (rad / Math.PI) * 180;
}

function updatemap(){
    angle = document.getElementById("angle_slider").value;
    document.getElementById("board").style.height = Math.cos(degToRad(angle)) * 700 + "px";
    document.getElementById("board").style.width = "1236px";

    document.getElementById("board").style.top = 10 + (1 - Math.cos(degToRad(angle))) * 350  + "px";
}
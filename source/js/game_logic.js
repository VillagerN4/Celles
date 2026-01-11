$(document).ready(function () {

  const menuMusic = document.getElementById("menu_music");
  const gameMusic = document.getElementById("game_music");
  const mHover = document.getElementById("m_hover");
  const mClick = document.getElementById("m_click");
  const mClickRelease = document.getElementById("m_click_rel");
  const container = document.getElementById("board_container");
  container.style.width = boardWidth + "px";
  container.style.height = boardHeight + "px";
  container.style.top = mapOffsetY + "px";
  container.style.left = mapOffsetX + "px";



  $("#debug_hex_dis").hide();
  $("#debug_unithex_dis").hide();
  $("#debug_hex_info").hide();
  $("#cell_display").hide();


  $(document).mousemove(handleMouseMovement);
  $(document).mousedown(function (event) { mouseDown = true && event.which == 2; });
  $(document).mouseup(function () { mouseDown = false; });
  $(document).mousedown(handleClick);
  $(document).keyup(handleKeyboardInput);
  $(document).on("contextmenu", function (event) {
    event.preventDefault();
  });

  $(document).one("click", function () {
    pageAnimating = true;
    menuMusic.play();
    menuMusic.volume = musicVolume;
    mHover.currentTime = 0;
    mHover.play();

    musicStarted = true;

    $("body").css("background-color", "white");
    $("#tap_anywhere").fadeOut(!debugMode ? 500 : 1);

    $("#title_holder").fadeIn(!debugMode ? 3500 : 1, function () {
      $("#menu_buttons").addClass("slide");
      pageAnimating = false;
    });

    $("#page_menu").show();
    $("#menu_panorama").fadeIn(!debugMode ? 500 : 1);
  });

  $("#begin").click(function (event) {
    if (!pageAnimating) {

      pageAnimating = true;
      gameState.page = "game";

      gameMusic.volume = 0;

      fadeAudio(menuMusic, menuMusic.volume, 0, 1500, function(){
        gameMusic.play();
        gameMusic.volume = 1;
        updateDebugMap();
        updateMapBoundry();
        moveMap();
        $("body").css("background-color", "#191822");
      });

      $("#menu_panorama").fadeOut(pageFadeTime);
      $("#page_menu").fadeOut(pageFadeTime, function () { $("#page_game").fadeIn(pageFadeTime, function () { pageAnimating = false }) });

      seedUnitsExample();
      updateDisplayParams();
      createDebugMap();
      moveMap();
      for (let id in gameState.units) {
        drawUnit(id);
      }
      startTurnWithQueue("nazis");

      blurMenu();
    }
  });

  $("#controls").click(function (event) {
    if (!pageAnimating) {

      pageAnimating = true;
      gameState.page = "controls";

      $("#page_menu").fadeOut(pageFadeTime, function () { $("#page_controls").fadeIn(pageFadeTime, function () { pageAnimating = false }) });

      blurMenu();
    }
  });

  $("#quit").click(function (event) {
    if (!pageAnimating) {
      window.open(' ', '_self');
      window.close();
    }
  });

  $("#config").click(function (event) {
    if (!pageAnimating) {

      pageAnimating = true;
      gameState.page = "config";

      updateDisplayParams();

      $("#page_menu").fadeOut(pageFadeTime, function () { $("#page_displayconfig").fadeIn(pageFadeTime, function () { pageAnimating = false }) });

      blurMenu();
    }
  });

  $(".to_menu").click(function (event) {
    if (!pageAnimating) {

      pageAnimating = true;

      $(gameState.page == "config" ? "#page_displayconfig" : "#page_controls").fadeOut(pageFadeTime, function () { $("#page_menu").fadeIn(pageFadeTime, function () { pageAnimating = false }) });

      gameState.page = "menu";

      blurMenu();
    }
  });

  $(".to_options").click(function (event) {
    if (!pageAnimating) {

      pageAnimating = true;

      $("#preview").fadeOut(pageFadeTime, function () { $("#settings_p").fadeIn(pageFadeTime, function () { pageAnimating = false }) });
    }
  });

  $("#to_preview").click(function (event) {
    if (!pageAnimating) {

      pageAnimating = true;

      $("#settings_p").fadeOut(pageFadeTime, function () { $("#preview").fadeIn(pageFadeTime, function () { pageAnimating = false }) });

    }
  });

  $("#tab_cell_b").click(function (event) {
    if(gameState.terminalTab == 'log')
        $(".log_entry.unread").removeClass("unread");
    gameState.terminalTab = 'cell';
    updateTerminalTabButtons();
  });

  $("#tab_unit_b").click(function (event) {
    if(gameState.terminalTab == 'log')
        $(".log_entry.unread").removeClass("unread");
    gameState.terminalTab = 'unit';
    updateTerminalTabButtons();
  });

  $("#tab_log_b").click(function (event) {
    gameState.terminalTab = 'log';
    updateTerminalTabButtons();
  });

  $(".button").mouseover(function (event) {
    if (!pageAnimating && !($(this).hasClass("selected"))) {
      mHover.currentTime = 0;
      mHover.play();
    }
  });

  $(".button").mousedown(function (event) {
    if (!pageAnimating && event.which == 1 && !($(this).hasClass("selected"))) {
      mClick.currentTime = 0;
      mClick.play();
    }
  });

  $(".button").mouseup(function (event) {
    if (!pageAnimating && event.which == 1 && !($(this).hasClass("selected"))) {
      mClickRelease.currentTime = 0;
      mClickRelease.play();
    }
  });

  $("#activate_unit").click(function (event){
    if (gameState.phase !== 'movement') {
        sendLog("You can only activate units during the MOVEMENT phase.");
    }else if (selectedUnitId && gameState.animatedUnits[selectedUnitId] == null) {
        const res = activateUnit(selectedUnitId);
        if (typeof updateDebugMap === 'function') updateDebugMap();
        sendLog(`Activated unit: ${selectedUnitId}.`);
    }
  });

  $("#move_unit").click(function (event){
    if (gameState.phase !== 'movement') {
        sendLog("You can only move units during the MOVEMENT phase.");
    }else  if (selectedUnitId!=null && selectedColumn!=null && selectedRow!=null && gameState.animatedUnits[selectedUnitId] == null && !isCellPartOfPath(selectedRow, selectedColumn)) {
        clearPathVizualizers();
        const u = gameState.units[selectedUnitId];
        if (!u || (u.faction == "nazis" && u.faction != gameState.activePlayer) || (u.faction != "nazis" && "nazis" == gameState.activePlayer)) return;

        const targetRow = selectedRow;
        const targetCol = selectedColumn;

        sendLog(`Began movement for unit: ${selectedUnitId} to cell: ${padLeft(targetCol + 1, 2) + padLeft(targetRow, 2)}.`);

        const res = moveUnitToTarget(selectedUnitId, targetRow, targetCol);
        if (typeof updateDebugMap === 'function') updateDebugMap();
        if (typeof moveMap === 'function') moveMap();
    }else{
      if(selectedColumn==null && selectedRow==null){
        sendLog("Cannot start movement. Select a destination.");
      }
      if(gameState.animatedUnits[selectedUnitId] != null){
        sendLog("Cannot start movement. Unit is already moving.");
      }
      if(isCellPartOfPath(selectedRow, selectedColumn)){
        sendLog("Cannot start movement. Selected cell is a part of another unit's path.");
      }
    }
  });

  $("#combat_unit").click(function (event){
    if (gameState.phase !== 'combat') {
        sendLog("You can only engage in combat during the COMBAT phase.");
    }else{
      startCombat(selectedUnitId);
      
      sendLog(`Selected attacker: ${selectedUnitId}. Now click enemy units.`);
    }
  });

  $("#proceed_b").click(function (event){
    let animatedU = 0;
    for (const [unit, path] of Object.entries(gameState.animatedUnits)) {
      if(path != null) animatedU++;
    }
    if (animatedU == 0) {
      clearLogs();
      selectedUnitId = null;
      selectedRow = null;
      selectedColumn = null;
      clearPathVizualizers();
      $("#ph_" + gameState.phase).removeClass("phase_active");
      const res = endPhase();
      $("#ph_" + gameState.phase).addClass("phase_active");
      $("#turn_n").text("TURN: " + gameState.turn);
      sendLog(`The ${gameState.activePlayer.toUpperCase()} are beginning their ${gameState.phase.toUpperCase()} phase.`);

      if (typeof updateDebugMap === 'function') updateDebugMap();
      if (typeof moveMap === 'function') moveMap();
      updateTurnDisplays();

      // $("body").css({ "background-color": gameState.activePlayer == "nazis" ? "#a6acbdff" : "#77ab79ff" });
    }else{
      sendLog(`Cannot proceed to next phase during unit movement.`);
    }
  });

  $("#board_size").mousemove(function () {
    sizeFactor = $(this).val();

    updateDisplayParams();
  });

  $("#school_mode").click(function () {
    schoolMode = $(this).is(':checked');
    updateTurnDisplays();
  });

  $("#nazis_bridge").click(function () {
    allowNazisBridge = $(this).is(':checked');
  });

  $("#blur_amount").mousemove(function () {
    panBlurAmount = $(this).val();

    blurMenu();
  });

  $("#movement_mult").mousemove(function () {
    movementMultiplier = $(this).val();
  });


  $("#music_volume").mousemove(function () {
    musicVolume = $(this).val();
    menuMusic.volume = musicVolume;
  });

  $("#page_game").hide();
  $("#page_controls").hide();
  $("#page_displayconfig").hide();
  $("#page_menu").hide();
  $("#title_holder").hide();
  $("#preview").hide();
  $("#menu_panorama").hide();
  $("#cover").hide();
  $("#cost_info").hide();
  $("#cell_info").hide();
  $("#debug_hex_info").hide();
  updateTerminalTabButtons();
  updateTurnDisplays();
  $("#turn_n").text("TURN: " + gameState.turn);
  $("#ph_" + gameState.phase).addClass("phase_active");
});
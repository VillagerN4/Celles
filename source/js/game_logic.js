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

    fadeAudio(menuMusic, menuMusic.volume, 0, 2000, function(){
      gameMusic.play();
      gameMusic.volume = 1;
      $("body").css("background-color", "black");
    });

      $("#menu_panorama").fadeOut(pageFadeTime);
      $("#page_menu").fadeOut(pageFadeTime, function () { $("#page_game").fadeIn(pageFadeTime, function () { pageAnimating = false }) });

      seedUnitsExample();
      updateDisplayParams();
      createDebugMap();
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

  $(".button").mouseover(function (event) {
    if (!pageAnimating) {
      mHover.currentTime = 0;
      mHover.play();
    }
  });

  $(".button").mousedown(function (event) {
    if (!pageAnimating && event.which == 1) {
      mClick.currentTime = 0;
      mClick.play();
    }
  });

  $(".button").mouseup(function (event) {
    if (!pageAnimating && event.which == 1) {
      mClickRelease.currentTime = 0;
      mClickRelease.play();
    }
  });

  $("#board_size").mousemove(function () {
    sizeFactor = $(this).val();

    updateDisplayParams();
  });

  $("#blur_amount").mousemove(function () {
    panBlurAmount = $(this).val();

    blurMenu();
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
  console.log("#ph_" + gameState.phase)
  $("#turn_n").text("TURN: " + gameState.turn);
  $("#ph_" + gameState.phase).addClass("phase_active");
});
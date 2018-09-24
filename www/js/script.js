/** 
 * @author Nathan Abramyk 
 * @version 1.0.0 
 */

/** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
var grid_size = 20;

/** @global {int} grid_count_width */
var grid_count_width = 0;
var grid_count_height = 0;
var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,153,0,1)';
var grid_line_width = 0.5;
var grid_id = 0;
var ping_period = 4000;

/** @global {int} selected_grid_x - x coordinate of the selected cursor position */
var selected_grid_x = -1;

/** @global {int} selected_grid_y - y coordinate of the selected cursor position */
var selected_grid_y = -1;

var selected_element;

/** @global {int} cursor_size - the span of grid spaces the cursor overlays */
var cursor_size = 1;
var cursor_line_width = 1;

var ping_counter = 0;

var holdTimer, hoverTimer, movementTimer;
var movementInterval = 100;
var prehandledByTouchEvent = false;

var local_stored_grid_space = [];
var local_stored_annotations = [];
var local_stored_pings = [];

var grid_spaces_list = [];
var x_vertices = [];
var y_vertices = [];

var grid_canvas,
  ctx,
  underlay_canvas,
  ctx2,
  overlay_canvas,
  overlay_ctx,
  temporary_drawing_canvas,
  temporary_drawing_ctx;

var mouse_down = false;
var touch_start = false;

var copied_element = null;

var socket;

window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
  canvasApp();
}

function canvasSupport(e) {
  return !!e.getContext;
}

function canvasApp() {

  interfaceInitialization();

  if (!canvasSupport(grid_canvas)) {
    return;
  }

  socket = io();
  bindSocketListeners();
  bindEventHandlers();
}

function bindSocketListeners() {

  socket.on('connect', function(msg) {
    $("#lost_connection_div").hide();

    socket.emit('init', {}, function(msg) {
      grid_count_height = msg.grid_height;
      resizeGridHeight(grid_count_height);
      grid_count_width = msg.grid_width;
      resizeGridWidth(grid_count_width);

      clear_prev_cursor_position();
      selected_grid_x = -1;
      selected_grid_y = -1;

      $("#element_list").empty();
      refresh_elements_list();

      $(".tab").remove();
      grid_id = msg.spaces[0].id;
      $("#grid_name").val(msg.spaces[0].name);

      msg.spaces.forEach(function(el) {
        $("<div class=\"tab\"><button class=\"grid-name\" value=\"" + el.id + "\">" + el.name + "</button><button class=\"grid-space-delete\" value=\"" + el.id + "\">&times</button></div>").insertBefore("#addition_tab");
      });

      $(".tab").first().addClass("active");

      if (msg.elements.length !== 0) {
        local_stored_grid_space = msg.elements;
        $("#reset_board_button").prop("disabled", false);
        drawElements();
      } else {
        local_stored_grid_space = [];
      }

      local_stored_annotations = msg.annotations;
      showAnnotations();
      refresh_annotations_list();

      refresh_elements_list();

      $("#options_add_or_edit_button").hide();
      $("#options_annotate_button").hide();
      $("#options_delete_button").hide();
      $("#options_copy_button").hide();
      $("#options_paste_button").hide();
      $("#options_movement_button").hide();
    });

  });

  socket.on('disconnect', function() {
    $("#lost_connection_div").show();
    $("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
  });

  socket.on('resize_height', function(msg) {
    if (grid_id != msg.grid_id) return;
    grid_count_height = msg.height;
    resizeGridHeight(grid_count_height);
    local_stored_grid_space = msg.elements;
    drawElements();
  });

  socket.on('resize_width', function(msg) {
    if (grid_id != msg.grid_id) return;
    grid_count_width = msg.width;
    resizeGridWidth(grid_count_width);
    local_stored_grid_space = msg.elements;
    drawElements();
  });

  socket.on('added_element', function(msg) {
    if (msg.grid_id != grid_id) return;
    if (msg.element.category == "ping") {
      drawPing(msg.element, msg.grid_id);
      return;
    }
    $("#reset_board_button").prop("disabled", false);
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space.push(msg.element);
    drawElements();
    refresh_elements_list();
  });

  socket.on('added_elements', function(msg) {
    if (msg.grid_id != grid_id) return;
    $("#reset_board_button").prop("disabled", false);
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space = local_stored_grid_space.concat(msg.element);
    drawElements();
    refresh_elements_list();
  });

  socket.on('removed_element', function(msg) {
    if (msg.grid_id != grid_id) return;
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space.splice(local_stored_grid_space.findIndex(function(el) {
      return el.id == msg.element_id
    }), 1);
    drawElements();
    $("#reset_board_button").prop("disabled", msg.gridSpaceEmpty);
    refresh_elements_list();
  });

  socket.on('move_element', function(msg) {
    if (msg.grid_id != grid_id) return;
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space[local_stored_grid_space.indexOf(
      local_stored_grid_space.find(
        function(el) {
          return msg.element.id == el.id
        }
      )
    )] = msg.element;
    drawElements();
    $("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
  });

  socket.on('edited_element', function(msg) {
    console.log(msg);
    if (msg.grid_id != grid_id) return;
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space[local_stored_grid_space.indexOf(
      local_stored_grid_space.find(
        function(el) {
          return msg.element.id == el.id
        }
      )
    )] = msg.element;
    drawElements();
    $("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
  });

  socket.on('new_grid_space', function(msg) {
    $("<div class=\"tab\"><button class=\"grid-name\" value=\"" + msg.id + "\">" + msg.name + "</button><button class=\"grid-space-delete\" value=\"" + msg.id + "\">&times</button></div>").insertBefore("#addition_tab");
  });

  socket.on('reset_grid', function(msg) {
    if (grid_id != msg.grid_id) return;
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space = [];
  });

  socket.on('delete_grid_space', function(msg) {
    $("button[class=\"grid-space-delete\"][value=\"" + msg.grid_id + "\"]").parent().remove();
    if (msg.grid_id == grid_id) {
      alert("Well, someone decided that you don't need to be here anymore.");
      ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
      socket.emit('init', {});
    }
  });

  socket.on('renaming_grid', function(msg) {
    $("button[class=\"grid-name\"][value=\"" + msg.grid_id + "\"]").text(msg.grid_name);
  });

  socket.on('added_annotation', function(msg) {
    if (grid_id != msg.grid_id) return;
    local_stored_annotations.push(msg.annotation);
    hideAnnotations();
    showAnnotations();
    refresh_annotations_list();
  });

  socket.on('deleted_annotation', function(msg) {
    if (grid_id != msg.grid_id) return;
    local_stored_annotations.splice(local_stored_annotations.findIndex(function(el) {
      return el.id == msg.annotation_id
    }), 1);
    refresh_annotations_list();
  });

  socket.on('error_channel', function(msg) {
    alert(msg.message);
  });
}

/**
 * 
 * @returns
 */
function bindEventHandlers() {
  $("#grid_canvas_scrolling_container").scroll(function() {
    $("#ruler_top_scrolling_container").scrollLeft($("#grid_canvas_scrolling_container").scrollLeft());
    $("#ruler_left_scrolling_container").scrollTop($("#grid_canvas_scrolling_container").scrollTop());
  });

  $("#grid_size_vertical").val(grid_count_height);
  $("#grid_size_horizontal").val(grid_count_width);

  $("#grid_size_vertical").change(function() {
    grid_count_height = $("#grid_size_vertical").val();
    socket.emit('resize_height', {
      "grid_id": grid_id,
      "height": grid_count_height
    });
  });

  $("#grid_size_horizontal").change(function() {
    grid_count_width = $("#grid_size_horizontal").val();
    socket.emit('resize_width', {
      "grid_id": grid_id,
      "width": grid_count_width
    });
  });

  $("#grid_name").change(function() {
    socket.emit('rename_grid', {
      "grid_id": grid_id,
      "grid_name": $("#grid_name").val()
    });
  });

  $("#overlay_canvas")
    .mousedown(function(evt) {
      canvasClicked(evt.offsetX, evt.offsetY);
    })
    .mousemove(function(evt) {
      clearPlayerName();
      clearTimeout(hoverTimer);
      local_stored_grid_space.forEach(function(el) {
        if (gridPoint2Pixel(el.x) < evt.offsetX && gridPoint2Pixel(el.x + el.size) > evt.offsetX &&
          gridPoint2Pixel(el.y) < evt.offsetY && gridPoint2Pixel(el.y + el.size) > evt.offsetY) {
          if (prehandledByTouchEvent) {
            prehandledByTouchEvent = false;
            return;
          }
          showPlayerName(evt.offsetX + $("#overlay_canvas").offset().left, evt.offsetY + $("#overlay_canvas").offset().top - 40, el.name);
        }
      });
    })
    .mouseleave(function(evt) {
      clearPlayerName();
      clearTimeout(hoverTimer);
    })
    .contextmenu(function(evt) {
      if (selected_grid_x == -1 && selected_grid_y == -1) return;
      clearPlayerName();
      evt.preventDefault();
      var temp = local_stored_grid_space.find(function(el) {
        return gridPoint2Pixel(el.x) < evt.offsetX && gridPoint2Pixel(el.x + el.size) > evt.offsetX && gridPoint2Pixel(el.y) < evt.offsetY && gridPoint2Pixel(el.y + el.size) > evt.offsetY;
      });
      showLongHoldMenu(evt.pageX - (evt.clientX % grid_size) - ($("#grid_canvas_scrolling_container").scrollLeft() % grid_size) + grid_size, evt.pageY - (evt.clientY % grid_size) - ($("#grid_canvas_scrolling_container").scrollTop() % grid_size) + grid_size, (isUndefined(temp) ? -1 : temp.id));
    })
    .on('touchstart', function(evt) {
      prehandledByTouchEvent = true;
      var touch_x = evt.originalEvent.touches[0].clientX - $("#overlay_canvas").offset().left;
      var touch_y = evt.originalEvent.touches[0].clientY - $("#overlay_canvas").offset().top;
      canvasClicked(touch_x, touch_y);
      var temp = local_stored_grid_space.find(function(el) {
        return gridPoint2Pixel(el.x) < touch_x && gridPoint2Pixel(el.x + el.size) > touch_x && gridPoint2Pixel(el.y) < touch_y && gridPoint2Pixel(el.y + el.size) > touch_y;
      });
      holdTimer = window.setTimeout(function() {
        showLongHoldMenu(touch_x - (touch_x % grid_size) + grid_size + $("#overlay_canvas").offset().left, touch_y - (touch_y % grid_size) + $("#overlay_canvas").offset().top, isUndefined(temp) ? -1 : temp.id);
      }, 1000);
      return true;
    })
    .on('touchend', function(evt) {
      clearTimeout(holdTimer);
      return false;
    })
    .on('touchmove', function(evt) {
      clearPlayerName();
      clearTimeout(holdTimer);
      return true;
    });

  $('#place_element_button').click(function() {
    if ($("#place_element_button").text() === "Add") {
      switch ($("#selected_shape").val()) {
        case "square":
        case "circle":
          add_element_to_server($("#element_color").val(), selected_grid_x, selected_grid_y, $("#selected_shape").val(), $("#element_name").val(), $("#element_size").val(), $("#element_category").val());
          break;
        case "line":
          x_vertices.push(selected_grid_x);
          y_vertices.push(selected_grid_y);
          if (x_vertices.length === 1 && y_vertices.length === 1)
            $("#start_new_line_button").toggle();
          break;
      }
    } else {
      console.log($("#element_color").val());
      socket.emit('edit_element_on_server', {
        "grid_id": grid_id,
        "id": selected_element.id,
        "name": $("#element_name").val(),
        "shape": $("#selected_shape").val(),
        "color": $("#element_color").val(),
        "size": $("#element_size").val(),
        "category": $("#element_category").val()
      });
    }
  });

  $('#reset_board_button').click(function() {
    if (confirm("This will delete EVERYTHING on the board.\nAre you sure you want to do this?")) {
      socket.emit('reset_board', {
        "grid_id": grid_id
      });
      $("#reset_board_button").prop("disabled", true);
      refresh_elements_list();
    }
  });

  $("#start_new_line_button").click(function() {
    temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);

    if (selected_grid_x !== x_vertices[x_vertices.length - 1] || selected_grid_y !== y_vertices[y_vertices.length - 1]) {
      x_vertices.push(selected_grid_x);
      y_vertices.push(selected_grid_y);
    }

    if (x_vertices.length > 1 && y_vertices.length > 1)
      add_element_to_server($("#element_color").val(), x_vertices, y_vertices, $("#selected_shape").val(), null, $("#element_size").val(), $("#element_category").val());

    x_vertices = [];
    y_vertices = [];
    $("#start_new_line_button").toggle();
  });

  $("#move_inc_up")
    .mousedown(function() {
      incremental_move_element("up");
      movementTimer = window.setInterval(function() {
        incremental_move_element("up");
      }, movementInterval);
    })
    .mouseup(function() {
      console.log("cleared");
      window.clearInterval(movementTimer);
    })
    .on("touchstart", function(evt) {
      incremental_move_element("up");
      movementTimer = window.setInterval(function() {
        incremental_move_element("up");
      }, movementInterval);
    })
    .on("touchend", function(evt) {
      window.clearInterval(movementTimer);
    });

  $("#move_inc_down")
    .mousedown(function() {
      incremental_move_element("down");
      movementTimer = setInterval(function() {
        incremental_move_element("down");
      }, movementInterval);
    })
    .mouseup(function() {
      clearInterval(movementTimer);
    })
    .on("touchstart", function(evt) {
      incremental_move_element("down");
      movementTimer = window.setInterval(function() {
        incremental_move_element("down");
      }, movementInterval);
    })
    .on("touchend", function(evt) {
      window.clearInterval(movementTimer)
    });

  $("#move_inc_left")
    .mousedown(function() {
      incremental_move_element("left");
      movementTimer = setInterval(function() {
        incremental_move_element("left");
      }, movementInterval);
    })
    .mouseup(function() {
      clearInterval(movementTimer);
    })
    .on("touchstart", function(evt) {
      incremental_move_element("left");
      movementTimer = window.setInterval(function() {
        incremental_move_element("left");
      }, movementInterval);
    })
    .on("touchend", function(evt) {
      window.clearInterval(movementTimer);
    });

  $("#move_inc_right")
    .mousedown(function() {
      incremental_move_element("right");
      movementTimer = setInterval(function() {
        incremental_move_element("right");
      }, movementInterval);
    })
    .mouseup(function() {
      clearInterval(movementTimer);
    })
    .on("touchstart", function(evt) {
      incremental_move_element("right");
      movementTimer = window.setInterval(function() {
        incremental_move_element("right");
      }, movementInterval);
    })
    .on("touchend", function(evt) {
      window.clearInterval(movementTimer)
    });

  $("#selected_shape").change(function(el) {
    switch ($("#selected_shape").val()) {
      case 'line':
        $('#place_element_button').html("Add Vertex");
        break;
      case "square":
      case "circle":
        $('#place_element_button').html("Add");
        $('#start_new_line_button').hide();
        break;
    }
    if (selected_grid_x == -1 && selected_grid_y == -1) {
      return;
    }

    for (var i = 1; i < x_vertices.length; i++) {
      clear_item("line", [x_vertices[i - 1], x_vertices[i]], [y_vertices[i - 1], y_vertices[i]], {}, 0);
    }

    x_vertices.length = [];
    y_vertices.length = [];

    clear_prev_cursor_position();
    draw_cursor_at_position(selected_grid_x, selected_grid_y);
  });

  $("#drawing_controls_button").click(function() {
    $("#drawing_controls").toggle();
    $("#movement_controls").hide();
    $("#settings_controls").hide();
    $("#editing_controls").hide();
  });

  $("#movement_controls_button").click(function() {
    $("#movement_controls").toggle();
    $("#drawing_controls").hide();
    $("#settings_controls").hide();
    $("#editing_controls").hide();
  });

  $("#settings_controls_button").click(function() {
    $("#settings_controls").toggle();
    $("#drawing_controls").hide();
    $("#movement_controls").hide();
    $("#editing_controls").hide();
  });

  $("#grid_down").click(function() {
    $("#grid_space_dropdown").toggle();
  });

  $("#drawing_controls_btn").click(function() {
    $("#drawing_controls").toggle();
  });

  $("#editing_controls_btn").click(function() {
    $("#editing_controls").toggle();
  });

  $("#movement_controls_btn").click(function() {
    $("#movement_controls").toggle();
  });

  $("#settings_controls_btn").click(function() {
    $("#settings_controls").toggle();
  });

  $("#element_list_btn").click(function() {
    $("#element_list_dropdown").toggle();
  });

  $("#editing_controls_done").click(function() {

    socket.emit('edit_element_on_server', {
      "grid_id": grid_id,
      "id": $("#edit_element_id").val(),
      "name": $("#edit_name").val(),
      "type": $("#edit_shape").val(),
      "color": $("#edit_color").val(),
      "size": $("#edit_size").val(),
      "category": $("#edit_category").val()
    });

    removeEditMenu();
  });

  $("#randomize").click(function() {
    socket.emit('randomize', {
      "grid_id": grid_id
    });
  });

  $(".element_filter").click(function() {
    refresh_elements_list();
  });

  $("#addition_tab").click(function() {
    socket.emit('create_grid_space', {});
  });

  $("#list_header_elements").click(function() {
    $("#list_header_elements").css("background", "#345eb2");
    $("#list_header_elements").css("color", "white");
    $("#list_header_annotations").css("background", " #dddddd");
    $("#list_header_annotations").css("color", "black");

    $("#annotations_list_container").hide();
    $("#element_list_container").show();
  });

  $("#list_header_annotations").click(function() {
    $("#list_header_annotations").css("background", "#345eb2");
    $("#list_header_annotations").css("color", "white");
    $("#list_header_elements").css("background", " #dddddd");
    $("#list_header_elements").css("color", "black");

    $("#element_list_container").hide();
    $("#annotations_list_container").show();
  });

  $("#annotations_display").change(function() {
    $(".grid_canvas_annotation").toggle();
  });

  $(document)
    .on('click', '#tab_row .grid-name', function(evt) {
      $(".tab").removeClass("active");
      $(this).parent().addClass("active");
      grid_id = $(this).val();
      socket.emit('request_grid_space', {
        "id": $(this).val()
      }, function(msg) {
        grid_count_height = msg.grid_space.height;
        resizeGridHeight(grid_count_height);
        grid_count_width = msg.grid_space.width;
        resizeGridWidth(grid_count_width);
        clearPlayerName();
        local_stored_grid_space = [];
        local_stored_annotations = [];
        local_stored_pings = [];
        $("#grid_name").val(msg.grid_space.name);

        if (msg.grid_space.elements.length !== 0) {
          local_stored_grid_space = msg.grid_space.elements;
          $("#reset_board_button").prop("disabled", false);
          drawElements();
        }

        if (msg.grid_space.annotations.length !== 0) {
          local_stored_annotations = msg.grid_space.annotations;
        }

        refresh_elements_list();
        refresh_annotations_list();

        $("#options_add_or_edit_button").hide();
        $("#options_annotate_button").hide();
        $("#options_delete_button").hide();
        $("#options_copy_button").hide();
        $("#options_paste_button").hide();
        $("#options_movement_button").hide();
      });
    })
    .on('click', '#context_editing_controls_done', function(evt) {
      socket.emit('edit_element_on_server', {
        "grid_id": grid_id,
        "id": $("#context_edit_element_id").val(),
        "name": $("#context_edit_name").val(),
        "type": $("#context_edit_shape").val(),
        "color": $("#context_edit_color").val(),
        "size": $("#context_edit_size").val(),
        "category": $("#context_edit_category").val()
      });
    })
    .on('click', '#context_annotation_controls_done', function(evt) {
      socket.emit('add_annotation_to_server', {
        "grid_id": grid_id,
        "title": "",
        "content": $("#annotation_content").val(),
        "x": selected_grid_x,
        "y": selected_grid_y
      });
    })
    .on("mousedown", "#dragging_element_icon", function(evt) {
      mouse_down = true;
    })
    .on("touchstart", "#dragging_element_icon", function(evt) {
      touch_start = true;
    })
    .mousemove(function(evt) {
      if (mouse_down) {
        $("#dragging_element_icon").css("top", evt.clientY - (grid_size / 2));
        $("#dragging_element_icon").css("left", evt.clientX - (grid_size / 2));
        temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
        draw_temporary_cursor_at_position(evt.clientX - (evt.clientX % grid_size) - $("#temporary_drawing_canvas").offset().left + grid_size - ($("#grid_canvas_scrolling_container").scrollLeft() % grid_size), evt.clientY - (evt.clientY % grid_size) - $("#temporary_drawing_canvas").offset().top + grid_size - ($("#grid_canvas_scrolling_container").scrollTop() % grid_size), cursor_size);
      }
    })
    .on("touchmove", "#dragging_element_icon", function(evt) {
      if (touch_start) {
        $("#dragging_element_icon").css("top", evt.originalEvent.touches[0].clientY - (grid_size / 2));
        $("#dragging_element_icon").css("left", evt.originalEvent.touches[0].clientX - (grid_size / 2));
        temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
        draw_temporary_cursor_at_position(evt.originalEvent.touches[0].clientX - (evt.originalEvent.touches[0].clientX % grid_size) - $("#temporary_drawing_canvas").offset().left + grid_size, evt.originalEvent.touches[0].clientY - (evt.originalEvent.touches[0].clientY % grid_size) - $("#temporary_drawing_canvas").offset().top + grid_size, cursor_size);
      }
    })
    .on("mouseup", "#dragging_element_icon", function(evt) {
      dragElement(evt.clientX, evt.clientY, evt.pageX, evt.pageY);
      mouse_down = false;
    })
    .on("touchend", "#dragging_element_icon", function(evt) {
      dragElement(evt.originalEvent.changedTouches[0].clientX,
        evt.originalEvent.changedTouches[0].clientY,
        evt.originalEvent.changedTouches[0].pageX,
        evt.originalEvent.changedTouches[0].pageY);
      touch_start = false;
    })
    .on('click', '#tab_row .grid-space-delete', function(evt) {
      if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
        socket.emit("delete_grid_space_from_server", {
          "grid_id": $(this).val()
        });
      }
    });

  $("#grid_canvas").focus();
  $(document).keydown(function(e) {
    switch (e.which) {
      case 37:
        e.preventDefault();
        $("#move_inc_left").mousedown().mouseup();
        break;
      case 38:
        e.preventDefault();
        $("#move_inc_up").mousedown().mouseup();
        break;
      case 39:
        e.preventDefault();
        $("#move_inc_right").mousedown().mouseup();
        break;
      case 40:
        e.preventDefault();
        $("#move_inc_down").mousedown().mouseup();
        break;
    }
  });

  $("#overlapping_container_tab").click(function(evt) {
    $("#side_container_swap > *").hide();
    $("#options_container").show();
    $("#overlapping_side_container").show();
    $("#overlapping_back_button").hide();
    $(".drawing_canvas").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "300px"));
    $("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "200px" : "0px"));
  });

  $("#overlapping_back_button").click(function(evt) {
    $("#overlapping_back_button").hide();
    getContextMenu();
  });
}

function interfaceInitialization() {
  grid_canvas = document.getElementById('grid_canvas');
  underlay_canvas = document.getElementById('underlay_canvas');
  overlay_canvas = document.getElementById('overlay_canvas');
  temporary_drawing_canvas = document.getElementById('temporary_drawing_canvas');

  start_new_line_button = document.getElementById('start_new_line_button');

  $("#movement_controls").hide();
  $("#reset_board_button").prop("disabled", true);
  $("#start_new_line_button").hide();
  $("#lost_connection_div").hide();

  ctx = grid_canvas.getContext('2d');
  ctx2 = underlay_canvas.getContext('2d');
  overlay_ctx = overlay_canvas.getContext('2d');
  temporary_drawing_ctx = temporary_drawing_canvas.getContext('2d');

  grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  underlay_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  underlay_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  overlay_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  overlay_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  temporary_drawing_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  temporary_drawing_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;

  drawTopRuler();
  drawLeftRuler();

  drawScreen();
}

/**
 *
 */
function incremental_move_element(direction) {
  socket.emit('move_element', {
    "grid_id": grid_id,
    "x": selected_grid_x,
    "y": selected_grid_y,
    "direction": direction,
    "size": cursor_size
  }, function(msg) {
    clear_prev_cursor_position();
    draw_cursor_at_position(msg.x, msg.y, msg.size);
  });
}

function canvasClicked(x, y) {
  $("#dragging_element_icon").remove();
  selected_element = null;

  var temp = local_stored_grid_space.find(function(el) {
    return gridPoint2Pixel(el.x) < x && gridPoint2Pixel(el.x + el.size) > x &&
      gridPoint2Pixel(el.y) < y && gridPoint2Pixel(el.y + el.size) > y;
  });

  if (isUndefined(temp)) {
    cursor_size = 1;
    selected_grid_x = pixel2GridPoint(x - (x % grid_size));
    selected_grid_y = pixel2GridPoint(y - (y % grid_size));
  } else {
    cursor_size = temp.size;
    selected_grid_x = temp.x;
    selected_grid_y = temp.y;
    selected_element = temp;
  }

  clear_prev_cursor_position();

  if (x_vertices.length > 0 && y_vertices.length) {
    temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
    var temp_x = x_vertices.slice(0);
    var temp_y = y_vertices.slice(0);
    temp_x.push(selected_grid_x);
    temp_y.push(selected_grid_y);
    draw_temporary_item({
      "type": "line",
      "x": temp_x,
      "y": temp_y,
      "color": $("#element_color").val,
      "size": 3
    });
  }

  draw_cursor_at_position(selected_grid_x, selected_grid_y, cursor_size);
  updateSideMenuContent();
}

/**
 * Function for drawing the grid board
 */
function drawScreen() {
  ctx2.lineWidth = grid_line_width;
  ctx2.strokeStyle = grid_color;
  for (var i = 0; i < grid_count_height; i++) {
    for (var j = 0; j < grid_count_width; j++) {
      ctx2.strokeRect(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
    }
  }
}

function drawPing(ping, _grid_id) {
  ping.shape = "circle";
  ping.color = "4286f4";
  ping.size = 1;
  ping.id = ping_counter++;
  local_stored_pings.push(ping);
  drawElements();
  window.setTimeout(function() {
    if(_grid_id != grid_id) return;
    local_stored_pings.splice( local_stored_pings.findIndex(function(el) { return el.id == ping.id; }), 1);
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    drawElements();
  }, ping_period);
}

/**
 * Draws the input element to the canvas 
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
  switch (element.shape) {
    case "square":
    case "rectangle":
      ctx.fillStyle = "#" + element.color;
      x = gridPoint2Pixel(element.x) + grid_line_width * 2;
      y = gridPoint2Pixel(element.y) + grid_line_width * 2;
      ctx.fillRect(x + cursor_line_width / 2, y + cursor_line_width / 2, element.size * grid_size - cursor_line_width * 2, element.size * grid_size - cursor_line_width * 2);
      break;
    case "circle":
    case "oval":
      ctx.fillStyle = "#" + element.color;
      x = gridPoint2Pixel(element.x) + grid_line_width;
      y = gridPoint2Pixel(element.y) + grid_line_width;
      ctx.beginPath();
      ctx.arc(x + (grid_size / 2) * element.size, y + (grid_size / 2) * element.size, element.size * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
      ctx.fill();
      break;
    case "line":
      ctx.strokeStyle = "#" + element.color;
      ctx.lineWidth = element.size;
      ctx.beginPath();
      x = element.x.map(function(e) {
        return gridPoint2Pixel(e)
      });
      y = element.y.map(function(e) {
        return gridPoint2Pixel(e)
      });
      ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
      for (var i = 1; i < x.length; i++) {
        ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
      }
      ctx.stroke();
      break;
  }
}

function draw_temporary_item(element) {
  switch (element.type) {
    case "square":
      temporary_drawing_ctx.fillStyle = "#" + element.color;
      x = gridPoint2Pixel(element.x) + grid_line_width * 2;
      y = gridPoint2Pixel(element.y) + grid_line_width * 2;
      temporary_drawing_ctx.fillRect(x + cursor_line_width / 2, y + cursor_line_width / 2, element.size * grid_size - cursor_line_width * 2, element.size * grid_size - cursor_line_width * 2);
      break;
    case "circle":
      temporary_drawing_ctx.fillStyle = "#" + element.color;
      x = gridPoint2Pixel(element.x) + grid_line_width;
      y = gridPoint2Pixel(element.y) + grid_line_width;
      temporary_drawing_ctx.beginPath();
      temporary_drawing_ctx.arc(x + (grid_size / 2) * element.size, y + (grid_size / 2) * element.size, element.size * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
      temporary_drawing_ctx.fill();
      break;
    case "line":
      temporary_drawing_ctx.strokeStyle = "#" + element.color;
      temporary_drawing_ctx.lineWidth = element.size;
      temporary_drawing_ctx.beginPath();
      x = element.x.map(function(e) {
        return gridPoint2Pixel(e)
      });
      y = element.y.map(function(e) {
        return gridPoint2Pixel(e)
      });
      temporary_drawing_ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
      for (var i = 1; i < x.length; i++) {
        temporary_drawing_ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
      }
      temporary_drawing_ctx.stroke();
      break;
  }
}

/**
 * Clears the previous cursor position
 */
function clear_prev_cursor_position() {
  overlay_ctx.clearRect(0, 0, overlay_canvas.width, overlay_canvas.height);

  if (selected_grid_x === -1 || selected_grid_y === -1)
    return;

  overlay_ctx.strokeStyle = grid_color;
  overlay_ctx.lineWidth = grid_line_width;

  overlay_ctx.clearRect(gridPoint2Pixel(selected_grid_x), gridPoint2Pixel(selected_grid_y), cursor_size * grid_size + cursor_line_width, cursor_size * grid_size + cursor_line_width);
}

/**
 * Draws the cursor at the position and sets the global trackers
 *
 * @param {int} x
 * @param {int} y
 * @param {int} size
 */
function draw_cursor_at_position(x, y, size) {

  selected_grid_x = x;
  selected_grid_y = y;

  //   if (gridPoint2Pixel(x) < $("#grid_canvas_scrolling_container").scrollLeft() || gridPoint2Pixel(x) > $("#grid_canvas_scrolling_container").scrollLeft() + $("#grid_canvas_scrolling_container").width()) {
  //     $("#grid_canvas_scrolling_container").scrollLeft(gridPoint2Pixel(x));
  //   }

  //   if (gridPoint2Pixel(y) < $("#grid_canvas_scrolling_container").scrollTop() || gridPoint2Pixel(y) > $("#grid_canvas_scrolling_container").scrollTop() + $("#grid_canvas_scrolling_container").height()) {
  //     $("#grid_canvas_scrolling_container").scrollTop(gridPoint2Pixel(y));
  //   }

  switch ($('#selected_shape').val()) {
    case "square":
    case "circle":
      overlay_ctx.lineWidth = cursor_line_width;
      overlay_ctx.strokeStyle = grid_highlight;
      overlay_ctx.strokeRect(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, grid_size * size, grid_size * size);
      cursor_size = size;
      break;
    case "line":
      overlay_ctx.fillStyle = grid_highlight;
      overlay_ctx.beginPath();
      overlay_ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
      overlay_ctx.fill();
  }

  $("#move_to_x").val(selected_grid_x);
  $("#move_to_y").val(selected_grid_y);
}

function draw_temporary_cursor_at_position(x, y, size) {
  switch ($('#selected_shape').val()) {
    case "square":
    case "circle":
      temporary_drawing_ctx.lineWidth = cursor_line_width;
      temporary_drawing_ctx.strokeStyle = "#b38f00";
      temporary_drawing_ctx.strokeRect(x + grid_line_width, y + grid_line_width, grid_size * size, grid_size * size);
      cursor_size = size;
      break;
    case "line":
      temporary_drawing_ctx.fillStyle = grid_highlight;
      temporary_drawing_ctx.beginPath();
      temporary_drawing_ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
      temporary_drawing_ctx.fill();
  }
}

function resizeGridWidth(width) {
  grid_count_width = width;
  $("#grid_size_horizontal").val(grid_count_width);
  grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  underlay_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  overlay_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  temporary_drawing_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
  drawScreen();
  drawTopRuler();
}

function resizeGridHeight(height) {
  grid_count_height = height;
  $("#grid_size_vertical").val(grid_count_height);
  grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  underlay_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  overlay_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  temporary_drawing_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
  drawScreen();
  drawLeftRuler();
}

function add_element_to_server(color, x, y, shape, name, size, category) {
  socket.emit('add_element_to_server', {
    "grid_id": grid_id,
    "color": color,
    "x": JSON.stringify(x),
    "y": JSON.stringify(y),
    "shape": shape,
    "name": name,
    "size": size,
    "category": category
  });
}

function error_report(status, error) {
  console.log("Error: " + status.status + ", " + error);
}

function refresh_elements_list() {
  var filters = document.querySelectorAll(".element_filter:checked");
  var filter = [];
  for (var i = 0; i <= filters.length - 1; i++) {
    filter[i] = filters[i].value;
  }

  if (filters.length !== 0) {
    $("#element_list").empty();
    local_stored_grid_space
      .filter(function(el) {
        return filter.indexOf(el.category) != -1
      })
      .forEach(function(el) {
        $("#element_list").append(composeElementListRowElement(el))
      });
  } else {
    $("#element_list").empty();
  }
}

function refresh_annotations_list() {
  $("#annotations_list").empty();
  local_stored_annotations.forEach(function(el) {
    $("#annotations_list").append(composeAnnotationListRowElement(el));
  });
  hideAnnotations();
  showAnnotations();
  $(".grid_canvas_annotation").toggle(false);
}

/**
 * Create an HTML DOM element
 *
 * @param {Element} el -
 * @return {string} An html element to display 
 */
function composeElementListRowElement(el) {
  return "<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.id + ")\" id=" + el.id + ">" +
    "<div style=\"width: 25%; display: inline-block;\">" +
    "<p style=\"font-size: smaller;\">" + el.name + "<\p>" +
    "</div>" +
    "<div style=\"width: 35%; display: inline-block;\">" +
    "<p style=\"font-size: smaller;\">" + el.category + "<\p>" +
    "</div>" +
    "<button id=\"element_row_edit\" onClick=\"editElementRow(" + el.id + ")\">&#x270E;</button>" +
    "<button id=\"element_row_delete\" onclick=\"delete_element_from_server(" + el.id + ")\">&times</button>" +
    "</div>";
}

function composeAnnotationListRowElement(el) {
  return "<div class=\"element_list_row\" onclick=\"clicked_annotation_list(" + el.id + ")\">" +
    "<p>" + el.content + "<\p>" +
    "<button id=\"element_row_edit\" onClick=\"editAnnotationRow(" + el.id + ")\">&#x270E;</button>" +
    "<button id=\"element_row_delete\" onclick=\"delete_annotation_from_server(" + el.id + ")\">&times</button>" +
    "</div>";
}

function showLongHoldMenu(x, y, id) {
  if (id != -1) $("body").append("<span id=\"dragging_element_icon\" class=\"glyphicon popup_items\" style=\"position:absolute;top:" + (y - grid_size) + "px;left:" + (x - grid_size * 2) + "px;width:" + grid_size + "px;height:" + grid_size + "px;font-size: 18px;\">&#xe068;</span>");
  getContextMenu();
}

function getContextMenu() {
  $("#overlapping_back_button").hide();
  $("#side_container_swap > *").hide();
  $("#options_container").show();
  $("#overlapping_side_container").show();
  $(".drawing_canvas").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "300px"));
  $("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "0"));
}

function editElementRow(id) {
  selected_element = local_stored_grid_space.find(function(el) {
    return el.id == id;
  });

  $("#overlapping_container").hide();
  $("#add_container").show();

  $("#selected_shape").val(selected_element.shape);
  $("#element_color").val(selected_element.color);
  $("#element_color_changer")[0].jscolor.fromString(selected_element.color);
  $("#element_size").val(selected_element.size);
  $("#element_category").val(selected_element.category);
  $("#element_name").val(selected_element.name);

  $("#vertices_list").empty();
  if (selected_element.shape === "line") {
    selected_element.x.forEach(function(_, ind) {
      $("#vertices_list").append("<p>" + selected_element.x[ind] + "," + selected_element.y[ind] + "</p>");
    });
  }

  $("#place_element_button").text("Submit");
}

function editAnnotationRow(id) {

}

function showPlayerName(x, y, name) {
  $("body").append("<div id=\"popup_name\" class=\"popup_items\" style=\"top:" + y + "px; left:" + x + "px\"><p>" + name + "</p></div>");
}

function clearPlayerName() {
  $("#popup_name").remove();
}

/**
 * Move the cursor to the element that was selected from the list of elements
 *
 * @param {int} id - the unique ID of the selected element
 */
function clicked_element_list(id) {
  socket.emit('select_element_from_list', {
    "id": id,
    "selected_grid_x": selected_grid_x,
    "selected_grid_y": selected_grid_y,
    "size": cursor_size
  });
}

function clicked_annotation_list(id) {
  var temp = local_stored_annotations.find(function(el) {
    return el.id == id;
  });
  clear_prev_cursor_position();
  draw_cursor_at_position(temp.x, temp.y, 1);
}

/**
 * Delete's a specific element from the server
 *
 * @param {int} id - the unique ID of the element to delete
 */
function delete_element_from_server(id) {
  socket.emit('delete_element_on_server', {
    "grid_id": grid_id,
    "element_id": id
  });
}

function delete_annotation_from_server(id) {
  socket.emit('delete_annotation_from_server', {
    "grid_id": grid_id,
    "annotation_id": id
  });
}

function drawTopRuler() {
  var ruler_top = document.getElementById("ruler_top");
  ruler_top.width = grid_size * grid_count_width + 2 * grid_line_width;
  ruler_top.height = grid_size;
  var ctx2 = ruler_top.getContext("2d");
  ctx2.font = "10px Arial";
  for (var i = 0; i < grid_count_width; i++) {
    var n = ctx2.measureText(i).width / 2;
    ctx2.fillText(i + 1, grid_line_width + (grid_size * i) + (grid_size / 2) - n, grid_size / 1.5);
  }
}

function drawLeftRuler() {
  var ruler_left = document.getElementById("ruler_left");
  ruler_left.height = grid_size * grid_count_height + 2 * grid_line_width;
  ruler_left.width = grid_size;
  var ctx2 = ruler_left.getContext("2d");
  ctx2.font = "10px Arial";
  for (var i = 0; i < grid_count_height; i++) {
    var n = ctx2.measureText(i).width;
    ctx2.fillText(i + 1, 0, 10 + grid_line_width + (grid_size * i) + (grid_size / 2) - n);
  }
}

function drawElements() {
  local_stored_grid_space.forEach(function(el) {
    draw_item(el)
  });
  
  local_stored_pings.forEach(function(el) {
    draw_item(el)
  });
}

/**
 * Move a selected element to the final dragged position
 *
 */
function dragElement(client_x, client_y, page_x, page_y) {
  socket.emit('warp_element', {
    "grid_id": grid_id,
    "x": selected_grid_x,
    "y": selected_grid_y,
    "dest_x": pixel2GridPoint(client_x - (client_x % grid_size) - $("#temporary_drawing_canvas").offset().left + grid_size),
    "dest_y": pixel2GridPoint(client_y - (client_y % grid_size) - $("#temporary_drawing_canvas").offset().top + grid_size)
  }, function(msg) {
    clear_prev_cursor_position();
    draw_cursor_at_position(msg.x, msg.y, msg.size);
  });

  $("#dragging_element_icon").css("top", page_y - (client_y % grid_size));
  $("#dragging_element_icon").css("left", page_x - (client_x % grid_size));
  temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
  clear_prev_cursor_position();
  draw_cursor_at_position(pixel2GridPoint(client_x - (client_x % grid_size) - $("#temporary_drawing_canvas").offset().left + grid_size), pixel2GridPoint(client_y - (client_y % grid_size) - $("#temporary_drawing_canvas").offset().top + grid_size), cursor_size);
}

function showAnnotations() {
  local_stored_annotations.forEach(function(el) {
    $("#grid_canvas_scrolling_container").append("<span class=\"grid_canvas_annotation\" style=\"position: absolute; top: " + (gridPoint2Pixel(el.y) + $("#temporary_drawing_canvas").offset().top) + "px; left: " + (gridPoint2Pixel(el.x) + $("#temporary_drawing_canvas").offset().left) + "px; z-index: 2;\">&#x2139;</span>");
  });
  if (!$("#annotations_display").attr("checked")) $(".grid_canvas_annotations").hide();
}

function hideAnnotations() {
  $("#grid_canvas_scrolling_container .grid_canvas_annotation").remove();
}

function selectedMenuOption(option) {
  switch (option) {
    case "lists":
      $("#overlapping_back_button").show();
      $("#options_container").hide();
      $("#overlapping_container").show();
      break;
    case "grid_space":
      $("#overlapping_back_button").show();
      $("#options_container").hide();
      $("#grid_space_container").show();
      break;
    case "add_or_edit":
      $("#overlapping_back_button").show();
      $("#options_container").hide();
      $("#add_container").show();
      var isAdd = $("#options_add_or_edit_button").text() === "Add";
      $("#selected_shape").val(isAdd ? "square" : selected_element.shape);
      $("#element_color").val(isAdd ? "000000" : selected_element.color);
      $("#element_color_changer")[0].jscolor.fromString(isAdd ? "#000000" : "#" + selected_element.color);
      $("#element_size").val(isAdd ? 1 : selected_element.size);
      $("#element_category").val(isAdd ? "environment" : selected_element.category);
      $("#element_name").val(isAdd ? "object" : selected_element.name);
      $("#place_element_button").text(isAdd ? "Add" : "Submit");
      break;
    case "movement":
      $("#overlapping_back_button").show();
      $("#options_container").hide();
      $("#movement_container").show();
      break;
    case "copy":
      copied_element = local_stored_grid_space.find(function(el) {
        return el.x == selected_grid_x && el.y == selected_grid_y;
      });
      copied_element.grid_id = grid_id;
      break;
    case "paste":
      add_element_to_server(copied_element.color, selected_grid_x, selected_grid_y, copied_element.shape, copied_element.name, copied_element.size, copied_element.category);
      break;
    case "close":
      $("#overlapping_side_container").hide();
      $(".drawing_canvas").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "300px"));
      $("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "200px" : "0px"));
      break;
    case "delete":
      socket.emit('delete_element_on_server', {
        "grid_id": grid_id,
        "element_id": selected_element.id
      });
      break;
    case "annotate":
      $("#overlapping_back_button").show();
      $("#options_container").hide();
      $("#annotations_container").show();
      break;
  }
}

function updateSideMenuContent() {
  $("#options_add_or_edit_button").show();
  if (selected_element === null) {
    $("#options_add_or_edit_button").text("Add");
    $("#options_copy_button").hide();
    $("#options_paste_button").hide();
    $("#options_delete_button").hide();
    $("#options_movement_button").hide();
  } else {
    $("#options_add_or_edit_button").text("Edit");
    $("#options_copy_button").show();
    $("#options_paste_button").show();
    $("#options_delete_button").show();
    $("#options_movement_button").show();
  }

  if (copied_element === null) {
    $("#options_paste_button").hide();
  } else {
    $("#options_paste_button").show();
  }

  $("#options_annotate_button").show();
}

function pingPosition() {
  add_element_to_server("", selected_grid_x, selected_grid_y, "", "", "", "ping");
}

/**
 * Converts a pixel value to a quantized grid location
 * 
 * @param {int} raw_location - a pixel location
 * @returns {int} a quantized grid point
 */
function pixel2GridPoint(raw_location) {
  return 1 + (raw_location - (raw_location % grid_size)) / grid_size;
}

/**
 * Converts a grid location to a quantized pixel value
 *
 * @param {int} grid_point - quantized grid point
 * @returns {int} a pixel location
 */
function gridPoint2Pixel(grid_point) {
  return (grid_point - 1) * grid_size;
}

/**
 * Determine if the value is undefined 
 *
 * @param value - input which may be undefined
 * @returns {boolean} Tru if undefined, false otherwise
 */
function isUndefined(value) {
  return value === undefined;
}
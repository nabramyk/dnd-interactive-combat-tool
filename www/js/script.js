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

/** @global {int} selected_grid_x - x coordinate of the selected cursor position */
var selected_grid_x = -1;

/** @global {int} selected_grid_y - y coordinate of the selected cursor position */
var selected_grid_y = -1;

/** @global {int} cursor_size - the span of grid spaces the cursor overlays */
var cursor_size = 1;
var cursor_line_width = 1;

var index_id = 0,
  index_x = 1,
  index_y = 2;

var holdTimer, hoverTimer;
var prehandledByTouchEvent = false;

var local_stored_grid_space = [];
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

  socket.on('init', function(msg) {
    grid_count_height = msg.grid_height;
    resizeGridHeight(grid_count_height);
    grid_count_width = msg.grid_width;
    resizeGridWidth(grid_count_width);

    clear_prev_cursor_position();
    selected_grid_x = -1;
    selected_grid_y = -1;

    $("#element_list").empty();
    refresh_elements_list();

    if (msg.elements.length !== 0) {
      local_stored_grid_space = msg.elements;
      $("#reset_board_button").prop("disabled", false);
      drawElements();
    }
  });

  socket.on('connect', function(msg) {
    $("#lost_connection_div").hide();
    socket.emit('init', {});
  });

  socket.on('disconnect', function() {
    $("#lost_connection_div").show();
    $("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
  });

  socket.on('retrieve_elements_list', function(msg) {
    $("#element_list").empty();

    msg.forEach(function(el) {
      $("#element_list").append(composeElementListRowElement(el));
    });
  })

  socket.on('resize_height', function(msg) {
    grid_count_height = msg.height;
    resizeGridHeight(grid_count_height);
    local_stored_grid_space = msg.elements;
    drawElements();
  });

  socket.on('resize_width', function(msg) {
    grid_count_width = msg.width;
    resizeGridWidth(grid_count_width);
    local_stored_grid_space = msg.elements;
    drawElements();
  });

  socket.on('added_element', function(msg) {
    if (msg === null)
      return alert("Cannot place an element where one already exists");
    $("#reset_board_button").prop("disabled", false);
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space = msg;
    drawElements();
    refresh_elements_list();
  });

  socket.on('removed_element', function(msg) {
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space = msg;
    drawElements();
    $("#reset_board_button").prop("disabled", msg.gridSpaceEmpty);
  });

  socket.on('move_element', function(msg) {
    ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
    local_stored_grid_space = msg.elements;
    drawElements();
    $("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
  });

  socket.on('moving_element', function(msg) {
    clear_prev_cursor_position();
    draw_cursor_at_position(msg.x, msg.y, msg.size);
  });

  socket.on('selected_element_from_list', function(msg) {
    clear_prev_cursor_position();
    if (msg.selected_element.x === -1 && msg.selected_element.y === -1)
      return

    if (msg.selected_element.type === "line") {
      for (var i = 0; i < msg.selected_element.x.length; i++) {
        overlay_ctx.fillStyle = "#" + grid_highlight;
        overlay_ctx.beginPath();
        overlay_ctx.arc(gridPoint2Pixel(msg.selected_element.x[i]), gridPoint2Pixel(msg.selected_element.y[i]), grid_size / 4, 0, 2 * Math.PI);
        overlay_ctx.fill();
      }
    } else {
      draw_cursor_at_position(msg.selected_element.x, msg.selected_element.y, msg.selected_element.size);
    }
  });

  socket.on('edited_element', function(msg) {
    $("#element_list>#" + msg.id).replaceWith(composeElementListRowElement(msg));
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
      "height": grid_count_height
    });
  });

  $("#grid_size_horizontal").change(function() {
    grid_count_width = $("#grid_size_horizontal").val();
    socket.emit('resize_width', {
      "width": grid_count_width
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
          if(prehandledByTouchEvent) {
            prehandledByTouchEvent = false;
            return;
          }
          showPlayerName(evt.offsetX + $("#overlay_canvas").offset().left, evt.offsetY + $("#overlay_canvas").offset().top - 40, el.name);
        }
      });
    })
    .mouseleave(function(evt) {
      clearTimeout(hoverTimer);
    })
    .contextmenu(function(evt) {
      removeEditMenu();
      clearPlayerName();
      evt.preventDefault();
      var temp = local_stored_grid_space.find(function(el) {
        return gridPoint2Pixel(el.x) < evt.offsetX && gridPoint2Pixel(el.x + el.size) > evt.offsetX && gridPoint2Pixel(el.y) < evt.offsetY && gridPoint2Pixel(el.y + el.size) > evt.offsetY;
      });
      showLongHoldMenu(evt.pageX, evt.pageY, (isUndefined(temp) ? -1 : temp.id));
    })
    .on('touchstart', function(evt) {
      prehandledByTouchEvent = true;
      removeEditMenu();
      var touch_x = evt.originalEvent.touches[0].clientX;
      var touch_y = evt.originalEvent.touches[0].clientY;
      canvasClicked(touch_x - $("#overlay_canvas").offset().left, touch_y - $("#overlay_canvas").offset().top);
      holdTimer = window.setTimeout(function() {
        showLongHoldMenu(touch_x, touch_y);
      }, 1000);
      return true;
    })
    .on('touchend', function(evt) {
      clearTimeout(holdTimer);
      return false;
    })
    .on('touchmove', function(evt) {
      removeEditMenu();
      clearPlayerName();
      clearTimeout(holdTimer);
      return true;
    });

  $('#place_element_button').click(function() {
    switch ($("#selected_shape").val()) {
      case "square":
      case "circle":
        add_element_to_server($("#element_color").val(), selected_grid_x, selected_grid_y, $("#selected_shape").val(), null, $("#element_size").val(), $("#element_category").val());
        break;
      case "line":
        x_vertices.push(selected_grid_x);
        y_vertices.push(selected_grid_y);
        if (x_vertices.length === 1 && y_vertices.length === 1)
          $("#start_new_line_button").toggle();
        break;
    }
  });

  $('#reset_board_button').click(function() {
    if (confirm("This will delete EVERYTHING on the board.\nAre you sure you want to do this?")) {
      socket.emit('reset_board', {});
      $("#reset_board_button").prop("disabled", true);
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

  $("#move_inc_up").click(function() {
    incremental_move_element("up");
  });
  $("#move_inc_down").click(function() {
    incremental_move_element("down");
  });
  $("#move_inc_left").click(function() {
    incremental_move_element("left");
  });
  $("#move_inc_right").click(function() {
    incremental_move_element("right");
  });

  $("#selected_shape").change(function(el) {
    switch ($("#selected_shape").val()) {
      case 'line':
        $('#place_element_button').html("Add Vertex");
        break;
      case "square":
      case "circle":
        $('#place_element_button').html("Add Element");
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
      "id": $("#edit_element_id").val(),
      "name": $("#edit_name").val(),
      "type": $("#edit_shape").val(),
      "color": $("#edit_color").val(),
      "size": $("#edit_size").val(),
      "category": $("#edit_category").val()
    });

    removeEditMenu();
  });

  $("#editing_controls_cancel").click(function() {
    removeEditMenu();
  });

  $("#randomize").click(function() {
    socket.emit('randomize', {});
  });

  $(".element_filter").click(function() {
    refresh_elements_list();
  });

  $("#grid_canvas").focus();
  $(document).keydown(function(e) {
    switch (e.which) {
      case 37:
        e.preventDefault();
        $("#move_inc_left").click();
        break;
      case 38:
        e.preventDefault();
        $("#move_inc_up").click();
        break;
      case 39:
        e.preventDefault();
        $("#move_inc_right").click();
        break;
      case 40:
        e.preventDefault();
        $("#move_inc_down").click();
        break;
    }
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
    "x": selected_grid_x,
    "y": selected_grid_y,
    "direction": direction,
    "size": cursor_size
  });
}

function canvasClicked(x, y) {
  removeEditMenu();

      var temp = local_stored_grid_space.find(function(el) {
        return gridPoint2Pixel(el.x) < x && gridPoint2Pixel(el.x + el.size) > x &&
          gridPoint2Pixel(el.y) < y && gridPoint2Pixel(el.y + el.size) > y;
      });
    
      if(isUndefined(temp)) {
        cursor_size = 1;
        selected_grid_x = pixel2GridPoint(x - (x % grid_size));
        selected_grid_y = pixel2GridPoint(y - (y % grid_size));
      } else {
        cursor_size = temp.size;
        selected_grid_x = temp.x;
        selected_grid_y = temp.y;
      }

      clear_prev_cursor_position();

      if (x_vertices.length > 0 && y_vertices.length) {
        temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
        var temp_x = x_vertices.slice(0);
        var temp_y = y_vertices.slice(0);
        temp_x.push(msg.selected_grid_x);
        temp_y.push(msg.selected_grid_y);
        draw_temporary_item({
          "type": "line",
          "x": temp_x,
          "y": temp_y,
          "color": $("#element_color").val,
          "size": 3
        });
      }
    
      draw_cursor_at_position(selected_grid_x, selected_grid_y, cursor_size);
      $("#editing_controls").remove();
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

/**
 * Draws the input element to the canvas 
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
  switch (element.type) {
    case "square":
      ctx.fillStyle = "#" + element.color;
      x = gridPoint2Pixel(element.x) + grid_line_width * 2;
      y = gridPoint2Pixel(element.y) + grid_line_width * 2;
      ctx.fillRect(x + cursor_line_width / 2, y + cursor_line_width / 2, element.size * grid_size - cursor_line_width * 2, element.size * grid_size - cursor_line_width * 2);
      break;
    case "circle":
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

  if (gridPoint2Pixel(x) < $("#grid_canvas_scrolling_container").scrollLeft() || gridPoint2Pixel(x) > $("#grid_canvas_scrolling_container").scrollLeft() + $("#grid_canvas_scrolling_container").width()) {
    $("#grid_canvas_scrolling_container").scrollLeft(gridPoint2Pixel(x));
  }

  if (gridPoint2Pixel(y) < $("#grid_canvas_scrolling_container").scrollTop() || gridPoint2Pixel(y) > $("#grid_canvas_scrolling_container").scrollTop() + $("#grid_canvas_scrolling_container").height()) {
    $("#grid_canvas_scrolling_container").scrollTop(gridPoint2Pixel(y));
  }

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
    "color": color,
    "x_coord": JSON.stringify(x),
    "y_coord": JSON.stringify(y),
    "object_type": shape,
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
    socket.emit('get_elements_list', {
      "filter": filter
    });
  } else {
    $("#element_list").empty();
  }
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
    "<div style=\"width: 20%; display: inline-block;\">" +
    "<p style=\"font-size: smaller;\">X: " + el.x +
    "\nY: " + el.y + "</p>" +
    "</div>" +
    "<button id=\"element_row_edit\" onClick=\"edit_element_row(" + el.id + ")\">&#x270E;</button>" +
    "<button id=\"element_row_delete\" onclick=\"delete_element_from_server(" + el.id + ")\">&times</button>" +
    "</div>";
}

function showLongHoldMenu(x, y, id) {
  $("body").append(getOptionsMenu(x, y, id));
}

function getContextMenu() {
  $("body").append(getEditMenu(x, y));
}

function getAddMenu() {
  removeEditMenu();
}

function getEditMenu() {
  removeEditMenu();
}

function getOptionsMenu(x, y, id) {
  return "<div id=\"options_controls\" style=\"top:" + y + "px;left:" + x + "px;\">" +
    "<button class=\"menu_item\" onclick=\"getAddMenu(" + x + "," + y + ")\">Add</button><br>" +
    "<button class=\"menu_item\" onclick=\"getEditMenu(" + x + "," + y + ")\">Edit</button><br>" +
    "<button class=\"menu_item\" onclick=\"delete_element_from_server(" + id + ")\">Delete</button>" +
    "</div>";
}

function getAddMenu(x, y) {
  removeEditMenu();
  $("body").append("<div id=\"editing_controls\" style=\"top:" + y + "px;left:" + x + "px;\">" +
    "<input id=\"edit_element_id\" type=\"hidden\" value=\"0\">" +
    "<select id=\"edit_shape\" class=\"menu_item\">" +
    "<option value=\"square\">Square</option>" +
    "<option value=\"circle\">Circle</option>" +
    "<option value=\"line\">Line</option>" +
    "</select><br>" +
    "<input name=\"editcolor\" id=\"edit_color\" type=\"hidden\" value=\"000000\">" +
    "<input id=\"edit_color_changer\" class=\"jscolor {valueElement:\'edit_color\', width: 500, height: 350, closable: true} menu_item\">" +
    "<div style=\"display: inline-block;\">" +
    "<label for=\"edit_size\" style=\"width: 50px; margin-left: auto; margin-right: auto;\">Size</label>" +
    "<br>" +
    "<input type=\"number\" id=\"edit_size\" class=\"menu_item\" value=\"1\">" +
    "</div>" +
    "<div style=\"display: inline-block;\">" +
    "<label for=\"edit_category\">Category</label>" +
    "<br>" +
    "<select id=\"edit_category\" class=\"menu_item\">" +
    "<option value=\"environment\">Environment</option>" +
    "<option value=\"player\">Player</option>" +
    "<option value=\"enemy\">Enemy</option>" +
    "<option value=\"npc\">NPC</option>" +
    "</select>" +
    "</div>" +
    "<div style=\"display: inline-block;\">" +
    "<label for=\"edit_name\">Name</label>" +
    "<br>" +
    "<input type=\"text\" id=\"edit_name\" class=\"menu_item\">" +
    "</div>" +
    "<br>" +
    "<button id=\"editing_controls_done\" class=\"menu_item\" onclick=\"\">Done</button><br>" +
    "<button id=\"editing_controls_cancel\" class=\"menu_item\" onclick=\"removeEditMenu()\">Cancel</button>" +
    "</div>");
}

function getEditMenu(x, y) {
  return "<div id=\"editing_controls\" style=\"top:" + y + "px;left:" + x + "px;\">" +
    "<input id=\"edit_element_id\" type=\"hidden\" value=\"0\">" +
    "<select id=\"edit_shape\" class=\"menu_item\">" +
    "<option value=\"square\">Square</option>" +
    "<option value=\"circle\">Circle</option>" +
    "<option value=\"line\">Line</option>" +
    "</select><br>" +
    "<input name=\"editcolor\" id=\"edit_color\" type=\"hidden\" value=\"000000\">" +
    "<input id=\"edit_color_changer\" class=\"jscolor {valueElement:\'edit_color\', width: 500, height: 350, closable: true} menu_item\">" +
    "<div style=\"display: inline-block;\">" +
    "<label for=\"edit_size\" style=\"width: 50px; margin-left: auto; margin-right: auto;\">Size</label>" +
    "<br>" +
    "<input type=\"number\" id=\"edit_size\" class=\"menu_item\" value=\"1\">" +
    "</div>" +
    "<div style=\"display: inline-block;\">" +
    "<label for=\"edit_category\">Category</label>" +
    "<br>" +
    "<select id=\"edit_category\" class=\"menu_item\">" +
    "<option value=\"environment\">Environment</option>" +
    "<option value=\"player\">Player</option>" +
    "<option value=\"enemy\">Enemy</option>" +
    "<option value=\"npc\">NPC</option>" +
    "</select>" +
    "</div>" +
    "<div style=\"display: inline-block;\">" +
    "<label for=\"edit_name\">Name</label>" +
    "<br>" +
    "<input type=\"text\" id=\"edit_name\" class=\"menu_item\">" +
    "</div>" +
    "<br>" +
    "<button id=\"editing_controls_done\" class=\"menu_item\" onclick=\"\">Done</button><br>" +
    "<button id=\"editing_controls_cancel\" class=\"menu_item\" onclick=\"removeEditMenu()\">Cancel</button>" +
    "</div>";
}

function removeEditMenu() {
  $("#options_controls").remove();
  $("#editing_controls").remove();
}

function edit_element_row(id) {
  socket.emit('find_element_by_id', id);
  socket.on('element_by_id', function(msg) {
    $("#movement_controls").hide();
    $("#drawing_controls").hide();
    $("#settings_controls").hide();
    $("#editing_controls").show();

    $("#edit_element_id").val(id);
    $("#edit_shape").value = msg.type;
    $("#edit_color_changer").css("background", "#" + msg.color);
    $("#edit_size").val(msg.size);
    $("#edit_category").val(msg.category);
    $("#edit_name").val(msg.name);
  });
}

function calculateMenuCoordinates(x, y) {
  return [x, y];
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

/**
 * Delete's a specific element from the server
 *
 * @param {int} id - the unique ID of the element to delete
 */
function delete_element_from_server(id) {
  socket.emit('delete_element_on_server', id);
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
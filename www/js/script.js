/** 
 * @author Nathan Abramyk 
 * @version 1.0.0 
 */

/** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
var grid_size = 20;

/** @global {int} grid_count_width */
var grid_count_width = 0;
var grid_count_height = 0;
var grid_id = 0;
var ping_period = 10;
var opacity_rate = 0.04;

var cPosX = 0, cPosY = 0;

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

	$("loading_div").show();

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

			//interfaceInitialization();

			$("#loading_div").hide();
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

	cPosX = (window.innerWidth - grid_canvas.width) < 0 ? 0 : Math.ceil((window.innerWidth - grid_canvas.width) / 2);
	cPosY = (window.innerWidth - grid_canvas.width) < 60 ? 60 : Math.ceil((window.innerWidth - grid_canvas.width) / 2);

	grid_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
	underlay_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
	overlay_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
	temporary_drawing_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
	document.getElementById("ruler_left").style.transform = "translate(" + (cPosX - 20 < 0 ? 0 : cPosX - 20) + "px," + cPosY + "px)";
	document.getElementById("ruler_top").style.transform = "translate(" + cPosX + "px," + (cPosY - 20 < 40 ? 40 : cPosY - 20) + "px)";

	var hammer = new Hammer(document.getElementById('grid_canvas_scrolling_container'), null);
	var overlay_canvas_hammer = new Hammer(document.getElementById('overlay_canvas'), null);
	var tab_row = new Hammer(document.getElementById('tab_row'), null);

	overlay_canvas_hammer.get('pinch').set({ enable: true });

	hammer.on('pan', function(evt) {
		cPosX += Math.ceil(evt.deltaX * 0.03);
		cPosY += Math.ceil(evt.deltaY * 0.03);
		grid_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		underlay_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		overlay_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		temporary_drawing_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";

		document.getElementById("ruler_left").style.transform = "translate(" + (cPosX - 20 < 0 ? 0 : cPosX - 20) + "px," + cPosY + "px)";
		document.getElementById("ruler_top").style.transform = "translate(" + cPosX + "px," + (cPosY - 20 < 40 ? 40 : cPosY - 20) + "px)";
	});

	hammer.on('swipe', function(evt) {
		console.log(evt);
	});

	hammer.on('tap', function(evt) {
		console.log(evt);
	});

	overlay_canvas_hammer.on('tap', function(evt) {
		console.log(evt);
		canvasClicked(evt.center.x - $("#overlay_canvas").offset().left, evt.center.y - $("#overlay_canvas").offset().top);
	});

	overlay_canvas_hammer.on('pinch', function(evt) {
		console.log(evt);
		//grid_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		underlay_canvas.style.transform = "scale(0.5,0.5)";
		//overlay_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		//temporary_drawing_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
	});

	tab_row.on('pan', function(evt) {
		$("#tab_row").scrollLeft($("#tab_row").scrollLeft() - 50 * ( evt.deltaX / $("#tab_row")[0].scrollWidth));
	});

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
		return gridPoint2Pixel(el.x) < x && gridPoint2Pixel(el.x + JSON.parse(el.size.width)) > x &&
		gridPoint2Pixel(el.y) < y && gridPoint2Pixel(el.y + JSON.parse(el.size.height)) > y;
	});

	if (isUndefined(temp)) {
		cursor_size = { "width" : 1, "height" : 1 };
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
		"category": category,
		"rotation": 1
	});
}

function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
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

function editAnnotationRow(id) {

}

/**
 * Move the cursor to the element that was selected from the list of elements
 *
 * @param {int} id - the unique ID of the selected element
 */
function clicked_element_list(id) {
	//todo
	console.log("TODO: Implement clicking element list items.");
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

function pingPosition() {
	add_element_to_server("", selected_grid_x, selected_grid_y, "", "", "", "ping");
}
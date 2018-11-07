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

var cPosX = 0, cPosY = 0;

/** @global {int} selected_grid_x - x coordinate of the selected cursor position */
var selected_grid_x = -1;

/** @global {int} selected_grid_y - y coordinate of the selected cursor position */
var selected_grid_y = -1;

var selected_element;

/** @global {int} cursor_size - the span of grid spaces the cursor overlays */
var cursor_size = 1;

var holdTimer, hoverTimer, movementTimer;

var local_stored_grid_space = [];
var local_stored_annotations = [];

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

function refresh_annotations_list() {
	$("#annotations_list").empty();
	local_stored_annotations.forEach(function(el) {
		$("#annotations_list").append(composeAnnotationListRowElement(el));
	});
	hideAnnotations();
	showAnnotations();
	$(".grid_canvas_annotation").toggle(false);
}
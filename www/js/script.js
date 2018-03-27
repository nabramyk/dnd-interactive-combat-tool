//GRID VARS
var grid_size = 20;
var grid_count_width = 0;
var grid_count_height = 0;
var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,0,0,1)';
var temporary_line_color = '8c8c8c';
var grid_line_width = 2;

var selected_grid_x = -1
var selected_grid_y = -1;

var mouse_down_grid_x = -1;
var mouse_down_grid_y = -1;
var cursor_size = 1;

var update_interval = 0;

var x_vertices = [];
var y_vertices = [];

var grid_canvas, ctx;

var socket;

window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
	canvasApp();
}

function canvasSupport(e) {
	return !!e.getContext;
}

function canvasApp() {
	grid_canvas = document.getElementById('grid_canvas');
	start_new_line_button = document.getElementById('start_new_line_button');

	$("#movement_controls").hide();
	$("#reset_board_button").prop("disabled", true);
	$("#start_new_line_button").hide();
	$("#lost_connection_div").hide();

	ctx = grid_canvas.getContext('2d');

	if (!canvasSupport(grid_canvas)) {
		return;
	}

	socket = io();

	socket.on('disconnect', function() {
		$("#lost_connection_div").show();
		$("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
	});

	socket.on('connect', function(msg) {
		$("#lost_connection_div").hide();
		socket.emit('init', {});
	});

	socket.on('init', function(msg) {
		grid_count_height = msg.grid_height;
		resizeGridHeight(grid_count_height);
		grid_count_width = msg.grid_width;
		resizeGridWidth(grid_count_width);

		msg.elements.forEach(function(el) {
			draw_item(el.shape, el.x_coord, el.y_coord, el.color, Number(el.size));
		});

		refresh_elements_list();
	})

	socket.on('retrieve_elements_list', function(msg) {
		var filters = document.querySelectorAll(".element_filter:checked");
		var filter = [];
		for (var i = 0; i <= filters.length - 1; i++) {
			filter[i] = filters[i].value;
		}

		msg
			.filter(function(el) {
				return filter.includes(el.category);
			})
			.forEach(function(el) {
				$("#element_list").append(composeElementListRowElement(el));
			});
	})

	socket.on('resize_height', function(msg) {
		grid_count_height = msg.height;
		resizeGridHeight(grid_count_height);
	});

	socket.on('resize_width', function(msg) {
		grid_count_width = msg.width;
		resizeGridWidth(grid_count_width);
	});

	socket.on('added_element', function(msg) {
		$("#reset_board_button").prop("disabled", false);
		draw_item(msg.shape, msg.x_coord, msg.y_coord, msg.color, msg.size);
		$("#element_list").append(composeElementListRowElement(msg));
	});

	socket.on('removed_element', function(msg) {
		clear_item(msg.shape, msg.x_coord, msg.y_coord, msg.color, msg.size);
		$("#element_list>#" + msg.id).remove();
	});

	socket.on('move_element', function(msg) {
		clear_item(msg.element.shape, msg.from_x, msg.from_y, msg.element.color, msg.element.size);
		draw_item(msg.element.shape, msg.element.x_coord, msg.element.y_coord, msg.element.color, msg.element.size);
		if (msg.element.x_coord === selected_grid_x && msg.element.y_coord === selected_grid_y) {
			draw_cursor_at_position(selected_grid_x, selected_grid_y);
		}
	});

	socket.on('moving_element', function(msg) {
		clear_prev_cursor_position();
		redrawErasedElements(msg);
		draw_cursor_at_position(msg.x, msg.y);
	});

	socket.on('canvas_clicked', function(msg) {
		clear_prev_cursor_position();

		if (selected_grid_x === -1 && selected_grid_y === -1) {
			draw_cursor_at_position(msg.selected_grid_x, msg.selected_grid_y);
			return;
		}

		redrawErasedElements(msg);

		draw_cursor_at_position(msg.selected_grid_x, msg.selected_grid_y);
	});

	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;

	drawTopRuler();
	drawLeftRuler();

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

	// CLICK
	$("#grid_canvas").click(function(evt) {
		socket.emit('canvas_clicked', {
			"new_x": pixel2GridPoint(evt.offsetX - (evt.offsetX % grid_size)),
			"new_y": pixel2GridPoint(evt.offsetY - (evt.offsetY % grid_size)),
			"old_x": selected_grid_x,
			"old_y": selected_grid_y
		});
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
		}
	});

	$("#start_new_line_button").click(function() {
		if (selected_grid_x !== x_vertices[x_vertices.length - 1] || selected_grid_y !== y_vertices[y_vertices.length - 1]) {
			x_vertices.push(selected_grid_x);
			y_vertices.push(selected_grid_y);
		}

		if (x_vertices.length > 1 && y_vertices.length > 1)
			add_element($("#element_color").val(), x_vertices, y_vertices, $("#selected_shape").val(), null, null, $("#element_category").val());

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

		clear_item("line", [x_vertices[x_vertices.length - 1], selected_grid_x], [y_vertices[y_vertices.length - 1], selected_grid_y], {}, 0);

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

	$("#editing_controls_done").click(function() {
		edit_element_on_server(
			$("#edit_element_id").val(),
			$("#edit_name").val(),
			$("#edit_shape").val(),
			$("#edit_color").val(),
			$("#edit_size").val(),
			$("#edit_category").val()
		);
		$("#editing_controls").hide();
	});

	$("#editing_controls_cancel").click(function() {
		$("#editing_controls").hide();
	});

	$("#randomize").click(function() {
		socket.emit('randomize', {});
	});

	$(".element_filter").click(function() {
		refresh_elements_list();
	});

	drawScreen();
}

function incremental_move_element(direction) {
	socket.emit('move_element', {
		"x_coord": selected_grid_x,
		"y_coord": selected_grid_y,
		"direction": direction
	});
}

/*
 * Function for drawing the grid board
 */
function drawScreen() {
	ctx.lineWidth = grid_line_width;
	ctx.strokeStyle = grid_color;
	for (var i = 0; i < grid_count_height; i++) {
		for (var j = 0; j < grid_count_width; j++) {
			ctx.strokeRect(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		}
	}
}

function draw_item(shape, x_coord, y_coord, color, size) {
	switch (shape) {
		case "square":
			ctx.fillStyle = "#" + color;
			x = gridPoint2Pixel(x_coord) + grid_line_width * 2;
			y = gridPoint2Pixel(y_coord) + grid_line_width * 2;
			ctx.fillRect(x, y, size * grid_size - grid_line_width * 2, size * grid_size - grid_line_width * 2);
			break;
		case "circle":
			ctx.fillStyle = "#" + color;
			x = gridPoint2Pixel(x_coord) + grid_line_width;
			y = gridPoint2Pixel(y_coord) + grid_line_width;
			ctx.beginPath();
			ctx.arc(x + (grid_size / 2) * size, y + (grid_size / 2) * size, size * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
			ctx.fill();
			break;
		case "line":
			ctx.strokeStyle = "#" + color;
			ctx.beginPath();
			x = x_coord.map(function(e) {
				return gridPoint2Pixel(e)
			});
			y = y_coord.map(function(e) {
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

/**
 *	CLEAR ITEM
 */
function clear_item(shape, x_coord, y_coord, color, size) {
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	switch (shape) {
		case "square":
		case "circle":
			var x = gridPoint2Pixel(x_coord) + grid_line_width;
			var y = gridPoint2Pixel(y_coord) + grid_line_width;
			for (var i = 0; i < size; i++) {
				for (var n = 0; n < size; n++) {
					ctx.clearRect(x + i * grid_size, y + n * grid_size, grid_size, grid_size);
					ctx.strokeRect(x + i * grid_size, y + n * grid_size, grid_size, grid_size);
				}
			}
			break;
		case "line":
			/*
			for (var t = 1; t < x_coord.length; t++) {
				var grid_points = calculate_grid_points_on_line({
					"x": gridPoint2Pixel(x_coord[t - 1]),
					"y": gridPoint2Pixel(y_coord[t - 1])
				}, {
					"x": gridPoint2Pixel(x_coord[t]),
					"y": gridPoint2Pixel(y_coord[t])
				});
				grid_points
					.map(function(element) {
						return {
							"x": pixel2GridPoint(element.x),
							"y": pixel2GridPoint(element.y)
						};
					})
					.forEach(function(element) {
						clear_item("square", element.x, element.y, null, 1);
						var temp = live_objects.find(function(el) {
							return coordinate_comparison(el, {
								"x_coord": element.x,
								"y_coord": element.y
							});
						});
						if (typeof temp != 'undefined') {
							draw_item(temp.shape, temp.x_coord, temp.y_coord, temp.color, temp.size);
						}
					});
			}*/
			break;
	}

	if ($('#selected_shape').val() == "line") {
		$('#place_element_button').html("Add Vertex");
	} else {
		$('#place_element_button').html("Add Element");
	}
}

function clear_grid_space(point_x, point_y) {
	ctx.clearRect(gridPoint2Pixel(point_x) + grid_line_width, gridPoint2Pixel(point_y) + grid_line_width, grid_size, grid_size);
	ctx.strokeRect(gridPoint2Pixel(point_x) + grid_line_width, gridPoint2Pixel(point_y) + grid_line_width, grid_size, grid_size);
}

function clear_prev_cursor_position() {
	if (selected_grid_x === -1 || selected_grid_y == -1)
		return;

	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;

	clear_grid_space(selected_grid_x, selected_grid_y);
	clear_grid_space(selected_grid_x - 1, selected_grid_y);
	clear_grid_space(selected_grid_x, selected_grid_y - 1);
	clear_grid_space(selected_grid_x - 1, selected_grid_y - 1);
}

function draw_cursor_at_position(x, y) {

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
			ctx.lineWidth = grid_line_width;
			ctx.strokeStyle = grid_highlight;
			ctx.strokeRect(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, grid_size, grid_size);
			cursor_size = 1;
			break;
		case "line":
			ctx.fillStyle = grid_highlight;
			ctx.beginPath();
			ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
			ctx.fill();
	}

	$("#move_to_x").val(selected_grid_x);
	$("#move_to_y").val(selected_grid_y);
}

function add_element(color, x, y, shape, name, size, category) {
	add_element_to_server(color, x, y, shape, name, size, category);
}

function resizeGridWidth(width) {
	grid_count_width = width;
	$("#grid_size_horizontal").val(grid_count_width);
	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	drawScreen();
	drawTopRuler();
}

function resizeGridHeight(height) {
	grid_count_height = height;
	$("#grid_size_vertical").val(grid_count_height);
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
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

	$("#element_list").empty();

	if (filters.length !== 0)
		socket.emit('get_elements_list', {
			"filter": filter
		});
}

function composeElementListRowElement(el) {
	return "<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.x_coord + "," + el.y_coord + ")\" id=" + el.id + ">" +
		"<div style=\"width: 25%; display: inline-block;\">" +
		"<p style=\"font-size: smaller;\">" + el.name + "<\p>" +
		"</div>" +
		"<div style=\"width: 35%; display: inline-block;\">" +
		"<p style=\"font-size: smaller;\">" + el.category + "<\p>" +
		"</div>" +
		"<div style=\"width: 20%; display: inline-block;\">" +
		"<p style=\"font-size: smaller;\">X: " + el.x_coord +
		"\nY: " + el.y_coord + "</p>" +
		"</div>" +
		"<button id=\"element_row_edit\" onClick=\"edit_element_row(" + el.id + ",\'" + el.shape + "\'," + el.color + "," + el.size + ",\'" + el.category + "\',\'" + el.name + "\')\">&#x270E;</button>" +
		"<button id=\"element_row_delete\" onclick=\"delete_element_from_server(" + el.id + ")\">&times</button>" +
		"</div>";
}

function edit_element_row(id, shape, color, size, category, name) {
	$("#movement_controls").hide();
	$("#drawing_controls").hide();
	$("#settings_controls").hide();
	$("#editing_controls").show();

	$("#edit_element_id").val(id);
	$("#edit_shape").value = shape;
	$("#edit_color_changer").css("background", "#" + color);
	$("#edit_size").val(size);
	$("#edit_category").val(category);
	$("#edit_name").val(name);
}

function clicked_element_list(x, y) {
	clear_prev_cursor_position();
	draw_cursor_at_position(x, y);
}

function edit_properties_of_element(id, name) {
	edit_element_on_server(id, name);
}

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

/**
 * Liang-Barsky function by Daniel White
 * 
 * Used for checking for lines clipped within grid spaces NOTE: Slight
 * modification to the return value
 * 
 * @link http://www.skytopia.com/project/articles/compsci/clipping.html
 * 
 * @param {number}
 *            x0
 * @param {number}
 *            y0
 * @param {number}
 *            x1
 * @param {number}
 *            y1
 * @param {array
 *            <number>} bbox
 * @return {array<array<number>>|null}
 */
function liangBarsky(x0, y0, x1, y1, bbox) {
	var xmin = bbox[0],
		xmax = bbox[1],
		ymin = bbox[2],
		ymax = bbox[3];
	var t0 = 0,
		t1 = 1;
	var dx = x1 - x0,
		dy = y1 - y0;
	var p, q, r;

	for (var edge = 0; edge < 4; edge++) { // Traverse through left, right,
		// bottom, top edges.
		if (edge === 0) {
			p = -dx;
			q = -(xmin - x0);
		}
		if (edge === 1) {
			p = dx;
			q = (xmax - x0);
		}
		if (edge === 2) {
			p = -dy;
			q = -(ymin - y0);
		}
		if (edge === 3) {
			p = dy;
			q = (ymax - y0);
		}

		r = q / p;

		if (p === 0 && q < 0) return null; // Don't draw line at all. (parallel
		// line outside)

		if (p < 0) {
			if (r > t1) return null; // Don't draw line at all.
			else if (r > t0) t0 = r; // Line is clipped!
		} else if (p > 0) {
			if (r < t0) return null; // Don't draw line at all.
			else if (r < t1) t1 = r; // Line is clipped!
		}
	}

	return [
		[x0 + t0 * dx, x0 + t1 * dx],
		[y0 + t0 * dy, y0 + t1 * dy]
	];
}

function redrawErasedElements(msg) {
	msg.elements.forEach(function(el) {
		if (el.element.shape === 'line-segment') {
			var bbox = [gridPoint2Pixel(el.bbox.x_coord), gridPoint2Pixel(el.bbox.x_coord + 1),
				gridPoint2Pixel(el.bbox.y_coord), gridPoint2Pixel(el.bbox.y_coord + 1)
			];
			var temp = liangBarsky(gridPoint2Pixel(el.element.x_coord[0]),
				gridPoint2Pixel(el.element.y_coord[0]),
				gridPoint2Pixel(el.element.x_coord[1]),
				gridPoint2Pixel(el.element.y_coord[1]),
				bbox);
			ctx.strokeStyle = "#" + el.element.color;
			ctx.beginPath();
			ctx.moveTo(temp[0][0] + grid_line_width, temp[1][0] + grid_line_width);
			ctx.lineTo(temp[0][1] + grid_line_width, temp[1][1] + grid_line_width);
			ctx.stroke();
		} else
			draw_item(el.element.shape, el.element.x_coord, el.element.y_coord, el.element.color, el.element.size);
	});
}

function pixel2GridPoint(raw_location) {
	return 1 + (raw_location - (raw_location % grid_size)) / grid_size;
}

function gridPoint2Pixel(grid_point) {
	return (grid_point - 1) * grid_size;
}
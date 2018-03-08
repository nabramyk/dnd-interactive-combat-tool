//GRID VARS
var grid_size = 20;
var grid_count_width = 30;
var grid_count_height = 24;
var canvas_padding = 5;
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
var live_objects = [];
var temporary_changed_objects = [];

window.addEventListener('load', eventWindowLoaded, false);
console.log(window.location.href);

function eventWindowLoaded() {
	canvasApp();
	update();
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

	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;

	drawTopRuler();
	drawLeftRuler();

	$("#grid_canvas_scrolling_container").scroll(function() {
		$("#ruler_top_scrolling_container").scrollLeft($("#grid_canvas_scrolling_container").scrollLeft());
		$("#ruler_left_scrolling_container").scrollTop($("#grid_canvas_scrolling_container").scrollTop());
	});

	//$("#element_list").css("height", grid_canvas.height + "px");

	$("#grid_size_vertical").val(grid_count_height);
	$("#grid_size_horizontal").val(grid_count_width);

	$("#grid_size_vertical").change(function() {
		grid_count_height = $("#grid_size_vertical").val();
		changeGridSize()
			.done(function(data) {
				resizeGridHeight(data.height);
			})
			.fail(function(error) {
				console.log(error);
			});
	});

	$("#grid_size_horizontal").change(function() {
		grid_count_width = $("#grid_size_horizontal").val();
		changeGridSize()
			.done(function(data) {
				resizeGridWidth(data.width);
			})
			.fail(function(error) {
				console.log(error);
			});
	});

	/**
	 *	MOUSE DOWN
	 */
	$("#grid_canvas").mousedown(function(evt) {
		var x_snap_to_grid = evt.offsetX - (evt.offsetX % grid_size);
		var y_snap_to_grid = evt.offsetY - (evt.offsetY % grid_size);

		if ((selected_grid_x != x_snap_to_grid || selected_grid_y != y_snap_to_grid) && (selected_grid_x != -1 && selected_grid_y != -1))
			clear_previous_cursor_position();

		//Drawing temporary lines before sending the line to the server
		if ($("#selected_shape").val() == "line" && x_vertices.length > 0 && y_vertices.length > 0) {

			var temp = calculate_grid_points_on_line({
				"x": x_vertices.slice(x_vertices.length - 1),
				"y": y_vertices.slice(y_vertices.length - 1)
			}, {
				"x": selected_grid_x,
				"y": selected_grid_y
			});

			var x = x_vertices.slice(x_vertices.length - 1).concat(selected_grid_x);
			var y = y_vertices.slice(y_vertices.length - 1).concat(selected_grid_y);
			clear_item("line", x, y, $("#element_color").val(), 1);
			temp.forEach(function(el, ind, arr) {
				check_for_clipped_regions([el.x, el.y], [{
					"x_coord": x_vertices,
					"y_coord": y_vertices,
					"shape": "line",
					"color": temporary_line_color
				}]);
				var object_that_needs_to_be_redrawn = live_objects.find(function(e) {
					return coordinate_comparison({
						"x_coord": el.x,
						"y_coord": el.y
					}, e);
				});
				if (typeof object_that_needs_to_be_redrawn !== 'undefined')
					draw_item(object_that_needs_to_be_redrawn.shape, object_that_needs_to_be_redrawn.x_coord, object_that_needs_to_be_redrawn.y_coord, object_that_needs_to_be_redrawn.color, object_that_needs_to_be_redrawn.size);
			});
			draw_item("line", x_vertices.slice(x_vertices.length - 1).concat(pixel2GridPoint(x_snap_to_grid)), y_vertices.slice(y_vertices.length - 1).concat(pixel2GridPoint(y_snap_to_grid)), temporary_line_color, null);
		}

		draw_cursor_at_position(pixel2GridPoint(x_snap_to_grid), pixel2GridPoint(y_snap_to_grid));

		mouse_down_grid_x = x_snap_to_grid;
		mouse_down_grid_y = y_snap_to_grid;
	});

	//MOUSE UP
	$("#grid_canvas").mouseup(function(evt) {

		var x_snap_to_grid = evt.offsetX - (evt.offsetX % grid_size);
		var y_snap_to_grid = evt.offsetY - (evt.offsetY % grid_size);

		// Exit this function if the mouse is released within the same grid element
		// it was activated in
		if (x_snap_to_grid === mouse_down_grid_x && y_snap_to_grid === mouse_down_grid_y)
			return;

		$("#move_element_x").val(1 + x_snap_to_grid / grid_size);
		$("#move_element_y").val(1 + y_snap_to_grid / grid_size);

		// Clear the last grid space and redraw
		clear_previous_cursor_position();

		// Outline the selected grid space, depending on the style of element to be
		// drawn
		draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);

		mouse_down_grid_x = -1;
		mouse_down_grid_y = -1;
	});

	$('#place_element_button').click(function() {
		if(selected_grid_x < 1 || selected_grid_x > grid_count_width || selected_grid_y < 0 || selected_grid_y > grid_count_height) 
			return
		
		if ($("#place_element_button").html() == "Add Element" || $("#place_element_button").html() == "Add Vertex") {
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
		} else if ($("#place_element_button").html() == "Delete Element") {
			delete_element(selected_grid_x, selected_grid_y);
		}
	});

	$('#reset_board_button').click(function() {
		if (confirm("This will delete EVERYTHING on the board.\nAre you sure you want to do this?")) {
			live_objects.forEach(function(element) {
				delete_element_from_server(element.id);
			});
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

	$('#move_button').click(function() {
		live_objects.find(function(el, ind, arr) {
			if (el.x_coord == selected_grid_x && el.y_coord == selected_grid_y) {
				var move_to_color = el.color;
				var move_to_x = el.x_coord;
				var move_to_y = el.y_coord;
				var move_to_shape = el.shape;
				selected_grid_x = ($("#move_to_x").val() - 1) * grid_size;
				selected_grid_y = ($("#move_to_y").val() - 1) * grid_size;
				move_element(move_to_color, {
						"x": move_to_x,
						"y": move_to_y
					}, {
						"x": selected_grid_x,
						"y": selected_grid_y
					},
					move_to_shape);
			}
		});
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

		clear_previous_cursor_position();
		draw_cursor_at_position(selected_grid_x, selected_grid_y);
	});

	$("#drawing_controls_button").click(function() {
		$("#drawing_controls").toggle();
		$("#movement_controls").hide();
		$("#settings_controls").hide();
	});

	$("#movement_controls_button").click(function() {
		$("#movement_controls").toggle();
		$("#drawing_controls").hide();
		$("#settings_controls").hide();
	});

	$("#settings_controls_button").click(function() {
		$("#settings_controls").toggle();
		$("#drawing_controls").hide();
		$("#movement_controls").hide();
	});

	$("#randomize").click(function() {
		for (var w = 0; w < grid_count_width; w++) {
			for (var h = 0; h < grid_count_height; h++) {
				if (Math.random() < 0.5) {
					add_element("000000", w + 1, h + 1, "square", "rando" + h * w, 1, "environment");
				}
			}
		}
	});

	$(".element_filter").click(function() {
		refresh_elements_list();
	});

	drawScreen();
}

function incremental_move_element(direction) {
	if (typeof selected_grid_x == 'undefined' || typeof selected_grid_y == 'undefined')
		return;

	move_element_on_server(selected_grid_x, selected_grid_y, direction)
		.done(function(data) {
			clear_previous_cursor_position();
			draw_cursor_at_position(data.position_x, data.position_y);
		})
		.fail(function(error) {
			console.log(error);
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
					check_for_clipped_regions([x_coord + i * grid_size, y_coord], live_objects.filter(function(element) {
						return element.shape === "line";
					}));
				}
			}
			break;
		case "line":
			for (var t = 1; t < x_coord.length; t++) {
				var grid_points = calculate_grid_points_on_line({
					"x": gridPoint2Pixel(x_coord[t - 1]),
					"y": gridPoint2Pixel(y_coord[t - 1])
				}, {
					"x": gridPoint2Pixel(x_coord[t]),
					"y": gridPoint2Pixel(y_coord[t])
				});
				grid_points
					.map(function(element) { return { "x" : pixel2GridPoint(element.x), "y" : pixel2GridPoint(element.y) }; })
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
			}
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

function clear_previous_cursor_position() {

	if (selected_grid_x === -1 || selected_grid_y == -1)
		return;

	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;

	for (var i = 0; i <= cursor_size - 1; i++) {
		for (var n = 0; n <= cursor_size - 1; n++) {
			clear_grid_space(selected_grid_x + i, selected_grid_y + n);
		}
	}

	// Clear the selected position
	clear_grid_space(selected_grid_x, selected_grid_y);
	clear_grid_space(northwest()[0], northwest()[1]);
	clear_grid_space(west()[0], west()[1]);
	clear_grid_space(north()[0], north()[1]);

	live_objects.forEach(function(el) {
		if (((el.x_coord <= selected_grid_x && el.x_coord * el.size >= selected_grid_x) && (el.y_coord <= selected_grid_y && el.y_coord * el.size >= selected_grid_y)) ||
			coordinate_comparison(el, {
				"x_coord": north()[0],
				"y_coord": north()[1]
			}) ||
			coordinate_comparison(el, {
				"x_coord": west()[0],
				"y_coord": west()[1]
			}) ||
			coordinate_comparison(el, {
				"x_coord": northwest()[0],
				"y_coord": northwest()[1]
			})) {
			draw_item(el.shape, el.x_coord, el.y_coord, el.color, el.size);
		}
	});

	var lines = live_objects.filter(function(element) {
		return element.shape === "line";
	});
	check_for_clipped_regions(center(), lines);
	check_for_clipped_regions(north(), lines);
	check_for_clipped_regions(northwest(), lines);
	check_for_clipped_regions(west(), lines);
	check_for_clipped_regions(southwest(), lines);
	check_for_clipped_regions(south(), lines);
	check_for_clipped_regions(southeast(), lines);
	check_for_clipped_regions(east(), lines);
	check_for_clipped_regions(northeast(), lines);
	check_for_clipped_regions(east2(), lines);

	lines = [{
		"shape": "line",
		"x_coord": x_vertices,
		"y_coord": y_vertices,
		"color": temporary_line_color
	}];
	
	check_for_clipped_regions(center(), lines);
	check_for_clipped_regions(west(), lines);
	check_for_clipped_regions(north(), lines);
	check_for_clipped_regions(northwest(), lines);
}

function north() {
	return [selected_grid_x, selected_grid_y - 1];
}

function east() {
	return [selected_grid_x + 1, selected_grid_y];
}

function east2() {
	return [selected_grid_x + 1 * 2, selected_grid_y];
}

function west() {
	return [selected_grid_x - 1, selected_grid_y];
}

function south() {
	return [selected_grid_x, selected_grid_y + 1];
}

function northeast() {
	return [selected_grid_x + 1, selected_grid_y - 1];
}

function northwest() {
	return [selected_grid_x - 1, selected_grid_y - 1];
}

function southeast() {
	return [selected_grid_x + 1, selected_grid_y + 1];
}

function southwest() {
	return [selected_grid_x - 1, selected_grid_y + 1];
}

function center() {
	return [selected_grid_x, selected_grid_y];
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
	live_objects.forEach(function(element) {
		draw_item(element.shape, element.x_coord, element.y_coord, element.color, element.size);
	});
	drawTopRuler();
}

function resizeGridHeight(height) {
	grid_count_height = height;
	$("#grid_size_vertical").val(grid_count_height);
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	drawScreen();
	live_objects.forEach(function(element) {
		draw_item(element.shape, element.x_coord, element.y_coord, element.color, element.size);
	});
	drawLeftRuler();
}

//SERVER COMMUNICATION FUNCTIONS
//All AJAX and JSON bullshit goes here and NEVER LEAVES HERE!
function update() {
	$.ajax({
			type: "POST",
			url: window.location.href + "update",
			data: {
				'live_objects': JSON.stringify(live_objects)
			},
			dataType: 'json',
		})
		.done(function(result) {
			$("#lost_connection_div").hide();
			var data_updated = false;
			var server_grid_size = result.shift();
			if (server_grid_size.width != grid_count_width) resizeGridWidth(server_grid_size.width);
			if (server_grid_size.height != grid_count_height) resizeGridHeight(server_grid_size.height);
			result.forEach(function(element, ind, arr) {
				var x = element.item.x_coord;
				var y = element.item.y_coord;
				if (element.action === "erase") {
					live_objects.find(function(el, ind, arr) {
						if (el === undefined)
							return;
						if (coordinate_comparison(el, element.item)) {
							arr.splice(ind, 1);
							clear_previous_cursor_position();
							clear_item(el.shape, x, y, el.color, el.size);
							data_updated = true;
							draw_cursor_at_position(selected_grid_x, selected_grid_y);
						}
					});
				} else if (element.action === "add") {
					live_objects.push({
						"id": element.item.id,
						"shape": element.item.shape,
						"x_coord": x,
						"y_coord": y,
						"color": element.item.color,
						"name": element.item.name,
						"size": element.item.size,
						"category": element.item.category
					});
					live_objects.sort(function(pre, post) {
						return pre.id - post.id;
					});
					if (coordinate_comparison(element.item, {
							"x_coord": selected_grid_x,
							"y_coord": selected_grid_y
						})) {
						clear_previous_cursor_position();
						draw_cursor_at_position(selected_grid_x, selected_grid_y);
					}
					draw_item(element.item.shape, x, y, element.item.color, element.item.size);
					data_updated = true;
				} else if (element.action === "rename") {
					live_objects.find(function(el, ind, arr) {
						if (coordinate_comparison(el, element.item)) {
							live_objects[ind].name = element.item.name;
							data_updated = true;
						}
					});
				}
			});

			if (data_updated)
				refresh_elements_list();

			if (live_objects.length === 0)
				$('#reset_board_button').prop("disabled", true);
			else
				$('#reset_board_button').prop("disabled", false);

			setTimeout(update(), update_interval);
		})
		.fail(function(error) {
			$("#lost_connection_div").show();
			$("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
			setTimeout(update(), update_interval);
		});
}

function add_element_to_server(color, x, y, shape, name, size, category) {
	$.ajax({
		type: "POST",
		url: window.location.href + "add_element",
		data: {
			"color": color,
			"x_coord": JSON.stringify(x),
			"y_coord": JSON.stringify(y),
			"object_type": shape,
			"name": name,
			"size": size,
			"category": category
		},
		dataType: 'json',
		success: function(result) {
			return;
		},
		error: function(status, error) {
			if (error == 'parsererror')
				return
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function delete_element_from_server(id) {
	$.ajax({
		type: "POST",
		url: window.location.href + "delete_element",
		data: {
			"id": JSON.stringify(id)
		},
		dataType: 'json',
		success: function(result) {
			return;
		},
		error: function(status, error) {
			if (error == 'parsererror')
				return
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function rename_element(id, name) {
	$.ajax({
		type: "POST",
		url: window.location.href + "rename_element",
		data: {
			"id": JSON.stringify(id),
			"name": name
		},
		dataType: 'json',
		success: function(result) {
			return;
		},
		error: function(status, error) {
			if (error == 'parsererror')
				return
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function move_element_on_server(from_x, from_y, direction) {
	return $.ajax({
		type: "POST",
		url: window.location.href + "move_element",
		data: {
			"from_x": JSON.stringify(from_x),
			"from_y": JSON.stringify(from_y),
			"direction": direction
		},
		dataType: 'json'
	});
}

function undo_action() {
	return $.ajax({
		type: "POST",
		url: window.location.href + "undo_action"
	});
}

function redo_action() {
	return $.ajax({
		type: "POST",
		url: window.location.href + "redo_action"
	});
}

function changeGridSize() {
	return $.ajax({
		type: "POST",
		url: window.location.href + "resize_grid",
		data: {
			"width": grid_count_width,
			"height": grid_count_height
		},
		dataType: 'json',
	});
}

function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}

//MATH FUNCTIONS
function calculate_grid_points_on_line(starting_point, ending_point) {
	var grid_points = [];
	var m, b, y_val;

	//Swap the points if the x value at the end is smaller than the starting x value
	if (ending_point.x < starting_point.x) {
		var temp = starting_point;
		starting_point = ending_point;
		ending_point = temp;
	}

	m = (ending_point.y - starting_point.y) / (ending_point.x - starting_point.x);
	b = starting_point.y - m * starting_point.x;

	if (!isFinite(m)) {
		var _start, _end;
		if (starting_point.y < ending_point.y) {
			_start = starting_point.y;
			_end = ending_point.y;
		} else {
			_start = ending_point.y;
			_end = starting_point.y;
		}
		for (; _start < _end; _start = _start + grid_size) {
			grid_points.push({
				"x": starting_point.x,
				"y": _start
			});
		}
	} else
		for (var x_val = starting_point.x; x_val <= ending_point.x; x_val++) {
			y_val = m * x_val + b;
			var xy_pair = {
				"x": (x_val - (x_val % grid_size)),
				"y": (y_val - (y_val % grid_size))
			};

			if (grid_points.length === 0) {
				grid_points.push(xy_pair);
				continue;
			}

			for (var i = 0; i < grid_points.length; i++) {
				if (xy_pair.x === grid_points[i].x && xy_pair.y === grid_points[i].y)
					break;
				else if (i == grid_points.length - 1)
					grid_points.push(xy_pair);
			}
		}
	return grid_points;
}

function check_for_clipped_regions(grid_location, lines) {
	[grid_x, grid_y] = grid_location;

	//Execute function for each set of line segments
	lines.forEach(function(element, ind, arr) {

		var vertices_x = element.x_coord;
		var vertices_y = element.y_coord;
		for (var i = 1; i < vertices_x.length; i++) {

			var grid_points = calculate_grid_points_on_line({
				"x": gridPoint2Pixel(vertices_x[i - 1]),
				"y": gridPoint2Pixel(vertices_y[i - 1])
			}, {
				"x": gridPoint2Pixel(vertices_x[i]),
				"y": gridPoint2Pixel(vertices_y[i])
			});
						
			grid_points
				.map(function(el) { return { "x" : pixel2GridPoint(el.x), "y" : pixel2GridPoint(el.y) } })
				.forEach(function(el, ind, arr) {
				if (el.x == grid_x && el.y == grid_y) {
					var line_segment = liangBarsky(vertices_x[i - 1], vertices_y[i - 1], vertices_x[i], vertices_y[i], [el.x, el.x + grid_size, el.y, el.y + grid_size]);
					draw_item(element.shape, line_segment[0], line_segment[1], element.color);
				}
			});
		}
	});
}

function refresh_elements_list() {
	var filters = $(".element_filter")
		.filter(function(_, el) {
			return el.checked
		})
		.map(function(_, el) {
			return el.value
		})
		.toArray();

	$("#element_list").empty();

	live_objects
		.filter(function(el) {
			return filters.findIndex(
				function(e) {
					return e == el.category;
				}) != -1;
		})
		.forEach(function(el, ind, arr) {
			$("#element_list").append("<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.id + ")\">" +
				"<input type=\"text\" value=\"" + el.name + "\" onkeypress=\"change_name_of_element(event," + el.id + ",this.value)\">" +
				"<button onclick=\"delete_element_from_server(" + el.id + ")\" class=\"destructive\">&times</button><br>" +
				"<div contenteditable=false>Position<br>X: " + el.x_coord + "<br>Y: " + el.y_coord + "</div>" +
				el.category +
				"</div>");
		});
}

function clicked_element_list(id) {
	clear_previous_cursor_position();
	var temp = live_objects.find(function(el) {
		return el.id === id;
	});
	if (temp.shape === "line") {

	} else {
		draw_cursor_at_position(temp.x_coord, temp.y_coord);
	}
}

function change_name_of_element(evt, id, name) {
	if (evt.which == 13) {
		var temp = live_objects.find(function(el) {
			return el.id == id;
		});
		if (typeof(temp) !== undefined) {
			rename_element(id, name);
		}
	}
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

// /**
//  * Liang-Barsky function by Daniel White 
//  * 
//  * Used for checking for lines clipped within grid spaces
//  * NOTE: Slight modification to the return value
//  * 
//  * @link http://www.skytopia.com/project/articles/compsci/clipping.html
//  *
//  * @param  {number}        x0
//  * @param  {number}        y0
//  * @param  {number}        x1
//  * @param  {number}        y1
//  * @param  {array<number>} bbox
//  * @return {array<array<number>>|null}
//  */
function liangBarsky(x0, y0, x1, y1, bbox) {
	var [xmin, xmax, ymin, ymax] = bbox;
	var t0 = 0,
		t1 = 1;
	var dx = x1 - x0,
		dy = y1 - y0;
	var p, q, r;

	for (var edge = 0; edge < 4; edge++) { // Traverse through left, right, bottom, top edges.
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

		if (p === 0 && q < 0) return null; // Don't draw line at all. (parallel line outside)

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

function coordinate_comparison(obj_1, obj_2) {
	if (obj_1.x_coord instanceof Array)
		return obj_1.x_coord.every(function(u, i) {
				return u === obj_2.x_coord[i];
			}) &&
			obj_1.y_coord.every(function(u, i) {
				return u === obj_2.y_coord[i];
			});
	else
		return obj_1.x_coord === obj_2.x_coord && obj_1.y_coord === obj_2.y_coord;
}

function pixel2GridPoint(raw_location) {
	return 1 + (raw_location - (raw_location % grid_size)) / grid_size;
}

function gridPoint2Pixel(grid_point) {
	return (grid_point - 1) * grid_size;
}
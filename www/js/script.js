//GRID VARS
var grid_size = 20;
var grid_count_width = 30;
var grid_count_height = 24;
var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,0,0,1)';
var grid_line_width = 2;

var selected_grid_x = -1 
var selected_grid_y = -1;

var mouse_down_grid_x = -1;
var mouse_down_grid_y = -1;

var update_interval = 200;

var line_interval_id = 0;
var x_vertices = [];
var y_vertices = [];

//GUI Elements
var grid_canvas, 
	ctx, 
	place_element_button,
	clear_element_button,
	reset_board_button,
	place_vertex_button,
	start_new_line_button,
	move_button,
	move_element_x,
	move_element_y,
	incremental_move_up,
	incremental_move_down,
	incremental_move_left,
	incremental_move_right,
	selected_shape;

var live_objects = new Array();

window.addEventListener('load', eventWindowLoaded, false);
console.log(window.location.href);

function redraw_line(element) {
	var vertices_x = JSON.parse(element.x_coord);
	var vertices_y = JSON.parse(element.y_coord);
	var m, b, y_val, region;
	for(var i=1; i < vertices_x.length; i++) {
		var grid_points = calculate_grid_points_on_line({ "x" : vertices_x[i-1], "y" : vertices_y[i-1]},
														{ "x" : vertices_x[i], "y" : vertices_y[i]});
		grid_points.find( function(el,ind,arr) {
			if((el.x >= selected_grid_x - grid_size && el.x <= selected_grid_x + grid_size) 
					&& (el.y >= selected_grid_y - grid_size && el.y <= selected_grid_y + grid_size)) {
				draw_item({ "color" : element.color,
					"x_coord" : JSON.stringify([vertices_x[i-1],vertices_x[i]]),
					"y_coord" : JSON.stringify([vertices_y[i-1],vertices_y[i]]),
					"shape" : element.shape });
			}
		});
	}
}

function calculate_grid_points_on_line(starting_point, ending_point) {
	var start = starting_point;
	var end = ending_point;
	var grid_points = [];
	var m, b, y_val;
	
	m = (ending_point.y - starting_point.y) / (ending_point.x - starting_point.x);
	b = starting_point.y - m * starting_point.x;
	
	if(m === -Infinity || m === Infinity)
		for(y_val = starting_point.y; y_val < ending_point.y; y_val = y_val + grid_size) {
			grid_points.push({ "x" : starting_point.x, "y" : y_val });
		}
	else
		for(var x_val = starting_point.x; x_val <= ending_point.x; x_val++) {
			y_val = m * x_val + b;
			var xy_pair = { "x" : (x_val  - (x_val % grid_size)), "y" : (y_val - (y_val % grid_size))};
			
			if(grid_points.length==0) {
				grid_points.push(xy_pair);
				continue;
			}
			
			for(var i=0; i<grid_points.length; i++) {
				if(xy_pair.x === grid_points[i].x && xy_pair.y === grid_points[i].y)
					break; 
				else if(i == grid_points.length-1)
					grid_points.push(xy_pair);
			}
		}
	console.log(grid_points);
	return grid_points;
}

function eventWindowLoaded() {
	canvasApp();
	var v = setInterval(update, update_interval);
}

function canvasSupport(e) {
	return !!e.getContext;
}

function canvasApp() {
	
	grid_canvas = document.getElementById('grid_canvas');
	place_element_button = document.getElementById('place_element_button');
	clear_element_button = document.getElementById('clear_element_button');
	reset_board_button = document.getElementById('reset_board_button');
	place_vertex_button = document.getElementById('place_vertex_button');
	start_new_line_button = document.getElementById('start_new_line_button');
	move_button = document.getElementById('move_button');
	move_element_x = document.getElementById('move_to_x');
	move_element_y = document.getElementById('move_to_y');
	incremental_move_up = document.getElementById('move_inc_up');
	incremental_move_down = document.getElementById('move_inc_down');
	incremental_move_left = document.getElementById('move_inc_left');
	incremental_move_right = document.getElementById('move_inc_right');
	selected_shape = document.getElementById('selected_shape');
	
	ctx = grid_canvas.getContext('2d');

	if (!canvasSupport(grid_canvas)) {
		return;
	}

	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	
	grid_canvas.addEventListener('mousedown', function(event) { canvas_mouse_down(event) }, false);
	
	grid_canvas.addEventListener('mouseup', function(event) { canvas_mouse_up(event) }, false);
	
	grid_canvas.addEventListener('mousemove', function(event) {
		if (document.getElementById('on_hover_highlight').checked == true) {
			console.log('X:' + event.offsetX + ', Y: ' + event.offsetY);
			var mouse_x = event.offsetX;
			var mouse_y = event.offsetY;
			var x_snap_to_grid = mouse_x - (mouse_x % grid_size);
			var y_snap_to_grid = mouse_y - (mouse_y % grid_size);
			ctx.fillStyle = "#CCFF33";
			ctx.fillRect(x_snap_to_grid, y_snap_to_grid, 5, 5);
		}
	})

	place_element_button.addEventListener('click', function(event) {
		send_element_to_server({ "color" : document.getElementById("element_color").value,
								"x_coord" : selected_grid_x, 
								"y_coord" : selected_grid_y,
								"object_type" : document.getElementById("selected_shape").value });
	}, false);

	
	clear_element_button.addEventListener('click', function(event) {
		live_objects.forEach(function(element) {
			if(element.x_coord == selected_grid_x && element.y_coord == selected_grid_y)
				send_element_to_server({ "color" : element.color, 
										"x_coord" : element.x_coord, 
										"y_coord" : element.y_coord, 
										"object_type" : element.shape });
		});
	}, false);
	
	reset_board_button.addEventListener('click', function(element) {
		live_objects.forEach(function(element) {
				send_element_to_server({ "color" : element.color, 
										"x_coord" : element.x_coord, 
										"y_coord" : element.y_coord, 
										"object_type" : element.shape });
		});
	}, false);
	
	place_vertex_button.addEventListener('click', function(event) {
		x_vertices.push(selected_grid_x);
		y_vertices.push(selected_grid_y);
	}, false);
	
	start_new_line_button.addEventListener('click', function(event) {
		send_element_to_server({ "color" : document.getElementById("element_color").value,
								"x_coord" : JSON.stringify(x_vertices),
								"y_coord" : JSON.stringify(y_vertices),
								"object_type" : document.getElementById("selected_shape").value });
		line_interval_id++;
		x_vertices = [];
		y_vertices = [];
	}, false);
	
	move_button.addEventListener('click', function(event) {
		live_objects.find(function(el,ind,arr) {
			if(el.x_coord == selected_grid_x && el.y_coord == selected_grid_y) {
				var move_to_color = el.color;
				var move_to_x = el.x_coord;
				var move_to_y = el.y_coord;
				var move_to_shape = el.shape;
				send_element_to_server({ "color" : move_to_color,
										"x_coord" : move_to_x,
										"y_coord" : move_to_y,
										"object_type" : move_to_shape });
				send_element_to_server({ "color" : move_to_color,
										"x_coord" : (move_element_x.value - 1) * grid_size,
										"y_coord" : (move_element_y.value - 1) * grid_size,
										"object_type" : move_to_shape });
			}
		});
	}, false);
	
	incremental_move_up.addEventListener('click', function(event) {
		incremental_move_element("up");
	}, false);
	
	incremental_move_down.addEventListener('click', function(event) {
		incremental_move_element("down");
	}, false);
	
	incremental_move_left.addEventListener('click', function(event) {
		incremental_move_element("left");
	}, false);

	incremental_move_right.addEventListener('click', function(event) {
		incremental_move_element("right");
	}, false);
	
	selected_shape.addEventListener('change', function(event) {
		if(selected_grid_x == -1 && selected_grid_y == -1)
			return;
		clear_previous_cursor_position();
		redraw_live_objects();
		draw_cursor_at_position(selected_grid_x, selected_grid_y);
		console.log("on change");
	}, false);
	drawScreen();
}

function incremental_move_element(direction) {
	live_objects.find(function(el,ind,arr) {
		if(el.x_coord == selected_grid_x && el.y_coord == selected_grid_y) {
			var move_to_color = el.color;
			var move_to_x = el.x_coord;
			var move_to_y = el.y_coord;
			var move_to_shape = el.shape;
			
			if(direction=="right") {
				move_element_x.value++;
				selected_grid_x = (move_element_x.value - 1) * grid_size;
			}
			else if(direction=="left") {
				move_element_x.value--;
				selected_grid_x = (move_element_x.value - 1) * grid_size;
			}
			else if(direction=="up") {
				move_element_y.value--;
				selected_grid_y = (move_element_y.value - 1) * grid_size;	
			}
			else if(direction=="down") {
				move_element_y.value++;
				selected_grid_y = (move_element_y.value - 1) * grid_size;	
			}
			
			send_element_to_server({ "color" : move_to_color,
									"x_coord" : move_to_x,
									"y_coord" : move_to_y,
									"object_type" : move_to_shape });
			send_element_to_server({ "color" : move_to_color,
									"x_coord" : (move_element_x.value - 1) * grid_size,
									"y_coord" : (move_element_y.value - 1) * grid_size,
									"object_type" : move_to_shape });
			
			for(var i=0; i<live_objects.length; i++) {
				if(live_objects[i].shape == "line") {
					redraw_line(live_objects[i]);
				}
			}
			
			draw_cursor_at_position(selected_grid_x, selected_grid_y);
		}
	});
}

/* Function for drawing the grid board
 * 
 */
function drawScreen() {
	ctx.lineWidth = grid_line_width;
	ctx.strokeStyle = grid_color;
	for(var i=0; i<grid_count_height; i++) {
		for(var j=0; j<grid_count_width; j++) {
			ctx.strokeRect(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		}
	}
}

function send_element_to_server(item_to_send) {	
	$.ajax({
		type : "POST",
		url : window.location.href + "push_change",
		data : 	item_to_send,
		dataType : 'json',
		success : function(result) {
			return;
		},
		error : function(status, error) {
			if(error == 'parsererror')
				return
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function check_for_clipped_regions() {
	draw_cursor_at_position(selected_grid_x, selected_grid_y);
	
}

function update() {
	$.ajax({
		type : "POST",
		url : window.location.href + "update",
		data : {
			'live_objects' : JSON.stringify(live_objects)
		},
		dataType : 'json',
		success : function(result) {
			for (var i = 0; i < result.length; i++) {			
				if (result[i].action == "erase") {
					live_objects.find(function(el, ind, arr) {
						if (JSON.stringify(el) == JSON.stringify(result[i].item)) {
							clear_item(result[i].item);
							arr.splice(ind, 1);
							check_for_clipped_regions();
						}
					});
				} else if (result[i].action == "add") {
					live_objects.push(result[i].item);
					draw_item(result[i].item);
				}
			}
		},
		error : function(status, error) {
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function draw_item(item) {
	switch(item.shape) {
		case "square":
			ctx.fillStyle = item.color;
			var x = parseInt(item.x_coord) + grid_line_width;
			var y = parseInt(item.y_coord) + grid_line_width;
			ctx.fillRect(x + grid_line_width, y + grid_line_width, grid_size - grid_line_width * 2, grid_size - grid_line_width * 2);
			break;
		case "circle":
			ctx.fillStyle = item.color;
			var x = parseInt(item.x_coord) + grid_line_width;
			var y = parseInt(item.y_coord) + grid_line_width;
			ctx.beginPath();
			ctx.arc(x + (grid_size / 2), y + (grid_size / 2), (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
			ctx.fill();
			break;
		case "line":
			ctx.strokeStyle = item.color;
			ctx.beginPath();
			var x = JSON.parse(item.x_coord);
			var y = JSON.parse(item.y_coord);
			ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
			for(var i=1; i < x.length; i++) {
				ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
			}
			ctx.stroke();
			break;
	}
}


function clear_item(item) {
	switch(item.shape) {
		case "square":
		case "circle":
			ctx.strokeStyle = grid_color;
			ctx.lineWidth = grid_line_width;
			var x = parseInt(item.x_coord) + grid_line_width;
			var y = parseInt(item.y_coord) + grid_line_width;
			ctx.clearRect(x, y, grid_size, grid_size);
			ctx.strokeRect(x, y, grid_size, grid_size);
			break;
		case "line":
			ctx.strokeStyle = grid_color;
			ctx.lineWidth = grid_line_width;
			var x = JSON.parse(item.x_coord);
			var y = JSON.parse(item.y_coord);
			for(var i=1; i < x.length; i++) {
				var grid_points = calculate_grid_points_on_line({ "x" : x[i-1], "y" : y[i-1]},
																{ "x" : x[i], "y" : y[i]});
				grid_points.forEach(function(element) {
					clear_item({"shape":"square","x_coord":element.x,"y_coord":element.y});
				});
			}
			break;
	}
}

function clear_previous_cursor_position() {
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	//Clear the selected position
	ctx.clearRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width, grid_size, grid_size);
	//Clear the position to the top left of the selected position
	ctx.clearRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	//Clear the position left of this the selected postion
	ctx.clearRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width, grid_size, grid_size);
	//Clear the position above the current position
	ctx.clearRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
}

function draw_cursor_at_position(x, y) {
	ctx.lineWidth = grid_line_width;
	ctx.strokeStyle = grid_highlight;
	
	if(document.getElementById("selected_shape").value == "square" || document.getElementById("selected_shape").value == "circle" ) {
		ctx.strokeRect(x + grid_line_width, y + grid_line_width, grid_size, grid_size);
	} else if(document.getElementById("selected_shape").value == "line") {
		ctx.beginPath();
		ctx.arc(x + grid_line_width, y + grid_line_width, 5, 0, 2 * Math.PI);
		ctx.fill();
	}
	redraw_live_objects();
	selected_grid_x = x;
	selected_grid_y = y;
}

function redraw_live_objects() {
	live_objects.forEach( function(element, index) {
		if(		(element.x_coord == selected_grid_x && element.y_coord == selected_grid_y) ||
				(element.x_coord == selected_grid_x - grid_size && element.y_coord == selected_grid_y - grid_size) ||
				(element.x_coord == selected_grid_x - grid_size && element.y_coord == selected_grid_y) ||
				(element.x_coord == selected_grid_x && element.y_coord == selected_grid_y - grid_size)) 
			draw_item(element);
		
		if(element.shape == "line") {
			redraw_line(element);
		}
	});
}

function canvas_mouse_down(evt) {
	
	var mouse_x = evt.offsetX;
	var mouse_y = evt.offsetY;
	
	var x_snap_to_grid = mouse_x - (mouse_x % grid_size);
	var y_snap_to_grid = mouse_y - (mouse_y % grid_size);
		
	move_element_x.value = (1+x_snap_to_grid/grid_size);
	move_element_y.value = (1+y_snap_to_grid/grid_size);
	
	if((selected_grid_x != x_snap_to_grid || selected_grid_y != y_snap_to_grid) 
			&& (selected_grid_x != -1 && selected_grid_y != -1)) 
		clear_previous_cursor_position();
	
	redraw_live_objects();
	
	//Outline the selected grid space, depending on the style of element to be drawn
	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);
	
	mouse_down_grid_x = x_snap_to_grid;
	mouse_down_grid_y = y_snap_to_grid;
}

function canvas_mouse_up(evt) {
	
	var mouse_x = evt.offsetX;
	var mouse_y = evt.offsetY;

	var x_snap_to_grid = mouse_x - (mouse_x % grid_size);
	var y_snap_to_grid = mouse_y - (mouse_y % grid_size);

	//Exit this function if the mouse is released within the same grid element it was activated in
	if(x_snap_to_grid == mouse_down_grid_x && y_snap_to_grid == mouse_down_grid_y)
		return;
	
	move_element_x.value = (1+x_snap_to_grid/grid_size);
	move_element_y.value = (1+y_snap_to_grid/grid_size);
	
	//Clear the last grid space and redraw
	clear_previous_cursor_position();
		
	for(var i=0; i<live_objects.length; i++) {
		if(live_objects[i].x_coord == mouse_down_grid_x && live_objects[i].y_coord == mouse_down_grid_y) {
			var move_color = live_objects[i].color;
			var move_x = live_objects[i].x_coord;
			var move_y = live_objects[i].y_coord;
			var move_shape = live_objects[i].shape;
			
			//Send the item that is to be moved with the original coordinates, which will 
			//cause the server to delete that element from the server grid
			send_element_to_server({"color" : move_color,
									"x_coord" : move_x, 
									"y_coord" : move_y,
									"object_type": move_shape});
			
			//Send the item again but with the updated coordinates, which will be added to the server grid
			send_element_to_server({"color" : move_color,
									"x_coord" : x_snap_to_grid, 
									"y_coord" : y_snap_to_grid, 
									"object_type" : move_shape});
		}

		if(live_objects[i].shape == "line") {
			redraw_line(live_objects[i]);
		}
	}
	
	//Outline the selected grid space, depending on the style of element to be drawn
	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);

	mouse_down_grid_x = -1;
	mouse_down_grid_y = -1;
}

function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}
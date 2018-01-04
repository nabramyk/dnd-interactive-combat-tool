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
	start_new_line_button;

var live_objects = new Array();

window.addEventListener('load', eventWindowLoaded, false);
console.log(window.location.href);

function redraw_line(element) {
	var x = JSON.parse(element.x_coord);
	var y = JSON.parse(element.y_coord);
	var m, b, y_val, region;
	for(var i=1; i < x.length; i++) {
		m = (y[i] - y[i-1]) / (x[i] - x[i-1]);
		b = y[i-1] - m * x[i-1];
		y_val = m * selected_grid_x + b;
		region = (y_val - (y_val % grid_size));
		if(selected_grid_y == region || 
				selected_grid_y + grid_size == region ||
					(isNaN(region) && (selected_grid_x == x[i-1] ||
							selected_grid_x  + grid_size == x[i-1]))) {
			draw_item({ "color" : element.color,
						"x_coord" : JSON.stringify([x[i-1],x[i]]),
						"y_coord" : JSON.stringify([y[i-1],y[i]]),
						"shape" : element.shape });
		}
	}
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
		})
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
	
	drawScreen();
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
			console.log("Error: " + status.status + ", " + error);
		}
	});
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
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	var x = parseInt(item.x_coord) + grid_line_width;
	var y = parseInt(item.y_coord) + grid_line_width;
	ctx.clearRect(x, y, grid_size, grid_size);
	ctx.strokeRect(x, y, grid_size, grid_size);
}

function clear_previous_cursor_position() {
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	ctx.clearRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width, grid_size, grid_size);
	
	if(document.getElementById("selected_shape").value == "line") {
		ctx.clearRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
		ctx.strokeRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
		ctx.clearRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width, grid_size, grid_size);
		ctx.strokeRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width, grid_size, grid_size);
		ctx.clearRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
		ctx.strokeRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	}
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
	
}

function canvas_mouse_down(evt) {
	
	var mouse_x = evt.offsetX;
	var mouse_y = evt.offsetY;
	
	var x_snap_to_grid = mouse_x - (mouse_x % grid_size);
	var y_snap_to_grid = mouse_y - (mouse_y % grid_size);
		
	document.getElementById("grid_location").innerHTML = "X = " + (1+x_snap_to_grid/grid_size) + "; Y = " + (1+y_snap_to_grid/grid_size);
	
	if((selected_grid_x != x_snap_to_grid || selected_grid_y != y_snap_to_grid) 
			&& (selected_grid_x != -1 && selected_grid_y != -1)) 
		clear_previous_cursor_position();
	
	live_objects.forEach( function(element, index) {
		if(element.x_coord == selected_grid_x && element.y_coord == selected_grid_y) 
			draw_item(element);
		
		if(element.shape == "line") {
			redraw_line(element);
		}
	});
	
	//Outline the selected grid space, depending on the style of element to be drawn
	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);
	
	selected_grid_x = x_snap_to_grid;
	selected_grid_y = y_snap_to_grid;
	
	mouse_down_grid_x = x_snap_to_grid;
	mouse_down_grid_y = y_snap_to_grid;
}

function canvas_mouse_up(evt) {
	
	var mouse_x = evt.offsetX;
	var mouse_y = evt.offsetY;

	var x_snap_to_grid = mouse_x - (mouse_x % grid_size);
	var y_snap_to_grid = mouse_y - (mouse_y % grid_size);

	document.getElementById("grid_location").innerHTML = "X = " + (1+x_snap_to_grid/grid_size) + "; Y = " + (1+y_snap_to_grid/grid_size);

	//Exit this function if the mouse is released within the same grid element it was activated in
	if(x_snap_to_grid == mouse_down_grid_x && y_snap_to_grid == mouse_down_grid_y)
		return;
	
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

	selected_grid_x = x_snap_to_grid;
	selected_grid_y = y_snap_to_grid;
	
	mouse_down_grid_x = -1;
	mouse_down_grid_y = -1;
}

function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}
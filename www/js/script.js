//GRID VARS
var grid_size = 20;
var grid_count_width = 30;
var grid_count_height = 24;
var canvas_padding = 5;
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

// GUI Elements
var grid_canvas, 
	ctx, 
	place_element_button,
	clear_element_button,
	reset_board_button,
	start_new_line_button,
	move_button,
	move_element_x,
	move_element_y,
	incremental_move_up,
	incremental_move_down,
	incremental_move_left,
	incremental_move_right,
	selected_shape,
	movement_controls;

var live_objects = [];

window.addEventListener('load', eventWindowLoaded, false);
console.log(window.location.href);

function eventWindowLoaded() {
	canvasApp();
	var v = setInterval(update, update_interval);
}

function canvasSupport(e) {
	return !!e.getContext;
}

function canvasApp() {
	grid_canvas = document.getElementById('grid_canvas');
	start_new_line_button = document.getElementById('start_new_line_button');
	
	$("#movement_controls").hide();
	$("#reset_board_button").hide();
	$("#start_new_line_button").hide();
	
	ctx = grid_canvas.getContext('2d');

	if (!canvasSupport(grid_canvas)) {
		return;
	}

	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	
	$("#element_list").css("height",grid_canvas.height/2 + "px");
	
	grid_canvas.addEventListener('mousedown', function(event) { canvas_mouse_down(event) }, false);
	
	grid_canvas.addEventListener('mouseup', function(event) { canvas_mouse_up(event) }, false);
	
	/*
	 * grid_canvas.addEventListener('mousemove', function(event) { if
	 * (document.getElementById('on_hover_highlight').checked == true) {
	 * console.log('X:' + event.offsetX + ', Y: ' + event.offsetY); var mouse_x =
	 * event.offsetX; var mouse_y = event.offsetY; var x_snap_to_grid = mouse_x -
	 * (mouse_x % grid_size); var y_snap_to_grid = mouse_y - (mouse_y %
	 * grid_size); ctx.fillStyle = "#CCFF33"; ctx.fillRect(x_snap_to_grid,
	 * y_snap_to_grid, 5, 5); } })
	 */

	$('#place_element_button').click(function() {
		if($("#place_element_button").html() == "Add Element" || $("#place_element_button").html() == "Add Vertex") {
			switch($("#selected_shape").val()) {
				case "square":
				case "circle":
					add_element($("#element_color").val(), selected_grid_x, selected_grid_y, $("#selected_shape").val());
					break;
				case "line":
					x_vertices.push(selected_grid_x);
					y_vertices.push(selected_grid_y);
					break;
			}
			$('#movement_controls').show();
		} else if($("#place_element_button").html() == "Delete Element") {
			live_objects.forEach(function(element) {
				if(element.x_coord == selected_grid_x && element.y_coord == selected_grid_y)
					delete_element(element.color, element.x_coord, element.y_coord, element.shape);
			});
			$('#movement_controls').hide();
		}
	});
	
	$('#reset_board_button').click(function() {
		live_objects.forEach(function(element) {
				delete_element(element.color, element.x_coord, element.y_coord, element.shape);
		});
		$('#movement_controls').hide();
	});
	
	$("#start_new_line_button").click(function() {
		add_element($("#element_color").val(), x_vertices, y_vertices, $("#selected_shape").val());
		line_interval_id++;
		x_vertices = [];
		y_vertices = [];
	});
	
	$('#move_button').click(function() {
		live_objects.find(function(el,ind,arr) {
			if(el.x_coord == selected_grid_x && el.y_coord == selected_grid_y) {
				var move_to_color = el.color;
				var move_to_x = el.x_coord;
				var move_to_y = el.y_coord;
				var move_to_shape = el.shape;
				selected_grid_x = ($("#move_to_x").val() - 1) * grid_size;
				selected_grid_y = ($("#move_to_y").val() - 1) * grid_size;
				move_element(move_to_color,
						{x:move_to_x, y:move_to_y},
						{x:selected_grid_x, y:selected_grid_y},
						move_to_shape);
			}
		});
	});
	
	$("#move_inc_up").click(function() { incremental_move_element("up"); });
	$("#move_inc_down").click(function() { incremental_move_element("down"); });
	$("#move_inc_left").click(function() { incremental_move_element("left"); });
	$("#move_inc_right").click(function() { incremental_move_element("right"); });
	
	$("#selected_shape").change(function() {
		switch($("#selected_shape").val()) {
		case "line":
			place_element_button.innerHTML = "Add Vertex";
			$('#start_new_line_button').show();
			break;
		case "square":
		case "circle":
			place_element_button.innerHTML = "Add Element";
			$('#start_new_line_button').hide();
			break;
		}
		if(selected_grid_x == -1 && selected_grid_y == -1)
			return;
		
		clear_previous_cursor_position();
		redraw_live_objects();
		draw_cursor_at_position(selected_grid_x, selected_grid_y);
	});
	
	drawScreen();
}

function incremental_move_element(direction) {
	live_objects.find(function(el,ind,arr) {
		if(el.x_coord == selected_grid_x && el.y_coord == selected_grid_y) {
			var move_to_color = el.color;
			var move_to_x = el.x_coord;
			var move_to_y = el.y_coord;
			var move_to_shape = el.shape;
			var temp = 0;
			if(direction=="right") {
				$("#move_to_x").val(parseInt($("#move_to_x").val()) + 1);
				selected_grid_x = ($("#move_to_x").val() - 1) * grid_size;
			}
			else if(direction=="left") {
				$("#move_to_x").val($("#move_to_x").val() - 1);
				selected_grid_x = ($("#move_to_x").val() - 1) * grid_size;
			}
			else if(direction=="up") {
				$("#move_to_y").val($("#move_to_y").val() - 1);
				selected_grid_y = ($("#move_to_y").val() - 1) * grid_size;	
			}
			else if(direction=="down") {
				$("#move_to_y").val(parseInt($("#move_to_y").val()) + 1);
				selected_grid_y = ($("#move_to_y").val() - 1) * grid_size;	
			}
			move_element(move_to_color, {"x" : move_to_x, "y" : move_to_y}, {"x" : selected_grid_x, "y" : selected_grid_y}, move_to_shape);
			draw_cursor_at_position(selected_grid_x, selected_grid_y);
		}
	});
}

/*
 * Function for drawing the grid board
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

function redraw_line(element) {
	var vertices_x = JSON.parse(element.x_coord);
	var vertices_y = JSON.parse(element.y_coord);
	var m, b, y_val, region;
	for(var i=1; i < vertices_x.length; i++) {
		var grid_points = calculate_grid_points_on_line({ "x" : vertices_x[i-1], "y" : vertices_y[i-1]},
														{ "x" : vertices_x[i], "y" : vertices_y[i]});
		grid_points.find( function(el,ind,arr) {
			if((el.x >= selected_grid_x - grid_size && el.x <= selected_grid_x + grid_size) &&
				 (el.y >= selected_grid_y - grid_size && el.y <= selected_grid_y + grid_size)) {
				draw_item({ "color" : element.color,
					"x_coord" : JSON.stringify([vertices_x[i-1],vertices_x[i]]),
					"y_coord" : JSON.stringify([vertices_y[i-1],vertices_y[i]]),
					"shape" : element.shape });
			}
		});
	}
}

function redraw_live_objects() {
	live_objects.forEach( function(element, index) {
		if((element.x_coord == selected_grid_x || element.x_coord == selected_grid_x - grid_size) &&
				(element.y_coord == selected_grid_y || element.y_coord == selected_grid_y - grid_size)) { 
			draw_item(element.shape, element.x_coord, element.y_coord, element.color);
		}
	});
	
	check_for_clipped_regions(selected_grid_x, selected_grid_y);
	check_for_clipped_regions(selected_grid_x - grid_size, selected_grid_y - grid_size);
	check_for_clipped_regions(selected_grid_x - grid_size, selected_grid_y);
	check_for_clipped_regions(selected_grid_x, selected_grid_y - grid_size);
	check_for_clipped_regions(selected_grid_x - grid_size, selected_grid_y + grid_size);
	check_for_clipped_regions(selected_grid_x, selected_grid_y + grid_size);
	check_for_clipped_regions(selected_grid_x + grid_size, selected_grid_y);
	check_for_clipped_regions(selected_grid_x + grid_size, selected_grid_y - grid_size);
	check_for_clipped_regions(selected_grid_x + grid_size, selected_grid_y + grid_size);
}

function draw_item(shape, x_coord, y_coord, color) {
	switch(shape) {
		case "square":
			ctx.fillStyle = "#" + color;
			x = x_coord + grid_line_width * 2;
			y = y_coord + grid_line_width * 2;
			ctx.fillRect(x, y, grid_size - grid_line_width * 2, grid_size - grid_line_width * 2);
			break;
		case "circle":
			ctx.fillStyle = "#" + color;
			x = x_coord + grid_line_width;
			y = y_coord + grid_line_width;
			ctx.beginPath();
			ctx.arc(x + (grid_size / 2), y + (grid_size / 2), (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
			ctx.fill();
			break;
		case "line":
			ctx.strokeStyle = "#" + color;
			ctx.beginPath();
			x = x_coord;
			y = y_coord;
			ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
			for(var i=1; i < x.length; i++) {
				ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
			}
			ctx.stroke();
			break;
	}
	$("#place_element_button").html("Delete Element");
}


function clear_item(shape, x_coord, y_coord, color) {
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	switch(shape) {
		case "square":
		case "circle":
			var x = x_coord + grid_line_width;
			var y = y_coord + grid_line_width;
			ctx.clearRect(x, y, grid_size, grid_size);
			ctx.strokeRect(x, y, grid_size, grid_size);
			check_for_clipped_regions(x_coord, y_coord);
			break;
		case "line":
			for(var i=1; i < x_coord.length; i++) {
				var grid_points = calculate_grid_points_on_line({ "x" : x_coord[i-1], "y" : y_coord[i-1]}, { "x" : x_coord[i], "y" : y_coord[i]});
				grid_points.forEach(function(element) {
					clear_item("square", element.x, element.y, null);
				});
			}
			break;
	}
	
	if($('#selected_shape').val()=="line") {
		$('#place_element_button').html("Add Vertex");
	} else {
		$('#place_element_button').html("Add Element");
	}
}

function clear_previous_cursor_position() {
	
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	
	// Clear the selected position
	ctx.clearRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width, grid_size, grid_size);
	
	// Clear the position to the top left of the selected position
	ctx.clearRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	
	// Clear the position left of this the selected postion
	ctx.clearRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width - grid_size, selected_grid_y + grid_line_width, grid_size, grid_size);
	
	// Clear the position above the current position
	ctx.clearRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
	ctx.strokeRect(selected_grid_x + grid_line_width, selected_grid_y + grid_line_width - grid_size, grid_size, grid_size);
}

function draw_cursor_at_position(x, y) {
	switch($('#selected_shape').val()) {
		case "square":
		case "circle":
			ctx.lineWidth = grid_line_width;
			ctx.strokeStyle = grid_highlight;
			ctx.strokeRect(x + grid_line_width, y + grid_line_width, grid_size, grid_size);
			break;
		case "line":
			ctx.fillStyle = grid_highlight;
			ctx.beginPath();
			ctx.arc(x + grid_line_width, y + grid_line_width, 5, 0, 2 * Math.PI);
			ctx.fill();
	}
	selected_grid_x = x;
	selected_grid_y = y;
}

function canvas_mouse_down(evt) {
	
	var x_snap_to_grid = evt.offsetX - (evt.offsetX % grid_size);
	var y_snap_to_grid = evt.offsetY - (evt.offsetY % grid_size);
		
	$("#move_to_x").val(1+x_snap_to_grid/grid_size);
	$("#move_to_y").val(1+y_snap_to_grid/grid_size);
	
	if((selected_grid_x != x_snap_to_grid || selected_grid_y != y_snap_to_grid) && (selected_grid_x != -1 && selected_grid_y != -1)) 
		clear_previous_cursor_position();
	
	redraw_live_objects();
	
	// Outline the selected grid space, depending on the style of element to be
	// drawn
	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);
	
	// Find if this grid point contains a live element
	for(var i=0; i<live_objects.length; i++) {
		if(live_objects[i].x_coord == x_snap_to_grid && live_objects[i].y_coord == y_snap_to_grid) {
			$("#place_element_button").html("Delete Element");
			$('#movement_controls').show();
			break;
		}
		
		if(i === 0 || i == live_objects.length - 1) {
			if($('#selected_shape').val() == "square" || $('#selected_shape').val == "circle") {
				$('#place_element_button').html("Add Element");
			} else if($('#selected_shape').val() == "line") {
				$('#place_element_button').html("Add Vertex");
			}
			$('#movement_controls').hide();
		}
	}

	mouse_down_grid_x = x_snap_to_grid;
	mouse_down_grid_y = y_snap_to_grid;
}

function canvas_mouse_up(evt) {

	var x_snap_to_grid = evt.offsetX - (evt.offsetX % grid_size);
	var y_snap_to_grid = evt.offsetY - (evt.offsetY % grid_size);
	
	redraw_live_objects();
	
	// Exit this function if the mouse is released within the same grid element
	// it was activated in
	if(x_snap_to_grid == mouse_down_grid_x && y_snap_to_grid == mouse_down_grid_y)
		return;
	
	$("#move_element_x").val(1+x_snap_to_grid/grid_size);
	$("#move_element_y").val(1+y_snap_to_grid/grid_size);
	
	// Clear the last grid space and redraw
	clear_previous_cursor_position();
		
	for(var i=0; i<live_objects.length; i++) {
		if(live_objects[i].x_coord == mouse_down_grid_x && live_objects[i].y_coord == mouse_down_grid_y) {
			var move_color = live_objects[i].color;
			var move_x = live_objects[i].x_coord;
			var move_y = live_objects[i].y_coord;
			var move_shape = live_objects[i].shape;
			
			// Send the item that is to be moved with the original coordinates,
			// which will
			// cause the server to delete that element from the server grid
			delete_element(move_color, move_x, move_y, move_shape);
			
			// Send the item again but with the updated coordinates, which will
			// be added to the server grid
			add_element(move_color, x_snap_to_grid, y_snap_to_grid, move_shape);
		}
	}
	
	// Outline the selected grid space, depending on the style of element to be
	// drawn
	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);

	mouse_down_grid_x = -1;
	mouse_down_grid_y = -1;
}

function add_element(color, x, y, shape) {
	send_element_to_server(color, x, y, shape);
}

function delete_element(color, x, y, shape) {
	add_element(color, x, y, shape);
}

function move_element(color, from, to, shape) {
	delete_element(color, from.x, from.y, shape);
	add_element(color, to.x, to.y, shape);
}

// //SERVER COMMUNICATION FUNCTIONS
// //All AJAX and JSON bullshit goes here and NEVER LEAVES HERE!
function update() {
	$.ajax({
		type : "POST",
		url : window.location.href + "update",
		data : {
			'live_objects' : JSON.stringify(live_objects)
		},
		dataType : 'json',
		success : function(result) {
			result.forEach( function(element,ind,arr) {
				var x = element.item.x_coord;
				var y = element.item.y_coord;
				if (element.action == "erase") {
					live_objects.find(function(el, ind, arr) {
						if(el === undefined)
							return;
						if (coordinate_comparison(el, element.item)) {
							arr.splice(ind, 1);
							clear_item(el.shape, x, y, el.color);
						}
					});
				} else if (element.action == "add") {
					live_objects.push({"shape" : element.item.shape, "x_coord" : x, "y_coord" : y, "color" : element.item.color});
					draw_item(element.item.shape, x, y, element.item.color);
				}
			});
			
			if(live_objects.length === 0)
				$('#reset_board_button').hide();
			else 
				$('#reset_board_button').show();
			
			refresh_elements_list();
		},
		error : function(status, error) {
			console.log("Error: " + status.status + ", " + error);
			//$("#console_output")
		}
	});
}

function send_element_to_server(color, x, y, shape) {	
	$.ajax({
		type : "POST",
		url : window.location.href + "push_change",
		data : 	{"color" : color, 
						"x_coord" : JSON.stringify(x), 
						"y_coord" : JSON.stringify(y), 
						"object_type" : shape},
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

function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}

// //MATH FUNCTIONS
function calculate_grid_points_on_line(starting_point, ending_point) {
	//var start = starting_point;
	//var end = ending_point;
	var grid_points = [];
	var m, b, y_val;
	
	//Swap the points if the x value at the end is smaller than the starting x value
	if(ending_point.x < starting_point.x || ending_point.y < starting_point.y) {
		var temp = starting_point;
		starting_point = ending_point;
		ending_point = temp;
	}
	
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
			
			if(grid_points.length===0) {
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
	return grid_points;
}

function check_for_clipped_regions(grid_x, grid_y) {
	//Find all of the lines in live_objects
	var temp = live_objects.filter(function(element) { return element.shape === "line"; } );
	
	//Execute function for each set of line segments
	temp.find(function(element,ind,arr) {
		var vertices_x = element.x_coord;
		var vertices_y = element.y_coord;
		
		for(var i=1; i < vertices_x.length; i++) {
			
			var grid_points = calculate_grid_points_on_line({ "x" : vertices_x[i-1], "y" : vertices_y[i-1]},
															{ "x" : vertices_x[i], "y" : vertices_y[i]});
			grid_points.find( function(el,ind,arr) {
				if((el.x > grid_x - grid_size && el.x < grid_x + grid_size) && (el.y > grid_y - grid_size && el.y < grid_y + grid_size)) {
					
					var line_segment = liangBarsky(vertices_x[i-1], vertices_y[i-1], vertices_x[i], vertices_y[i], [el.x, el.x+grid_size, el.y, el.y+grid_size]);

					draw_item(element.shape, line_segment[0], line_segment[1], element.color);
				}
			});
		}
	});
}

function refresh_elements_list() {
	$("#element_list").empty();
	live_objects.forEach( function(el) {
		$("#element_list").append("<div class=\"element_list_row\">" + el.color + "<br>" + el.shape + "<br>" + el.x_coord + "<br>" + el.y_coord + "</div>");
	});
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
function liangBarsky (x0, y0, x1, y1, bbox) {
  var [xmin, xmax, ymin, ymax] = bbox;
  var t0 = 0, t1 = 1;
  var dx = x1 - x0, dy = y1 - y0;
  var p, q, r;
 
  for(var edge = 0; edge < 4; edge++) {   // Traverse through left, right, bottom, top edges.
    if (edge === 0) { p = -dx; q = -(xmin - x0); }
    if (edge === 1) { p =  dx; q =  (xmax - x0); }
    if (edge === 2) { p = -dy; q = -(ymin - y0); }
    if (edge === 3) { p =  dy; q =  (ymax - y0); }
 
    r = q / p;
 
    if (p === 0 && q < 0) return null;   // Don't draw line at all. (parallel line outside)
 
    if(p < 0) {
      if (r > t1) return null;     // Don't draw line at all.
      else if (r > t0) t0 = r;     // Line is clipped!
    } else if (p > 0) {
      if(r < t0) return null;      // Don't draw line at all.
      else if (r < t1) t1 = r;     // Line is clipped!
    }
  }
 
  return [
    [x0 + t0 * dx, x0 + t1 * dx],
    [y0 + t0 * dy, y0 + t1 * dy]
  ];
}

function coordinate_comparison(obj_1, obj_2) {
	if(obj_1.x_coord instanceof Array) 
		return obj_1.x_coord.every(function(u,i) { return u === obj_2.x_coord[i]; }) &&
				obj_1.y_coord.every(function(u,i) { return u === obj_2.y_coord[i]; });
	else 
		return obj_1.x_coord === obj_2.x_coord && obj_1.y_coord === obj_2.y_coord;
}

function convert_to_grid_point(raw_location) {
	return raw_location - (raw_location % grid_size);
}
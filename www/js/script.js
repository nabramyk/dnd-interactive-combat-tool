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

// GUI Elements
var grid_canvas, ctx;
var live_objects = [];

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
	$("#reset_board_button").hide();
	$("#start_new_line_button").hide();
	
	ctx = grid_canvas.getContext('2d');

	if (!canvasSupport(grid_canvas)) {
		return;
	}

	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	
	$("#element_list").css("height",grid_canvas.height + "px");
	
	$("#grid_size_vertical").val(grid_count_height);
	$("#grid_size_horizontal").val(grid_count_width);
	
	$("#grid_size_vertical").change(function() {
		grid_count_height = $("#grid_size_vertical").val();
		$.ajax({
			type: "POST",
			url: window.location.href + "resize_grid",
			data: { "width" : grid_count_width, "height" : grid_count_height},
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
	});
	
	$("#grid_size_horizontal").change(function() {
		grid_count_width = $("#grid_size_horizontal").val();
		$.ajax({
			type: "POST",
			url: window.location.href + "resize_grid",
			data: { "width" : grid_count_width, "height" : grid_count_height},
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
	});
	
	grid_canvas.addEventListener('mousedown', function(event) { canvas_mouse_down(event) }, false);
	
	grid_canvas.addEventListener('mouseup', function(event) { canvas_mouse_up(event) }, false);
	
	$('#place_element_button').click(function() {
		if($("#place_element_button").html() == "Add Element" || $("#place_element_button").html() == "Add Vertex") {
			switch($("#selected_shape").val()) {
				case "square":
				case "circle":
					add_element($("#element_color").val(), selected_grid_x, selected_grid_y, $("#selected_shape").val(), null, $("#element_size").val());
					break;
				case "line":
					x_vertices.push(selected_grid_x);
					y_vertices.push(selected_grid_y);
					if(x_vertices.length === 1 && y_vertices.length === 1)
						$("#start_new_line_button").toggle();
					break;
			}
		} else if($("#place_element_button").html() == "Delete Element") {
			live_objects.forEach(function(element) {
				if(element.x_coord == selected_grid_x && element.y_coord == selected_grid_y)
					delete_element(element.color, element.x_coord, element.y_coord, element.shape);
			});
		}
	});
	
	$('#reset_board_button').click(function() {
		live_objects.forEach(function(element) {
				delete_element(element.color, element.x_coord, element.y_coord, element.shape);
		});
	});
	
	$("#start_new_line_button").click(function() {
		if(selected_grid_x !== x_vertices[x_vertices.length-1] || selected_grid_y !== y_vertices[y_vertices.length-1]) {
			x_vertices.push(selected_grid_x);
			y_vertices.push(selected_grid_y);
		}
		
		if(x_vertices.length > 1 && y_vertices.length > 1)
			 add_element($("#element_color").val(), x_vertices, y_vertices, $("#selected_shape").val());
		
		x_vertices = [];
		y_vertices = [];
		$("#start_new_line_button").toggle();
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
						{"x":move_to_x, "y":move_to_y},
						{"x":selected_grid_x, "y":selected_grid_y},
						move_to_shape);
			}
		});
	});
	
	$("#move_inc_up").click(function() { incremental_move_element("up"); });
	$("#move_inc_down").click(function() { incremental_move_element("down"); });
	$("#move_inc_left").click(function() { incremental_move_element("left"); });
	$("#move_inc_right").click(function() { incremental_move_element("right"); });
	
	$("#selected_shape").change(function(el) {
		switch($("#selected_shape").val()) {
		case 'line':
			$('#place_element_button').html("Add Vertex");
			break;
		case "square":
		case "circle":
			$('#place_element_button').html("Add Element");
			$('#start_new_line_button').hide();
			break;
		}
		if(selected_grid_x == -1 && selected_grid_y == -1) { return; }
		
		for(var i=1; i<x_vertices.length; i++) {
			clear_item("line",[x_vertices[i-1],x_vertices[i]],[y_vertices[i-1],y_vertices[i]],{},0);
		}
		clear_item("line",[x_vertices[x_vertices.length-1],selected_grid_x],[y_vertices[y_vertices.length-1],selected_grid_y],{},0);
		
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
		for(var w=0; w<grid_count_width; w++) {
			for(var h=0; h<grid_count_height; h++) {
				if(Math.random() < 0.75) {
					add_element("000000", w * grid_size, h * grid_size, "square", "rando" + h*w, 1);
				}
			}
		}
	});
	
	drawScreen();
}

function incremental_move_element(direction) {
	live_objects.find(function(el,ind,arr) {
		if(el.x_coord == selected_grid_x && el.y_coord == selected_grid_y) {
			var move_to_color = el.color;
			var move_from_x = el.x_coord;
			var move_from_y = el.y_coord;
			var move_to_shape = el.shape;
			var move_to_name = el.name;
			var temp = 0;
			var move_to_x = el.x_coord;
			var move_to_y = el.y_coord;
			
			if(direction=="right") {
				move_to_x += grid_size;
				$("#move_to_x").val(1 + move_to_x / grid_size);
			}
			else if(direction=="left") {
				move_to_x -= grid_size;
				$("#move_to_x").val(1 + move_to_x / grid_size);
			}
			else if(direction=="up") {
				move_to_y -= grid_size;
				$("#move_to_y").val(1 + move_to_y / grid_size);
			}
			else if(direction=="down") {
				move_to_y += grid_size;
				$("#move_to_y").val(1 + move_to_y / grid_size);
			}
			draw_cursor_at_position(move_to_x, move_to_y);
			move_element_on_server(move_from_x, move_from_y, move_to_x, move_to_y);
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

function draw_item(shape, x_coord, y_coord, color, size) {
	switch(shape) {
		case "square":
			ctx.fillStyle = "#" + color;
			x = x_coord + grid_line_width * 2;
			y = y_coord + grid_line_width * 2;
			ctx.fillRect(x, y, size * grid_size - grid_line_width * 2, size * grid_size - grid_line_width * 2);
			break;
		case "circle":
			ctx.fillStyle = "#" + color;
			x = x_coord + grid_line_width;
			y = y_coord + grid_line_width;
			ctx.beginPath();
			ctx.arc(x + (grid_size / 2) * size, y + (grid_size / 2) * size, size * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
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
}


function clear_item(shape, x_coord, y_coord, color, size) {
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	switch(shape) {
		case "square":
		case "circle":
			var x = x_coord + grid_line_width;
			var y = y_coord + grid_line_width;
			for(var i=0; i<size; i++) {
				for(var n=0; n<size; n++) {
					ctx.clearRect(x + i * grid_size, y + n * grid_size, grid_size, grid_size);
					ctx.strokeRect(x + i * grid_size, y + n * grid_size, grid_size, grid_size);
					check_for_clipped_regions([x_coord + i * grid_size, y_coord], live_objects.filter(function(element) { return element.shape === "line"; }));
				}
			}
			break;
		case "line":
			for(var i=1; i < x_coord.length; i++) {
				var grid_points = calculate_grid_points_on_line({ "x" : x_coord[i-1], "y" : y_coord[i-1]}, { "x" : x_coord[i], "y" : y_coord[i]});
				grid_points.forEach(function(element) {
					clear_item("square", element.x, element.y, null, 1);
					var temp = live_objects.find(function(el) { return coordinate_comparison(el, { "x_coord" : element.x, "y_coord" : element.y }); });
					if(typeof temp != 'undefined') {
						draw_item(temp.shape, temp.x_coord, temp.y_coord, temp.color, temp.size);
					}
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
	
	if(selected_grid_x === -1 || selected_grid_y == -1)
		return;
	
	ctx.strokeStyle = grid_color;
	ctx.lineWidth = grid_line_width;
	
	for(var i=0; i<=cursor_size-1; i++) {
		for(var n=0; n<=cursor_size-1; n++) {
			ctx.clearRect(selected_grid_x + grid_line_width + i * grid_size, selected_grid_y + grid_line_width + n * grid_size, grid_size, grid_size);
			ctx.strokeRect(selected_grid_x + grid_line_width + i * grid_size, selected_grid_y + grid_line_width + n * grid_size, grid_size, grid_size);
		}
	}
	
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
	
	live_objects.forEach(function(el) {
		if(((el.x_coord <= selected_grid_x && el.x_coord * el.size >= selected_grid_x) && (el.y_coord <= selected_grid_y && el.y_coord * el.size >= selected_grid_y)) ||
												coordinate_comparison(el, {"x_coord" : north()[0], "y_coord" : north()[1]}) ||
													coordinate_comparison(el, {"x_coord" : west()[0], "y_coord" : west()[1]}) ||
														coordinate_comparison(el, {"x_coord" : northwest()[0], "y_coord" : northwest()[1]})) {
			draw_item(el.shape, el.x_coord, el.y_coord, el.color, el.size);
		}
	});
	
	var lines = live_objects.filter(function(element) { return element.shape === "line"; } );
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
	
	lines = [{"shape" : "line", "x_coord" : x_vertices, "y_coord" : y_vertices, "color" : temporary_line_color}];
	check_for_clipped_regions(center(), lines);
	check_for_clipped_regions(west(), lines);
	check_for_clipped_regions(north(), lines);
	check_for_clipped_regions(northwest(), lines);
}

function north() { 		return [selected_grid_x, selected_grid_y - grid_size]; }
function east() {			return [selected_grid_x + grid_size, selected_grid_y]; }
function east2() {			return [selected_grid_x + grid_size * 2, selected_grid_y]; }
function west() {			return [selected_grid_x - grid_size, selected_grid_y]; }
function south() {			return [selected_grid_x, selected_grid_y + grid_size]; }
function northeast() { return [selected_grid_x + grid_size, selected_grid_y - grid_size]; }
function northwest() {	return [selected_grid_x - grid_size, selected_grid_y - grid_size]; }
function southeast() {	return [selected_grid_x + grid_size, selected_grid_y + grid_size]; }
function southwest() {	return [selected_grid_x - grid_size, selected_grid_y + grid_size]; }
function center() {		return [selected_grid_x, selected_grid_y]; }

function draw_cursor_at_position(x, y) {

	var temp = live_objects.find(function(el) { return ((el.x_coord <= x && el.x_coord + el.size * grid_size > x) && (el.y_coord <= y && el.y_coord + el.size * grid_size > y)); });
	
	switch($('#selected_shape').val()) {
		case "square":
		case "circle":
			ctx.lineWidth = grid_line_width;
			ctx.strokeStyle = grid_highlight;
			if(typeof(temp) !== 'undefined') {
				ctx.strokeRect(temp.x_coord + grid_line_width, temp.y_coord + grid_line_width, temp.size * grid_size, temp.size * grid_size);
				cursor_size = temp.size;
				x = temp.x_coord;
				y = temp.y_coord;
			}
			else {
				ctx.strokeRect(x + grid_line_width, y + grid_line_width, grid_size, grid_size);
				cursor_size = 1;
			}
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
	
	if((selected_grid_x != x_snap_to_grid || selected_grid_y != y_snap_to_grid) && (selected_grid_x != -1 && selected_grid_y != -1)) 
		clear_previous_cursor_position();
	
	//Drawing temporary lines before sending the line to the server
	if($("#selected_shape").val() == "line" && x_vertices.length > 0 && y_vertices.length > 0) {
		var temp = calculate_grid_points_on_line({ "x" : x_vertices.slice(x_vertices.length-1), "y" : y_vertices.slice(y_vertices.length-1)},
																							 { "x" : selected_grid_x, "y" : selected_grid_y });
		var x = x_vertices.slice(x_vertices.length-1).concat(selected_grid_x);
		var y = y_vertices.slice(y_vertices.length-1).concat(selected_grid_y);
		clear_item("line", x, y, $("#element_color").val(), 1);
		temp.forEach(function(el,ind,arr) {
			check_for_clipped_regions([el.x, el.y], [{ "x_coord" : x_vertices, "y_coord" : y_vertices, "shape" : "line", "color" : temporary_line_color}]);
			var object_that_needs_to_be_redrawn = live_objects.find(function(e) { return coordinate_comparison({ "x_coord" : el.x, "y_coord" : el.y}, e); });
			if(typeof object_that_needs_to_be_redrawn !== 'undefined')
				draw_item(object_that_needs_to_be_redrawn.shape, object_that_needs_to_be_redrawn.x_coord, object_that_needs_to_be_redrawn.y_coord, object_that_needs_to_be_redrawn.color, object_that_needs_to_be_redrawn.size);
		});
		draw_item("line", x_vertices.slice(x_vertices.length-1).concat(x_snap_to_grid), y_vertices.slice(y_vertices.length-1).concat(y_snap_to_grid), temporary_line_color, null);
	}

	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);
	
	mouse_down_grid_x = x_snap_to_grid;
	mouse_down_grid_y = y_snap_to_grid;
	
	$("#move_to_x").val(1+selected_grid_x/grid_size);
	$("#move_to_y").val(1+selected_grid_y/grid_size);
}

function canvas_mouse_up(evt) {

	var x_snap_to_grid = evt.offsetX - (evt.offsetX % grid_size);
	var y_snap_to_grid = evt.offsetY - (evt.offsetY % grid_size);
		
	// Exit this function if the mouse is released within the same grid element
	// it was activated in
	if(x_snap_to_grid === mouse_down_grid_x && y_snap_to_grid === mouse_down_grid_y)
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
			
			move_element_on_server(move_x, move_y, x_snap_to_grid, y_snap_to_grid);
		}
	}
	
	// Outline the selected grid space, depending on the style of element to be
	// drawn
	draw_cursor_at_position(x_snap_to_grid, y_snap_to_grid);
	
	mouse_down_grid_x = -1;
	mouse_down_grid_y = -1;
}

function add_element(color, x, y, shape, name, size) {
	send_element_to_server(color, x, y, shape, name, size);
}

function delete_element(color, x, y, shape, name, size) {
	add_element(color, x, y, shape, name);
}

function delete_element_with_id(id) {
	var temp = live_objects.find(function(el) { return el.id === id; });
	delete_element(temp.color, temp.x_coord, temp.y_coord, temp.shape, temp.name, temp.size);
}

//SERVER COMMUNICATION FUNCTIONS
//All AJAX and JSON bullshit goes here and NEVER LEAVES HERE!
function update() {
	$.ajax({
		type : "POST",
		url : window.location.href + "update",
		data : {
			'live_objects' : JSON.stringify(live_objects)
		},
		dataType : 'json',
		success : function(result) {
			var data_updated = false;
			var server_grid_size = result.shift();
			if( server_grid_size.width != grid_count_width ) {
				grid_count_width = server_grid_size.width;
				$("#grid_size_horizontal").val(server_grid_size.width);
				grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
				drawScreen();
				live_objects.forEach(function(element) {
					draw_item(element.shape, element.x_coord, element.y_coord, element.color, element.size);
				});
			}
			if( server_grid_size.height != grid_count_height ) {
				grid_count_height = server_grid_size.height;
				$("#grid_size_vertical").val(server_grid_size.height);
				grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
				drawScreen();
				live_objects.forEach(function(element) {
					draw_item(element.shape, element.x_coord, element.y_coord, element.color, element.size);
				});
			}
			result.forEach( function(element,ind,arr) {
				var x = element.item.x_coord;
				var y = element.item.y_coord;
				if (element.action === "erase") {
					live_objects.find(function(el, ind, arr) {
						if(el === undefined)
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
						"id" : element.item.id, 
						"shape" : element.item.shape, 
						"x_coord" : x, 
						"y_coord" : y, 
						"color" : element.item.color, 
						"name" : element.item.name,
						"size" : element.item.size
					});
					live_objects.sort(function(pre, post) { 
						return pre.id - post.id;
					});
					if(coordinate_comparison(element.item, {"x_coord" : selected_grid_x, "y_coord" : selected_grid_y})) {
						clear_previous_cursor_position();
						//alert('here');
						draw_cursor_at_position(selected_grid_x, selected_grid_y);
					}
					draw_item(element.item.shape, x, y, element.item.color, element.item.size);
					data_updated = true;
				} else if (element.action === "rename") {
					live_objects.find( function(el,ind,arr) {
						if(coordinate_comparison(el,element.item)) {
							live_objects[ind].name = element.item.name;
							data_updated = true;
						}
					}); 
				}
			});
			
			if(data_updated)
				refresh_elements_list();
			
			if(live_objects.length === 0)
				$('#reset_board_button').hide();
			else 
				$('#reset_board_button').show();
			
			setTimeout(update(), update_interval);
		},
		error : function(status, error) {
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function send_element_to_server(color, x, y, shape, name, size) {
	$.ajax({
		type : "POST",
		url : window.location.href + "push_change",
		data : 	{"color" : color, 
						"x_coord" : JSON.stringify(x), 
						"y_coord" : JSON.stringify(y), 
						"object_type" : shape,
						"name" : name,
						"size" : size },
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

function rename_element(x, y, name) {
	$.ajax({
		type : "POST",
		url : window.location.href + "rename_element",
		data : {"x_coord" : JSON.stringify(x),
					 "y_coord" : JSON.stringify(y),
					 "name" : name},
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

function move_element_on_server(from_x, from_y, to_x, to_y) {
	$.ajax({
		type : "POST",
		url : window.location.href + "move_element",
		data : {"from_x" : JSON.stringify(from_x),
					 "from_y" : JSON.stringify(from_y),
					 "to_x" : JSON.stringify(to_x),
					 "to_y" : JSON.stringify(to_y)},
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

//MATH FUNCTIONS
function calculate_grid_points_on_line(starting_point, ending_point) {
	var grid_points = [];
	var m, b, y_val;

	//Swap the points if the x value at the end is smaller than the starting x value
	if(ending_point.x < starting_point.x) {
		var temp = starting_point;
		starting_point = ending_point;
		ending_point = temp;
	}
	
	m = (ending_point.y - starting_point.y) / (ending_point.x - starting_point.x);
	b = starting_point.y - m * starting_point.x;

	if(!isFinite(m)) {
		var _start, _end;
		if(starting_point.y < ending_point.y) {
			_start = starting_point.y;
			_end = ending_point.y;
		} else {
			_start = ending_point.y;
			_end = starting_point.y;
		}
		for(; _start < _end; _start = _start + grid_size) {
			grid_points.push({ "x" : starting_point.x, "y" : _start });
		}
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

function check_for_clipped_regions(grid_location, lines) {
	[grid_x, grid_y] = grid_location;
	
	//Execute function for each set of line segments
	lines.forEach(function(element,ind,arr) {

		var vertices_x = element.x_coord;
		var vertices_y = element.y_coord;
		for(var i=1; i < vertices_x.length; i++) {
			
			var grid_points = calculate_grid_points_on_line({ "x" : vertices_x[i-1], "y" : vertices_y[i-1]},
															{ "x" : vertices_x[i], "y" : vertices_y[i]});
			grid_points.forEach( function(el,ind,arr) {
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
	live_objects.forEach( function(el,ind,arr) {
		$("#element_list").append("<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.id + ")\">" +
															"<input type=\"text\" value=\"" + el.name + "\" onkeypress=\"change_name_of_element(event,[" + el.x_coord + "],[" + el.y_coord + "],this.value)\">" +
															"<button onclick=\"delete_element_with_id(" + el.id + ")\" class=\"destructive\">&times</button><br>" + 
															"<div contenteditable=false>Position<br>X: " + el.x_coord + "<br>Y: " + el.y_coord + "</div>" +
															"</div>");
	});
}

function clicked_element_list(id) {	
	clear_previous_cursor_position();
	var temp = live_objects.find(function(el) { return el.id === id; });
	if(temp.shape === "line") {
		
	} else {
		draw_cursor_at_position(temp.x_coord, temp.y_coord);
	}
}

function change_name_of_element(evt, x, y, name) {
		if(evt.which == 13) {
			//var temp = live_objects.find(function(el) {return el.x_coord == x && el.y_coord == y;});
			var temp = live_objects.find(function(el) { return coordinate_comparison(el, {"x_coord" : x, "y_coord" : y}); });
			if(typeof(temp) !== undefined) {
				rename_element(x, y, name);
			}
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
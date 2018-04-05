var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var log4js = require('log4js');
var log = log4js.getLogger();

var bodyParser = require('body-parser')

var element_id_counter = 1;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Define the main path to index.html, which will be automatically loaded when
// the user visits for the
// first time
app.use(express.static('www'));

// Define the path for where the javscript files are located for the users
// webpage
app.use('/js', express.static(__dirname + '/www/js'))

// Define the path for where the css stylesheets are located for the users
// webpage
app.use('/css', express.static(__dirname + '/www/css'))

/**
 * Objects which are representable in the grid space
 *
 * @constructor
 * @param {int} x - horizontal grid coordinate of the element
 * @param {int} y - vertical grid coordinate of the element
 * @param {string} type - the geometric shape this element represents
 * @param {string} color - the hexadecimal value of the element color
 * @param {int} size - the amount of grid spaces this elements spans across
 * @param {string} category - the meta group this element belongs to
 * @param {string} name - the unique name of this element
 */
function Element(x, y, type, color, size, category, name) {
	this.id = element_id_counter++;
	this.x = x;
	this.y = y;
	this.type = type;
	this.color = color;
	this.size = size;
	this.category = category;
	this.name = name;
}
 
/** @global [{obj}]  */
var cells = [];

var history = [];

var grid_width = 1;
var grid_height = 1;

io.on('connection', function(socket) {
	console.log("a user connected");

	socket.on('init', function(msg) {
		socket.emit('init', { 
			"grid_width" : grid_width,
			"grid_height" : grid_height,
			"elements" : cells
		});
	});
	
	socket.on('resize_height', function(msg) {
		grid_height = JSON.parse(msg.height);
		io.emit('resize_height', msg);
	});

	socket.on('resize_width', function(msg) {
		grid_width = JSON.parse(msg.width);
		io.emit('resize_width', msg);
	});

	socket.on('canvas_clicked', function(msg) {
		var size = cells.find(function(el) {
			return coordinate_comparison(el, { "x" : msg.new_x, "y" : msg.new_y });
		});
		socket.emit('canvas_clicked', {
			"selected_grid_x" : !isUndefined(size) ? parseInt(size.x) : msg.new_x,
			"selected_grid_y" : !isUndefined(size) ? parseInt(size.y) : msg.new_y,
			"size" : !isUndefined(size) ? parseInt(size.size) : 1,
			"elements" : elementsToBeRedrawn(msg)
		});
	});

	socket.on('move_element', function(msg) {
		var ob = cells.find(function(el) {
			return coordinate_comparison(el, msg);
		});

		if (typeof ob === 'undefined') return;
		
		var direction = msg.direction;
		var move_to_x = ob.x;
		var move_to_y = ob.y;
		var size = ob.size;
		var id = ob.id;

		var from_x = ob.x;
		var from_y = ob.y;

		if (direction == "right") move_to_x++;
		else if (direction == "left") move_to_x--;
		else if (direction == "up") move_to_y--;
		else if (direction == "down") move_to_y++;
		
		//If there is NOT an element already where we are trying to move this element to...
		if(!cells.find(function(el) {
			return id === el.id ? false : (coordinate_comparison(el, { "x" : move_to_x, "y" : move_to_y}) ||
										   coordinate_comparison({ "x" : move_to_x, "y" : move_to_y, "size" : size}, el));
			})) 
		{
			//todo Find the surrounding elements
			ob.x = move_to_x;
			ob.y = move_to_y;
			socket.broadcast.emit('move_element', { "from_x" : from_x, "from_y" : from_y, "element" : ob });
			socket.emit('moving_element', { "x" : move_to_x, "y" : move_to_y, "size" : ob.size, "element" : ob, "elements" : elementsToBeRedrawn({"old_x" : from_x, "old_y" : from_y}) });
		}
	});

	/* ADD ELEMENT TO SERVER */
	socket.on('add_element_to_server', function(msg) {
		var input = new Element(JSON.parse(msg.x_coord), 
								JSON.parse(msg.y_coord), 
								msg.object_type, 
								msg.color, 
								JSON.parse(msg.size), 
								msg.category,
								msg.name !== "" ? msg.name : "object");
		cells.push(input);
		history.push({
			"action": "add",
			"item": input
		});

		io.emit('added_element', input);
	});
	
	socket.on('delete_element_on_server', function(msg) {
		var ind = cells.findIndex( function(el) { return el.id === msg; });
		io.emit('removed_element', cells[ind]);
		cells.splice(ind, 1);
		io.emit('retrieve_elements_list', cells);
	});
	
	socket.on('randomize', function(msg) {
		for (var w = 0; w < grid_width; w++) {
			for (var h = 0; h < grid_height; h++) {
				if (Math.random() < 0.2) {
					
					var category = Math.random() * 4;
							
					var input = {
						"id": element_id_counter,
						"color": "000000",
						"x_coord": w + 1,
						"y_coord": h + 1,
						"shape": "square",
						"name": "rando" + h * w,
						"size": 1,
						"category": "environment"
					};

					cells.push(input);
					element_id_counter++;
				}
			}
		}
		io.emit('added_element', cells);
	});
	
	socket.on('reset_board', function(msg) {
		cells.forEach( function(el) {
			io.emit('removed_element', el);
		});
		cells = [];
	});
	
	socket.on('get_elements_list', function(msg) {
		socket.emit('retrieve_elements_list', cells);
	});
	
	socket.on('select_element_from_list', function(msg) {
		var element = cells.find( function(el) { return el.id === msg.id } );
		var element_to_redraw = cells.find( function(el) { return coordinate_comparison(el, { "x_coord" : msg.selected_grid_x, "y_coord" : msg.selected_grid_y } ) } );
		socket.emit('selected_element_from_list', (isUndefined(element) ? { "selected_element" : { "x_coord" : -1, "y_coord" : -1 }} : { "selected_element" : element , "redraw_element" : element_to_redraw}));
	});
});

// Main driver for booting up the server
http.listen(8080, function() {
	console.log("%s:%s", http.address().address, http.address().port)
});

/**
 * Determine if two objects are lines with matching vertices, or if two objects have overlapping coordinates
 * 
 * @param obj_1
 * @param obj_2
 * @returns
 */
function coordinate_comparison(obj_1, obj_2) {
	console.log("1: " + JSON.stringify(obj_1), "2" + JSON.stringify(obj_2))
	if (obj_1.x instanceof Array)
		return obj_1.x.every(function(u, i) {
				return u === obj_2.x[i];
			}) &&
			obj_1.y.every(function(u, i) {
				return u === obj_2.y[i];
			});
	else
		return obj_1.x <= obj_2.x && obj_1.x + obj_1.size > obj_2.x && 
			obj_1.y <= obj_2.y && obj_1.y + obj_1.size > obj_2.y;
}

/**
 * Determine if the grid coordinate lies on an aliased vector path
 * 
 * @param {obj} grid_location - xy coordinate of a grid point to find
 * @param {obj} line - vector of grid points to search from
 * @returns {obj|undefined} 
 */
function check_for_clipped_regions(grid_location, line) {
	for(var i=1; i<line.x_coord.length; i++) {
		var line_segment = [{ "x" : line.x_coord[i-1], "y" : line.y_coord[i-1]}, {"x" : line.x_coord[i], "y" : line.y_coord[i]}];
		if(typeof calculate_grid_points_on_line({ "x" : line.x_coord[i-1], "y" : line.y_coord[i-1]}, {"x" : line.x_coord[i], "y" : line.y_coord[i]})
			 .find(function(el) {
					return coordinate_comparison(grid_location, { "x_coord" : el.x, "y_coord" : el.y });
						}) !== 'undefined') {
				return line_segment;
		}
	}
	return undefined;
}

/**
 * Compute an array of XY pairs which are the grid squares that the line crosses 
 * 
 * @param {obj} starting_point - coordinate of the starting vertex
 * @param {obj} ending_point - coordinate of the ending vertex
 * @returns [{obj}]
 */
function calculate_grid_points_on_line(starting_point, ending_point) {
	var grid_points = [];
	var m, b, y_val;
	var step_size = 0.01;

	// Swap the points if the x value at the end is smaller than the starting x
	// value
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
		for (; _start < _end; _start++) {
			grid_points.push({
				"x": starting_point.x,
				"y": _start
			});
		}
	} else
		for (var x_val = starting_point.x; x_val <= ending_point.x; x_val = x_val + step_size) {
			y_val = Math.floor(m * x_val + b);
			var xy_pair = {
				"x": Math.floor(x_val),
				"y": y_val
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

/**
 * Compile a list of all elements that would have erroneously erased within a given grid area
 *
 * @param msg
 * @returns
 */
function elementsToBeRedrawn(msg) {
	var ob = [];
		
		[ { "x" : msg.old_x, "y" : msg.old_y },
			{ "x" : msg.old_x-1, "y" : msg.old_y},
			{ "x" : msg.old_x, "y" : msg.old_y-1},
			{ "x" : msg.old_x-1, "y" : msg.old_y-1}]
		.forEach(function(cursor_space) {
			cells.forEach( function(el) {
				if(el.shape === 'line') {
					var out = check_for_clipped_regions(cursor_space, el);
					if(out !== undefined) {
						ob.push({ "element" : { "shape" : "line-segment", "x" : [out[0].x,out[1].x], "y" : [out[0].y,out[1].y], "color" : el.color } , "bbox" : cursor_space});
					}
				} else {
					if(coordinate_comparison(el,cursor_space))
						ob.push({ "element" : el});
				}
			});
		});
	
	return ob;
}

/**
 * 
 * @param value
 * @returns
 */
function isUndefined(value) {
	return value === undefined;
}
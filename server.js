//This server requires the 'express' NodeJS server framework
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

//Define the main path to index.html, which will be automatically loaded when the user visits for the
//first time
app.use(express.static('www'));

//Define the path for where the javscript files are located for the users webpage
app.use('/js', express.static(__dirname + '/www/js'))

//Define the path for where the css stylesheets are located for the users webpage
app.use('/css', express.static(__dirname + '/www/css'))

//Initialize the array for centralizing the model between multiple users
var cells = [];

var history = [];

var grid_width = 1;
var grid_height = 1;

//HELPERS
function north(point) {
	return {
		"x_coord": point.x_coord,
		"y_coord": point.y_coord - 1
	};
}

function east(point) {
	return {
		"x_coord": point.x_coord + 1,
		"y_coord": point.y_coord
	};
}

function east2(point) {
	return {
		"x_coord": point.x_coord + 1 * 2,
		"y_coord": point.y_coord
	};
}

function west(point) {
	return {
		"x_coord": point.x_coord - 1,
		"y_coord": point.y_coord
	};
}

function south() {
	return [selected_grid_x, selected_grid_y + 1];
}

function northeast() {
	return [selected_grid_x + 1, selected_grid_y - 1];
}

function northwest(point) {
	return {
		"x_coord": point.x_coord - 1,
		"y_coord": point.y_coord - 1
	};
}

function southeast() {
	return [selected_grid_x + 1, selected_grid_y + 1];
}

function southwest() {
	return [selected_grid_x - 1, selected_grid_y + 1];
}

function center(point) {
	return {
		"x_coord": point.x_coord,
		"y_coord": point.y_coord
	};
}

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

	/* 
	*	ON CANVAS CLICKED
	*/
	socket.on('canvas_clicked', function(msg) {
		socket.emit('canvas_clicked', {
			"selected_grid_x" : msg.new_x,
			"selected_grid_y" : msg.new_y,
			"elements" : elementsToBeRedrawn(msg)
		});
	});

	socket.on('move_element', function(msg) {
		var ob = cells.find(function(el) {
			return coordinate_comparison(el, msg);
		});

		if (typeof ob === 'undefined') return;

		var direction = msg.direction;
		var move_to_x = ob.x_coord;
		var move_to_y = ob.y_coord;
		var id = ob.id;

		var from_x = ob.x_coord;
		var from_y = ob.y_coord;
		
		do {
			if (direction == "right") move_to_x++;
			else if (direction == "left") move_to_x--;
			else if (direction == "up") move_to_y--;
			else if (direction == "down") move_to_y++;
		} while (cells.findIndex(function(element) {
				return coordinate_comparison(element, {
					"x_coord": move_to_x,
					"y_coord": move_to_y
				})
			}) != -1);

		ob.x_coord = move_to_x;
		ob.y_coord = move_to_y;

		socket.emit('moving_element', { "x" : move_to_x, "y" : move_to_y, "elements" : elementsToBeRedrawn({ "old_x" : msg.x_coord, "old_y" : msg.y_coord }) });
		
		io.emit('move_element', { "from_x" : from_x, "from_y" : from_y, "element" : ob });
	});

	/* ADD ELEMENT TO SERVER */
	socket.on('add_element_to_server', function(msg) {
		var input = {
			"id": element_id_counter,
			"color": msg.color,
			"x_coord": JSON.parse(msg.x_coord),
			"y_coord": JSON.parse(msg.y_coord),
			"shape": msg.object_type,
			"name": msg.name !== "" ? msg.name : "object",
			"size": msg.size,
			"category": msg.category
		};
		cells.push(input);
		history.push({
			"action": "add",
			"item": input
		});

		element_id_counter++;

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
				if (Math.random() < 0.5) {
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
					
					io.emit('added_element', input);
				}
			}
		}
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
});

//Main driver for booting up the server
http.listen(8080, function() {
	console.log("%s:%s", http.address().address, http.address().port)
});

function coordinate_comparison(obj_1, obj_2) {
	if (obj_1.x_coord instanceof Array)
		return obj_1.x_coord.every(function(u, i) {
				return u === obj_2.x_coord[i];
			}) &&
			obj_1.y_coord.every(function(u, i) {
				return u === obj_2.y_coord[i];
			});
	else
		return obj_1.x_coord == obj_2.x_coord && obj_1.y_coord == obj_2.y_coord;
}

/* Should take in a grid point and a line and return whether the grid point clips the line 
 * Returns either the line segment that is clipped, or undefined
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
		for (; _start < _end; _start++) {
			grid_points.push({
				"x": starting_point.x,
				"y": _start
			});
		}
	} else
		for (var x_val = starting_point.x; x_val <= ending_point.x; x_val++) {
			y_val = Math.floor(m * x_val + b);
			var xy_pair = {
				"x": x_val,
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

//Determines the elements that need to be redrawn after the user has moved their cursor
function elementsToBeRedrawn(msg) {
	var ob = [];
		
		[ { "x_coord" : msg.old_x, "y_coord" : msg.old_y },
			{ "x_coord" : msg.old_x-1, "y_coord" : msg.old_y},
			{ "x_coord" : msg.old_x, "y_coord" : msg.old_y-1},
			{ "x_coord" : msg.old_x-1, "y_coord" : msg.old_y-1}]
		.forEach(function(cursor_space) {
			cells.forEach( function(el) {
				if(el.shape === 'line') {
					var out = check_for_clipped_regions(cursor_space, el);
					if(out !== undefined) {
						ob.push({ "element" : { "shape" : "line-segment", "x_coord" : [out[0].x,out[1].x], "y_coord" : [out[0].y,out[1].y], "color" : el.color } , "bbox" : cursor_space});
					}
				} else {
					if(coordinate_comparison(el,cursor_space))
						ob.push({ "element" : el});
				}
			});
		});
	
	return ob;
}
var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var log4js = require('log4js');
var log = log4js.getLogger();

var bodyParser = require('body-parser')

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

var element_id_counter = 1;
var grid_id_counter = 1;

const categories = ["npc","environment","enemy","player"]; 

/**
 * @class Objects which are representable in the grid space
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
function Element(id, x, y, type, color, size, category, name) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.type = type;
	this.color = color;
	this.size = size;
	this.category = category;
	this.name = name;
	
	/**
	 * Move the element 1 unit in a specific direction
	 */
	this.nudge = function(direction, gridSpace) {
		var moveToX = this.x, moveToY = this.y;
		switch(direction) {
			case 0: //right
				moveToX++;
				break;
			case 1: //up
				moveToY--;
				break;
			case 2: //left
				moveToX--;
				break;
			case 3: //down
				moveToY++;
				break;
		};
		
		if(gridSpace.findElementByPosition(moveToX, moveToY) === undefined) {
			this.x = moveToX;
			this.y = moveToY;
			
			return this;
		} else {
			return undefined;
		}
	};
	
	/**
	 * Move the element to a new grid location
	 */
	this.warp = function(x, y) {
		
	};
	
	this.mutate = function() {
		
	}
	
	this.rename = function() {
		
	}
	
	this.output = function() {
		
	}
}

/**
 * @class
 */
function GridSpace(width, height) {
	
	this.elementIdCounter = 1;
	this.id = grid_id_counter++;
	this.history = [];
	this.elements = [];
	this.width = width;
	this.height = height;
	
	this.resizeWidth = function(newWidth) {
		this.width = newWidth;
		return this.width;
	};
	
	this.resizeHeight = function(newHeight) {
		this.height = newHeight;
		return this.height;
	};
	
	this.findElementById = function(id) {
		return this.elements.find(function (el) { return el.id === id; })
	};
	
	this.findElementByPosition = function(x, y) {
		return this.elements.find(function (el) { return el.x === x && el.y === y; })
	};
	
	this.generateRandomBoardElements = function() {
		for (var w = 0; w < this.width; w++) {
			for (var h = 0; h < this.height; h++) {
				if (Math.random() < 0.4) {
					var input = new Element(
										elementIdCounter++,
										w + 1, //x
										h + 1, //y
										Math.random() < 0.5 ? "square" : "circle", //shape
										Math.floor(Math.random()*16777215).toString(16), //color
										Math.round(Math.random() * 3) + 1, //size
										categories[Math.floor(Math.random() * categories.length)],
										("rando" + h * w));
					
					if(isUndefined(this.elements.find(function(el) {
							return collision_detection(el, input); 
					} ))) {
						this.elements.push(input);
						this.element_id_counter++;
					
						io.emit('added_element', input);
					}
				}
			}
		}
	};
	
	this.addElementToGridSpace = function(obj) {
		var newElement = new Element(
				this.elementIdCounter++,
				obj.x,
				obj.y,
				obj.type,
				obj.color,
				obj.size,
				obj.category,
				obj.name
			);
		this.elements.push(newElement);
		return newElement;
	};
	
	this.removeElementFromGridSpace = function(id) {
		var ind = this.elements.findIndex( function(el) { return el.id === id; });
		this.elements.splice(ind, 1);
	}
	
	this.nudgeElement = function(x, y, direction) {
		return this.findElementByPosition(x, y).nudge(direction, this);
	}
	
	this.clickInGridSpace = function(x, y) {
		
	}
}

var history = [];

var grid_width = 1;
var grid_height = 1;

var grid_space = new GridSpace(grid_width, grid_height);

io.on('connection', function(socket) {
	console.log("a user connected");

	socket.on('init', function(msg) {
		socket.emit('init', { 
			"grid_width" : grid_space.width,
			"grid_height" : grid_space.height,
			"elements" : grid_space.elements
		});
	});
	
	socket.on('resize_height', function(msg) {
		grid_space.resizeHeight(msg.height);
		io.emit('resize_height', msg);
	});

	socket.on('resize_width', function(msg) {
		grid_space.resizeWidth(msg.width);
		io.emit('resize_width', msg);
	});

	socket.on('canvas_clicked', function(msg) {
		console.log(msg);
		var size = grid_space.findElementByPosition(function(el) { msg.new_x, msg.new_y });
		socket.emit('canvas_clicked', {
			"selected_grid_x" : !isUndefined(size) ? parseInt(size.x) : msg.new_x,
			"selected_grid_y" : !isUndefined(size) ? parseInt(size.y) : msg.new_y,
			"size" : !isUndefined(size) ? parseInt(size.size) : 1
		});
	});

	socket.on('move_element', function(msg) {
		//var ob = cells.find(function(el) {
		//	return coordinate_comparison(el, msg);
		//});

		var movedElement = grid_space.nudgeElement(msg.x, msg.y, msg.direction);
		console.log(movedElement);
		
		//if (typeof ob === 'undefined') return;
		
		//var direction = msg.direction;
		//var move_to_x = ob.x;
		//var move_to_y = ob.y;
		//var size = ob.size;
		//var id = ob.id;

		//var from_x = ob.x;
		//var from_y = ob.y;

		//if (direction == "right") move_to_x++;
		//else if (direction == "left") move_to_x--;
		//else if (direction == "up") move_to_y--;
		//else if (direction == "down") move_to_y++;
		
		//If there is NOT an element already where we are trying to move this element to...
		//if(!cells.find(function(el) {
		//	return id === el.id ? false : collision_detection(el, {"x" : move_to_x, "y" : move_to_y, "size" : size});
		//	})) 
		//{
		//	ob.x = move_to_x;
		//	ob.y = move_to_y;
			//Notify everyone EXCEPT this socket
		socket.broadcast.emit('move_element', { "from_x" : msg.x, "from_y" : msg.y, "element" : movedElement, "elements" : {}});
			//Notify ONLY this socket
		socket.emit('moving_element', { "x" : msg.x, "y" : msg.y, "size" : movedElement.size, "element" : movedElement, "elements" : {}});
		//}
	});

	/* ADD ELEMENT TO SERVER */
	socket.on('add_element_to_server', function(msg) {
		var input = new Element(element_id_counter++,
								JSON.parse(msg.x_coord), 
								JSON.parse(msg.y_coord), 
								msg.object_type, 
								msg.color, 
								JSON.parse(msg.size), 
								msg.category,
								msg.name !== null ? msg.name : "object");
		
		io.emit('added_element', grid_space.addElementToGridSpace(input));
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
				if (Math.random() < 0.4) {
										
					var input = new Element(
									w + 1, //x
									h + 1, //y
							Math.random() < 0.5 ? "square" : "circle", //shape
							Math.floor(Math.random()*16777215).toString(16), //color
							Math.round(Math.random() * 3) + 1, //size
							categories[Math.floor(Math.random() * categories.length)],
							("rando" + h * w));
					
					if(isUndefined(cells.find(function(el) {
							return collision_detection(el, input); 
					} ))) {
						cells.push(input);
						element_id_counter++;
					
						io.emit('added_element', input);
					}
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
	
	socket.on('select_element_from_list', function(msg) {
		console.log(msg);
		var element = cells.find( function(el) { return el.id === msg.id } );
		var element_to_redraw = elementsToBeRedrawn({ "old_x" : msg.selected_grid_x, "old_y" : msg.selected_grid_y });
		element_to_redraw.push(cells.find( function(el) { return coordinate_comparison(el, { "x" : msg.selected_grid_x, "y" : msg.selected_grid_y } ) } ));
		socket.emit('selected_element_from_list', (isUndefined(element) ? { "selected_element" : { "x" : -1, "y" : -1 }} : { "selected_element" : element , "redraw_element" : element_to_redraw}));
	});
});

// Main driver for booting up the server
http.listen(8080, function() {
	console.log("%s:%s", http.address().address, http.address().port)
});

/**
 * Determine if two objects are lines with matching vertices, or if two objects have overlapping coordinates
 * Need to fix by incorporating both elements sizes instead of just one 
 *
 * @param obj_1
 * @param obj_2
 * @returns
 */
function coordinate_comparison(obj_1, obj_2) {
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
	for(var i=1; i<line.x.length; i++) {
		var line_segment = [{ "x" : line.x[i-1], "y" : line.y[i-1]}, {"x" : line.x[i], "y" : line.y[i]}];
		if(typeof calculate_grid_points_on_line({ "x" : line.x[i-1], "y" : line.y[i-1]}, {"x" : line.x[i], "y" : line.y[i]})
			 .find(function(el) {
					return grid_location.x === el.x && grid_location.y === el.y ? true : undefined;
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
				if(el.type === 'line') {
					var out = check_for_clipped_regions(cursor_space, el);
					if(out !== undefined) {
						ob.push({ "element" : { "type" : "line-segment", "x" : [out[0].x,out[1].x], "y" : [out[0].y,out[1].y], "color" : el.color } , "bbox" : cursor_space});
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
 * Detect it two elements are colliding
 *
 * @param {Element} obj_1 -
 * @param {Element} obj_2 -
 * @returns {Boolean} True if the objects are colliding; False otherwise 
 */
function collision_detection(obj_1, obj_2) {
	return obj_1.x < obj_2.x + obj_2.size &&
					obj_1.x + obj_1.size > obj_2.x &&
					obj_1.y < obj_2.y + obj_2.size &&
					obj_1.y + obj_1.size > obj_2.y;
}

/**
 * 
 * @param value
 * @returns
 */
function isUndefined(value) {
	return value === undefined;
}
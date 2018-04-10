/**
 * @fileOverview A server for handling objects which are drawable on a canvas
 * @author Nathan Abramyk
 * @copyright Nathan Abramyk 2018
 * @version 1.0.0
 */

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

const shapes = ["square","circle","line"];
const categories = ["npc","environment","enemy","player"]; 

/**
 * @class Objects which are representable in the grid space
 *
 * @constructor
 * @property {int} id - unique numerical identifier of this element
 * @property {int} x - horizontal grid coordinate of the element
 * @property {int} y - vertical grid coordinate of the element
 * @property {string} type - the geometric shape this element represents
 * @property {string} color - the hexadecimal value of the element color
 * @property {int} size - the amount of grid spaces this elements spans across
 * @property {string} category - the meta group this element belongs to
 * @property {string} name - the unique name of this element
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
	 * @param {String} direction - the direction to move this element
	 * @return {Element|undefine} This element at its new position, or undefined if it cannot move
	 */
	this.nudge = function(direction, gridSpace) {
		var moveToX = this.x, moveToY = this.y;
		switch(direction) {
			case "right": //right
				moveToX++;
				break;
			case "up": //up
				moveToY--;
				break;
			case "left": //left
				moveToX--;
				break;
			case "down": //down
				moveToY++;
				break;
		}
		
		if(gridSpace.elements.find( function(el) { el.collide(this) } ) === undefined) {
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
	
	/**
	 * Modify this elements properties
	 * 
	 */
	this.mutate = function(modifiedElement) {
		
	}
	
	/**
	 * Return this elements properties and stripped of its methods
	 * @return {JSON} The properties of this element
	 */
	this.condense = function() {
		return { "id" : this.id,
					   "x" : this.x,
					   "y" : this.y,
					   };
	}
	
	/**
	 * Determine if this element is colliding with another
	 * @param {Element} element - another element in the grid space
	 * @return {boolean} True if both elements collide, false otherwise
	 */
	this.collide = function(element) {
		return element.x < this.x + this.size &&
				element.x + element.size > this.x &&
				element.y < this.y + this.size &&
				element.y + element.size > this.y;
	}
	
	/**
	 * Determine if a sinlge point is contained within this element
	 * @param {int} x - horizontal grid position
	 * @param {int} y - vertical grid position
	 * @return {boolean} True if this point is is within this element, false otherwise
	 */
	this.within = function(x, y) {
		return this.x <= x && this.x + this.size > x && 
				this.y <= y && this.y + this.size > y;
	}
}

/**
 * @class
 *
 * @constructor
 * @property {int} elementIdCounter 
 * @property {int} id - unique numerical identifier for this grid space
 * @property {int} history - 
 * @property [Element] - collection of displayable elements in this grid space
 * @property {int} width - amount of horizontal grid points in this space
 * @property {int} height - amount of vertical grid points in this space
 */
function GridSpace(width, height) {
	
	this.elementIdCounter = 1;
	this.id = grid_id_counter++;
	this.history = [];
	this.elements = [];
	this.width = width;
	this.height = height;
	
	/**
	 * Set the grid space width
	 * @param {int} newWidth - the new width of the grid space
	 * @return {int} The new width of the grid space
	 */
	this.resizeWidth = function(newWidth) {
		this.width = newWidth;
		return this.width;
	};
	
	/**
	 * Set the grid space height
	 * @param {int} newHeight - the new height of the grid space
	 * @return {int} The new height of the grid space
	 */
	this.resizeHeight = function(newHeight) {
		this.height = newHeight;
		return this.height;
	};
	
	/**
	 * Find the element with the corresponding ID
	 * @param {int} id - the unique numerical identifier to search for
	 * @return {(Element|undefined)} The element with the matching id, or undefined if no element with that id exists
	 */
	this.findElementById = function(id) {
		return this.elements.find(function (el) { return el.id === id; })
	};
	
	/**
	 * Find the element at the specified position
	 * @param {int} x - x grid point 
	 * @param {int} y - y grid point
	 * @return {(Element|undefined)} The element at this position, or undefined if no element is there
	 */
	this.findElementByPosition = function(x, y) {
		return this.elements.find(function (el) { return el.within(x, y); });
	};
	
	/***/
	this.hasElementAtPosition = function(x, y) {
		console.log(this.elements.find(function (el) { return el.within(x, y); }));
		return this.elements.find(function (el) { return el.within(x, y); }) !== undefined;
	}
	
	/**
	 * Generate a grid space of random elements
	 * @return [Element] An array of drawables elements
	 */
	this.generateRandomBoardElements = function() {
		for (var w = 0; w < this.width; w++) {
			for (var h = 0; h < this.height; h++) {
				if (Math.random() < 0.1) {
					
					var type = shapes[Math.floor(Math.random() * (shapes.length-1))];
					
					var y = [];
					var x = [];
					
					//todo uncomment in order to insert randomized lines
					//if(type === "line") {
						//while(Math.random() < 0.5) {
							//x.push(Math.floor(Math.random() * this.width));
							//y.push(Math.floor(Math.random() * this.height));
						//}
					//} else {
						x = w + 1;
						y = h + 1;
					//}
					
					var input = new Element(
												this.elementIdCounter++,
												x, //x
												y, //y
												type, //shape
												Math.floor(Math.random()*16777215).toString(16), //color
												Math.round(Math.random() * 3) + 1, //size
												categories[Math.floor(Math.random() * categories.length)],
												("rando" + h * w)
					);
					
					if(this.elements.find(function(el) {
							return collision_detection(el, input); 
						}) === undefined ) {
						this.elements.push(input);
					}
				}
			}
		}

		return this.elements;
	};
	
	/**
	 * Add an element to the grid space
	 * @param {Element} obj - the element to add to the grid space
	 * @return {Element} the newly added element
	 */
	this.addElementToGridSpace = function(obj) {
		if(this.hasElementAtPosition(obj.x, obj.y))
			return undefined;
			
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
	
	/**
	 * Delete an element from the grid space
	 * @param {int} id - the unique numerical id of an element
	 * @return nothing
	 */
	this.removeElementFromGridSpace = function(id) {
		var ind = this.elements.findIndex( function(el) { return el.id === id; });
		this.elements.splice(ind, 1);
	};
	
	/**
	 * Deletes all elements from the grid space
	 * @return the newly emptied list
	 */
	this.removeAllElementsFromGridSpace = function() {
		var returnGridSpace = this.elements.slice();
		this.elements = [];
		return returnGridSpace;
	}
	
	/**
	 * Moves an element 1 grid unit
	 * @param {int} x - horizontal grid position
	 * @param {int} y - vertical grid position
	 * @param {String} direction - the direction to move the element
	 * @return {Element|undefined} The element at its new position, or undefined
	 */
	this.nudgeElement = function(x, y, direction) {
		console.log(this.findElementByPosition(x, y));
			try { 
				return this.findElementByPosition(x, y).nudge(direction, this);
			} catch(e) {
				return undefined; 
			}
	}
	
	/***/
	this.clickInGridSpace = function(x, y) {
		return this.elements.find( function(el) { return el.within(x, y) });
	}
	
	/**
	 *
	 */
	this.gatherElementsFromCategories = function(filters) {
		return this.elements
					.filter( function(el) { 
						return filters.indexOf(el.category) != -1 
					});
	}
}

var grid_space = new GridSpace(1, 1);

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
		var size = grid_space.clickInGridSpace(msg.new_x, msg.new_y);
		console.log(msg, size);
		socket.emit('canvas_clicked', {
			"selected_grid_x" : !isUndefined(size) ? parseInt(size.x) : msg.new_x,
			"selected_grid_y" : !isUndefined(size) ? parseInt(size.y) : msg.new_y,
			"size" : !isUndefined(size) ? parseInt(size.size) : 1,
			"elements" : elementsToBeRedrawn(msg.old_x, msg.old_y)
		});
	});

	socket.on('move_element', function(msg) {

		var movedElement = grid_space.nudgeElement(msg.x, msg.y, msg.direction);
		
		if (typeof movedElement === 'undefined') return;
		
		socket.broadcast.emit('move_element', { "from_x" : msg.x, "from_y" : msg.y, "element" : movedElement, "elements" : {}});
		socket.emit('moving_element', { "x" : msg.x, "y" : msg.y, "size" : movedElement.size, "element" : movedElement, "elements" : {}});
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
		grid_space
			.generateRandomBoardElements()
			.forEach(function(el) {
				io.emit('added_element', el);
		});
	});
	
	socket.on('reset_board', function(msg) {
		grid_space
			.removeAllElementsFromGridSpace()
			.forEach(function(el) {
				console.log(el);
				io.emit('removed_element', el);
		})
	});
	
	socket.on('get_elements_list', function(msg) {
		socket.emit('retrieve_elements_list', grid_space.gatherElementsFromCategories(msg.filter));
	});
	
	socket.on('select_element_from_list', function(msg) {
		var element = grid_space.findElementById(msg.id);
		var element_to_redraw = elementsToBeRedrawn({ "old_x" : msg.selected_grid_x, "old_y" : msg.selected_grid_y });
		element_to_redraw.push(element);
		console.log(element_to_redraw.length);
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
function elementsToBeRedrawn(old_x, old_y) {
	var ob = [];
		
		[ { "x" : old_x, "y" : old_y },
			{ "x" : old_x-1, "y" : old_y},
			{ "x" : old_x, "y" : old_y-1},
			{ "x" : old_x-1, "y" : old_y-1}]
		.forEach(function(cursor_space) {
			grid_space.elements.forEach( function(el) {
				if(el.type === 'line') {
					var out = check_for_clipped_regions(cursor_space, el);
					if(out !== undefined) {
						ob.push({ "element" : { "type" : "line-segment", "x" : [out[0].x,out[1].x], "y" : [out[0].y,out[1].y], "color" : el.color } , "bbox" : cursor_space});
					}
				} else {
					if(coordinate_comparison(el,cursor_space))
						ob.push({ "element" : el });
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
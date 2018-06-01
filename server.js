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
	 * 
	 * @param {String}
	 *            direction - the direction to move this element
	 * @return {Element|undefine} This element at its new position, or undefined
	 *         if it cannot move
	 */
	this.nudge = function(direction, gridSpace) {
		var moveToX = this.x, moveToY = this.y, moveToSize = this.size;
		switch(direction) {
			case "right": // right
				moveToX++;
				break;
			case "up": // up
				moveToY--;
				break;
			case "left": // left
				moveToX--;
				break;
			case "down": // down
				moveToY++;
				break;
		}

		if(gridSpace.elements.find( function(el) { return el.collide(moveToX, moveToY, moveToSize, id); } ) === undefined) {
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
	this.warp = function(x, y, gridSpace) {
		var moveToSize = this.size;
    var moveToId = this.id;
		if(gridSpace.elements.find( function(el) { return el.collide(x, y, moveToSize, moveToId); } ) === undefined) {
			this.x = x;
			this.y = y;

			return this;
		} else {
			return undefined;
		}
	};
	
	/**
	 * Modify this elements properties
	 * 
	 */
	this.mutate = function(modifiedElement) {
		console.log("before: " + this.toString());
		this.type = modifiedElement.type;
		this.name = modifiedElement.name;
		this.category = modifiedElement.category;
		this.color = modifiedElement.color;
		this.size = parseInt(modifiedElement.size);
		console.log("after: " + this.toString());
		return this;
	}
	
	/**
	 * Return this elements properties and stripped of its methods
	 * 
	 * @return {JSON} The properties of this element
	 */
	this.condense = function() {
		return {};
	}
	
	/**
	 * Determine if this element is colliding with another
	 * 
	 * @param {int}
	 *            x - horizontal coordinate of comparing element
	 * @param {int}
	 *            y - vertical coordinate of comparing element
	 * @param {int}
	 *            size - numerical span of comparing element
	 * @param {int}
	 *            id - unique identifier of comparing element
	 * @return {boolean} True if both elements collide, false otherwise
	 */
	this.collide = function(x, y, size, id) {
		return id != this.id &&
				x < this.x + this.size &&
				x + size > this.x &&
				y < this.y + this.size &&
				y + size > this.y;
	}
	
	/**
	 * Determine if a sinlge point is contained within this element
	 * 
	 * @param {int}
	 *            x - horizontal grid position
	 * @param {int}
	 *            y - vertical grid position
	 * @return {boolean} True if this point is is within this element, false
	 *         otherwise
	 */
	this.within = function(x, y) {
		return this.x <= x && this.x + this.size > x && 
				this.y <= y && this.y + this.size > y;
	}
  
  this.toString = function() {
    return "[id: " + this.id + ", x: " + this.x + ", y:" + this.y + ", type: " + this.type + ", color: " + this.color + ", size: " + this.size + ", category: " + this.category + ", name: " + this.name + "]";
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
  this.annotationsIdCounter = 1;
	this.id = grid_id_counter++;
	this.history = [];
	this.elements = [];
  this.annotations = [];
	this.width = width;
	this.height = height;
	this.name = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 7);
	
	/**
	 * Set the grid space width
	 * 
	 * @param {int}
	 *            newWidth - the new width of the grid space
	 * @return {int} The new width of the grid space
	 */
	this.resizeWidth = function(newWidth) {
		this.width = newWidth;
		return this.width;
	};
	
	/**
	 * Set the grid space height
	 * 
	 * @param {int}
	 *            newHeight - the new height of the grid space
	 * @return {int} The new height of the grid space
	 */
	this.resizeHeight = function(newHeight) {
		this.height = newHeight;
		return this.height;
	};
	
	/**
	 * Find the element with the corresponding ID
	 * 
	 * @param {int}
	 *            id - the unique numerical identifier to search for
	 * @return {(Element|undefined)} The element with the matching id, or
	 *         undefined if no element with that id exists
	 */
	this.findElementById = function(id) {
		return this.elements.find(function (el) { return el.id == id; })
	};
	
	/**
	 * Find the element at the specified position
	 * 
	 * @param {int}
	 *            x - x grid point
	 * @param {int}
	 *            y - y grid point
	 * @return {(Element|undefined)} The element at this position, or undefined
	 *         if no element is there
	 */
	this.findElementByPosition = function(x, y) {
		return this.elements.find(function (el) { return el.within(x, y); });
	};
	
	/***/
	this.hasElementAtPosition = function(x, y) {
		return this.elements.find(function (el) { return el.within(x, y); }) !== undefined;
	}
	
	/**
	 * Generate a grid space of random elements
	 * 
	 * @return [Element] An array of drawables elements
	 */
	this.generateRandomBoardElements = function() {
		for (var w = 0; w < this.width; w++) {
			for (var h = 0; h < this.height; h++) {
				if (Math.random() < 0.1) {
					
					var type = shapes[Math.floor(Math.random() * shapes.length)];
					
					var y = [];
					var x = [];
					
					// todo uncomment in order to insert randomized lines
					if(type == "line") {
						while(Math.random() < 0.5) {
							x.push(Math.ceil(Math.random() * this.width));
							y.push(Math.ceil(Math.random() * this.height));
						}
            
            while(x.length < 2) {
              x.push(Math.ceil(Math.random() * this.width));
              y.push(Math.ceil(Math.random() * this.height));
            }
 					} else {
						x = w + 1;
						y = h + 1;
				  }
					
					var input = new Element(
												this.elementIdCounter++,
												x, // x
												y, // y
												type, // shape
												Math.floor(Math.random()*16777215).toString(16), // color
												Math.round(Math.random() * 3) + 1, // size
												categories[Math.floor(Math.random() * categories.length)],
												("rando" + h * w)
					);
					          
					if(this.elements.find(function(el) {
              return el.collide(input.x, input.y, input.size, input.id);
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
	 * 
	 * @param {Element}
	 *            obj - the element to add to the grid space
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
  
  this.addAnnotationToGridSpace = function(obj) {
    var newAnnotation = {
      "id" : this.annotationsIdCounter++,
      "title" : obj.title,
      "content" : obj.content,
      "x" : obj.x,
      "y" : obj.y
    };
    
    this.annotations.push(newAnnotation);
    return newAnnotation;
  }
	
	/**
	 * Delete an element from the grid space
	 * 
	 * @param {int}
	 *            id - the unique numerical id of an element
	 * @return {Element} The removed element
	 */
	this.removeElementFromGridSpace = function(id) {
		var ind = this.elements.findIndex( function(el) { return el.id === id; });
		var return_element = this.elements[ind];
		this.elements.splice(ind, 1);
		return return_element;
	};
	
	/**
	 * Deletes all elements from the grid space
	 * 
	 * @return the newly emptied list
	 */
	this.removeAllElementsFromGridSpace = function() {
		var returnGridSpace = this.elements.slice();
		this.elements = [];
		return returnGridSpace;
	}
	
	/**
	 * Moves an element 1 grid unit
	 * 
	 * @param {int}
	 *            x - horizontal grid position
	 * @param {int}
	 *            y - vertical grid position
	 * @param {String}
	 *            direction - the direction to move the element
	 * @return {Element|undefined} The element at its new position, or undefined
	 */
	this.nudgeElement = function(x, y, direction) {
			try { 
				return this.findElementByPosition(x, y).nudge(direction, this);
			} catch(e) {
				return undefined; 
			}
	}
	
	this.warpElement = function(x, y, dest_x, dest_y) {
		try { 
			return this.findElementByPosition(x, y).warp(dest_x, dest_y, this);
		} catch(e) {
			return undefined; 
		}
	}
	
  this.gatherElementsWithinRegion = function(region) {
    
  }
  
	/**
	 * 
	 */
	this.historyUndo = function() {
		
	}
	
	/**
	 * 
	 */
	this.historyRedo = function() {
		
	}
}

var grid_space = [new GridSpace(1, 1)];

io.on('connection', function(socket) {
	console.log("a user connected");

	socket.on('init', function(msg) {
		socket.emit('init', { 
			"grid_width" : grid_space[0].width,
			"grid_height" : grid_space[0].height,
			"elements" : grid_space[0].elements,
      "annotations" : grid_space[0].annotations,
      "spaces" : grid_space.map(function(el) { return { "id" : el.id, "name" : el.name } })
		});
	});
	
	socket.on('resize_height', function(msg) {
    var temp = grid_space.find(function(el) { return msg.grid_id == el.id });
		temp.resizeHeight(msg.height);
		io.emit('resize_height', {
      "grid_id" : msg.grid_id,
			"height" : msg.height,
			"elements" : temp.elements
		});
	});

	socket.on('resize_width', function(msg) {
    var temp = grid_space.find(function(el) { return msg.grid_id == el.id });
		temp.resizeWidth(msg.width);
		io.emit('resize_width', {
      "grid_id" : msg.grid_id,
			"width" : msg.width,
			"elements" : temp.elements
		});
	});

	socket.on('move_element', function(msg) {
		var movedElement = grid_space.find(function(el) { return msg.grid_id == el.id }).nudgeElement(msg.x, msg.y, msg.direction);
		if (typeof movedElement === 'undefined') return;
		
		io.emit('move_element', { "grid_id" : msg.grid_id, "element" : movedElement });
		socket.emit('moving_element', { "x" : movedElement.x, "y" : movedElement.y, "size" : movedElement.size});
	});

	socket.on('warp_element', function(msg) {
		var movedElement = grid_space.find(function(el) { return msg.grid_id == el.id }).warpElement(msg.x, msg.y, msg.dest_x, msg.dest_y);
		if (typeof movedElement === 'undefined') { 
      socket.emit('error_channel', { "message" : "Somethings already there! " });
      return; 
    }
		
		io.emit('move_element', { "grid_id" : msg.grid_id, "element" : movedElement });
		socket.emit('moving_element', { "x" : movedElement.x, "y" : movedElement.y, "size" : movedElement.size});
	});
	
	/* ADD ELEMENT TO SERVER */
	socket.on('add_element_to_server', function(msg) {
    
		var input = new Element(0,
								JSON.parse(msg.x_coord), 
								JSON.parse(msg.y_coord), 
								msg.object_type, 
								msg.color, 
								JSON.parse(msg.size), 
								msg.category,
								msg.name !== null ? msg.name : "object");
		
		var output = grid_space
                        .find(function(el) { return el.id == msg.grid_id })
                        .addElementToGridSpace(input);
    
		isUndefined(output) ? socket.emit('added_element', output) : io.emit('added_element', { "grid_id" : msg.grid_id, "element" : output });
	});
	
	socket.on('delete_element_on_server', function(msg) {
		var temp = grid_space.find(function(el) { return el.id == msg.grid_id }).removeElementFromGridSpace(msg.element_id);
		io.emit('removed_element', { "grid_id" : msg.grid_id, "element_id" : msg.element_id });
	});
  
  socket.on('edit_element_on_server', function(msg) {
    console.log(msg);
    var temp = grid_space.find(function(el) { return el.id == msg.grid_id }).findElementById(msg.id).mutate(msg);
    io.emit('edited_element', { "grid_id" : msg.grid_id, "element" : temp });
  });
	
	socket.on('randomize', function(msg) {
		var temp = grid_space.find(function(el) { return el.id == msg.grid_id });
		temp.generateRandomBoardElements();
    io.emit('added_elements', { "grid_id" : msg.grid_id, "element" : temp.elements });
	});
	
	socket.on('reset_board', function(msg) {
		grid_space.find(function(el) { return el.id == msg.grid_id }).removeAllElementsFromGridSpace();
		io.emit('reset_grid', { "grid_id" : msg.grid_id });
	});
  
  socket.on('create_grid_space', function(msg) {
    var newGridSpace = grid_space.push(new GridSpace(1, 1));
    io.emit('new_grid_space', { "id" : grid_space[newGridSpace - 1].id, "name" : grid_space[newGridSpace - 1].name });
  });
  
  socket.on('request_grid_space', function(msg) {
    var grid = grid_space.find(function(el) { return el.id == msg.id; });
    socket.emit('request_grid_space', { "grid_space" : grid });
  });
  
  socket.on('delete_grid_space_from_server', function(msg) {
	if(grid_space.length <= 1) {
		socket.emit('error_channel', { "message" : "Cannot have 0 grid spaces, you ass hat."});
		return;
	}
    grid_space.splice(grid_space.indexOf(grid_space.find(function(el) {return msg.grid_id == el.id; })),1);
    io.emit('delete_grid_space', { "grid_id" : msg.grid_id });
  });
  
  socket.on('rename_grid', function(msg) {
	  grid_space.find(function(el) { return el.id == msg.grid_id }).name = msg.grid_name;
	  io.emit('renaming_grid', msg);
  });
  
  socket.on('add_annotation_to_server', function(msg) {
    io.emit('added_annotation', { "grid_id" : msg.grid_id, "annotation" : grid_space.find(function(el) { return el.id == msg.grid_id }).addAnnotationToGridSpace(msg) });
    console.log(grid_space.find(function(el) { return el.id == msg.grid_id }).annotations);
  });
  
  socket.on('remove_annotation_from_server', function(msg) {
    
  });
});

// Main driver for booting up the server
http.listen(8080, function() {
	console.log("%s:%s", http.address().address, http.address().port)
});

/**
 * Determine if two objects are lines with matching vertices, or if two objects
 * have overlapping coordinates Need to fix by incorporating both elements sizes
 * instead of just one
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
 * Detect it two elements are colliding
 * 
 * @param {Element}
 *            obj_1 -
 * @param {Element}
 *            obj_2 -
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
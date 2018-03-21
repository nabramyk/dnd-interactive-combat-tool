//This server requires the 'express' NodeJS server framework
var express = require('express');
var app = express();
var log4js = require('log4js');
var log = log4js.getLogger();

var bodyParser = require('body-parser')

var element_id_counter = 1;

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

/* Function for updating the users view when called
 * 
 * Recieves: a json array containing the list of elements which are currently displayed
 * on that individual page
 * 
 * Sends: a vector of actions which the page will use to correct itself to the servers model
 */
app.post('/update', function(req, res) {

	//Parse the user call and store the list of live objects from the user in an array
	var live_objects = JSON.parse(req.body.live_objects);

	//Initialize the correction vector for returning the actions the webpage must take in
	//order to be up to date with the server model
	var correction_vector = [];

	correction_vector.push({
		"width": grid_width,
		"height": grid_height
	});

	//For each live element in the user's model...
	live_objects.forEach(function(el, ind, arr) {
		//...if this live element does not exist in the server's grid...
		if (cells.findIndex(function(el2) {
				return coordinate_comparison(el, el2);
			}) == -1) {
			//push to the correction vector so that it is removed from the user's grid
			correction_vector.push({
				"action": "erase",
				"item": el
			});
		}

	});

	//For each live element in the server model...
	cells.forEach(function(el, ind, arr) {
		//...if this live element does not exist in the user's grid...
		if (live_objects.findIndex(function(el2) {
				return coordinate_comparison(el, el2);
			}) == -1) {
			//...push to the correction vector so that it is added to the user's grid
			correction_vector.push({
				"action": "add",
				"item": el
			});
		}

		if (live_objects.find(function(el2) {
				return (el2.name !== el.name ||
					el2.category !== el.category ||
					el2.color !== el.color ||
					el2.size !== el.size ||
					el2.shape !== el.shape) && coordinate_comparison(el, el2);
			})) {
			correction_vector.push({
				"action": "edit",
				"item": el
			})
		}
	});

	//Return the correction vector as a json array
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(correction_vector));
});

//Function for modifying the servers internal model of the grid board
app.post('/delete_element', function(req, res) {

	var id = JSON.parse(req.body.id);

	//For each element in the internal state...
	cells.find(function(el, ind, arr) {
		if (el.id == id) {
			console.log("Deleted: " + JSON.stringify(req.body));
			history.push({
				"action": "delete",
				"item": cells[ind]
			});
			cells.splice(ind, 1);
			return true;
		}
	});

	res.setHeader('Content-Type', 'application/json');
	res.send("Done");
});

app.post('/add_element', function(req, res) {
	//Parse the input request and store it as a JSON object
	var input = {
		"id": element_id_counter,
		"color": req.body.color,
		"x_coord": JSON.parse(req.body.x_coord),
		"y_coord": JSON.parse(req.body.y_coord),
		"shape": req.body.object_type,
		"name": req.body.name !== "" ? req.body.name : "object",
		"size": req.body.size,
		"category": req.body.category
	};

	console.log("Added: " + JSON.stringify(input));

	cells.push(input);
	history.push({
		"action": "add",
		"item": input
	});

	res.setHeader('Content-Type', 'application/json');
	res.send("Done");

	element_id_counter++;
});

app.post('/edit_element', function(req, res) {
	var id = JSON.parse(req.body.id);
	var ob = cells.find(function(el) {
		return el.id == id;
	});
	ob.name = req.body.name;
	ob.shape = req.body.shape;
	ob.color = req.body.color;
	ob.size = req.body.size;
	ob.category = req.body.category;
	console.log("Renamed: " + JSON.stringify(req.body));
	res.setHeader('Content-Type', 'application/json');
	res.send({
		message: "message"
	});
});

app.post('/move_element', function(req, res) {

	var ob = cells.find(function(el) {
		return el.x_coord == req.body.from_x && el.y_coord == req.body.from_y
	});

	if (typeof ob === 'undefined') {
		res.status(400).json({
			"error": req.body.from_x
		});
		return;
	}

	var direction = req.body.direction;
	var move_to_x = ob.x_coord;
	var move_to_y = ob.y_coord;
	var id = ob.id;

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

	console.log("Moved: " + JSON.stringify(req.body));

	res.status(200).json({
		"id": id,
		"position_x": ob.x_coord,
		"position_y": ob.y_coord
	});
});

app.post('/resize_grid', function(req, res) {
	grid_width = JSON.parse(req.body.width);
	grid_height = JSON.parse(req.body.height);
	console.log("Resized: " + JSON.stringify(req.body));

	res.status(200).json({
		"width": grid_width,
		"height": grid_height
	});
});

app.post('/undo_action', function(req, res) {
	res.status(200);
});

app.post('/redo_action', function(req, res) {
	res.status(200);
});

app.post('/randomize', function(req, res) {
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
			}
		}
	}
});

app.post('/reset', function(req, res) {
	cells = [];
});

app.post('/canvas_clicked', function(req, res) {
	
	var temp = { "x_coord" : JSON.parse(req.body.x_coord),
							 "y_coord" : JSON.parse(req.body.y_coord)
						};
		
	var elements_to_redraw = cells.filter(function (el) {
		return coordinate_comparison(el, center(temp)) ||
					 coordinate_comparison(el, north(temp)) ||
					 coordinate_comparison(el, northwest(temp)) ||
					 coordinate_comparison(el, west(temp));
	});
	
	var lines = cells.filter(function(element) {
		return element.shape === "line";
	});
	
	elements_to_redraw = elements_to_redraw.concat(check_for_clipped_regions(center(temp), lines));
	
	res.status(200).json({
		"selected_grid" : req.body,
		"redraw_items" : elements_to_redraw,
	});

});




//HELPERS
function north(point) {
	return { "x_coord" : point.x_coord, "y_coord": point.y_coord - 1 };
}

function east(point) {
	return { "x_coord" : point.x_coord + 1, "y_coord" : point.y_coord };
}

function east2(point) {
	return { "x_coord" : point.x_coord + 1 * 2, "y_coord" : point.y_coord };
}

function west(point) {
	return { "x_coord" : point.x_coord - 1, "y_coord" : point.y_coord};
}

function south() {
	return [selected_grid_x, selected_grid_y + 1];
}

function northeast() {
	return [selected_grid_x + 1, selected_grid_y - 1];
}

function northwest(point) {
	return { "x_coord" : point.x_coord - 1, "y_coord" : point.y_coord - 1 };
}

function southeast() {
	return [selected_grid_x + 1, selected_grid_y + 1];
}

function southwest() {
	return [selected_grid_x - 1, selected_grid_y + 1];
}

function center(point) {
	return { "x_coord" : point.x_coord, "y_coord" : point.y_coord };
}
//





function check_for_clipped_regions(grid_location, lines) {
	var grid_x = grid_location.x_coord,
			grid_y = grid_location.y_coord;
	
	var grid_points = [];
	var redraw_line = [];
	
	//Execute function for each set of line segments
	lines.forEach(function(element, ind, arr) {

		var vertices_x = element.x_coord;
		var vertices_y = element.y_coord;
		
		for (var i = 1; i < vertices_x.length; i++) {
			grid_points = grid_points.concat(calculate_grid_points_on_line({
				"x": vertices_x[i - 1],
				"y": vertices_y[i - 1]
			}, {
				"x": vertices_x[i],
				"y": vertices_y[i]
			}));
			
			if(grid_points.find( function(el) { return el.x === grid_x && el.y === grid_y; }) != 'undefined') {
				grid_points.forEach(function(el) {
					redraw_line.push({ "action" : "erase", "element" : el });
				})
				redraw_line.push({ "action" : "draw", 
													"element" : {
															"shape" : "line",
															"x_coord" : [vertices_x[i - 1],vertices_x[i]],
															"y_coord" : [vertices_y[i - 1],vertices_y[i]],
															"color" : element.color,
															"size" : 0
													}
												 }
												);
			}
		}
	});
	
	return redraw_line;
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







//Main driver for booting up the server
var server = app.listen(8080, function() {
	var host = server.address().address
	var port = server.address().port

	console.log("%s:%s", host, port)
})
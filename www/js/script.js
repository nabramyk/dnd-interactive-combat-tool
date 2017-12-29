var grid_size = 20;
var grid_count_width = 30;
var grid_count_height = 24;
var update_interval = 200;

var grid_canvas, ctx;
var live_objects = new Array();

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
	ctx = grid_canvas.getContext('2d');

	if (!canvasSupport(grid_canvas)) {
		return;
	}

	grid_canvas.width = grid_size * grid_count_width;
	grid_canvas.height = grid_size * grid_count_height;

	grid_canvas.addEventListener('click', function(event) {
		drawElement(event);
	}, false);

	grid_canvas.addEventListener('touchend', function(event) {
		drawElement(event);
	}, false);

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

	drawScreen();
}

/*
 * 
 */
function drawScreen() {

	//Set the initial x and y coordinate counters
	var x = 0;
	var y = 0;
	
	//Retrieve the width and height of the canvas
	var w = grid_canvas.width;
	var h = grid_canvas.height;

	//Set the width of the lines that are to be drawn
	ctx.lineWidth = 1;

	//Draw the horizontal lines of the grid
	while (y <= h - grid_size) {
		ctx.moveTo(x, y);
		ctx.lineTo(w, y);
		ctx.stroke();
		y = y + grid_size;
	}

	//Draw the bottom bounding line
	ctx.moveTo(0, h - 1);
	ctx.lineTo(w, h - 1);
	ctx.stroke();
	y = 0;

	//Draw the vertical lines of the grid
	while (x <= w - grid_size) {
		ctx.moveTo(x, y);
		ctx.lineTo(x, h);
		ctx.stroke();
		x = x + grid_size;
	}
	
	//Draw the right most bounding line
	ctx.moveTo(w - 1, 0);
	ctx.lineTo(w - 1, h);
	ctx.stroke();
}

function drawElement(evt) {
	var mouse_x = evt.offsetX;
	var mouse_y = evt.offsetY;

	var x_snap_to_grid = mouse_x - (mouse_x % grid_size);
	var y_snap_to_grid = mouse_y - (mouse_y % grid_size);

	var changes_to_grid;

	if (document.getElementById("selected_shape").value == "square") {
		changes_to_grid = {
			color : document.getElementById("element_color").value,
			x_coord : x_snap_to_grid,
			y_coord : y_snap_to_grid
		};
	} else if (document.getElementById("selected_shape").value == "line") {

	}
	$.ajax({
		type : "POST",
		url : window.location.href + "push_change",
		data : changes_to_grid,
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

				var x = parseInt(result[i].item.x_coord) + ctx.lineWidth;
				var y = parseInt(result[i].item.y_coord) + ctx.lineWidth;
				var corrected_grid_size = grid_size - ctx.lineWidth * 2;

				if (result[i].action == "erase") {
					live_objects.find(function(el, ind, arr) {
						if (JSON.stringify(el) == JSON
								.stringify(result[i].item)) {
							arr.splice(ind, 1);
						}
						;
					});
					ctx.fillStyle = "#FFFFFF";
				} else if (result[i].action == "add") {
					live_objects.push(result[i].item);
					ctx.fillStyle = result[i].item.color;
				}

				ctx.fillRect(x, y, corrected_grid_size, corrected_grid_size);
			}
		},
		error : function(status, error) {
			console.log("Error: " + status.status + ", " + error);
		}
	});
}

function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}
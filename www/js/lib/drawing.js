/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */
function drawTopRuler() {
	var ruler_top = document.getElementById("ruler_top");
	ruler_top.width = grid_size * grid_count_width + 2 * grid_line_width;
	ruler_top.height = grid_size;
	var ctx2 = ruler_top.getContext("2d");
	ctx2.font = "10px Arial";
	for (var i = 0; i < grid_count_width; i++) {
		var n = ctx2.measureText(i+1).width / 2;
		ctx2.fillText(i + 1, grid_line_width + (grid_size * i) + (grid_size / 2) - n, grid_size / 1.5);
		ctx2.strokeRect(i * grid_size + grid_line_width, 0, grid_size, grid_size);
	}
}

function drawLeftRuler() {
	var ruler_left = document.getElementById("ruler_left");
	ruler_left.height = grid_size * grid_count_height + 2 * grid_line_width;
	ruler_left.width = grid_size;
	var ctx2 = ruler_left.getContext("2d");
	ctx2.font = "10px Arial";
	for (var i = 0; i < grid_count_height; i++) {
		var n = ctx2.measureText(i+1).width / 2;
		ctx2.fillText(i + 1, grid_line_width + (grid_size / 2) - n, 10 + grid_line_width + (grid_size * i) + (grid_size / 2) - 6);
		ctx2.strokeRect(0, i * grid_size + grid_line_width, grid_size, grid_size);
	}
}

function drawElements() {
	local_stored_grid_space.forEach(function(el) {
		draw_item(el);
	});
}

/**
 * Draws the input element to the canvas 
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
	switch (element.shape) {
	case "square":
	case "rectangle":
		element.ele = paper.Shape.Rectangle(
			pixel2GridPoint(element.x), 
			pixel2GridPoint(element.y), 
			JSON.parse(element.size.width) * grid_size - cursor_line_width * 2,
			JSON.parse(element.size.height) * grid_size - cursor_line_width * 2);
		element.ele.position = new paper.Point(element.x, element.y); //Setting the position here is relative to the center of the square rather than the top left
		element.ele.fillColor = "#" + element.color;
		
		console.log(element);
		group_elements.addChild(element.ele);

		break;
	case "circle":
	case "oval":
		ctx.fillStyle = "#" + element.color;
		x = gridPoint2Pixel(element.x) + grid_line_width;
		y = gridPoint2Pixel(element.y) + grid_line_width;
		ctx.beginPath();
		ctx.arc(x + (grid_size / 2) * element.size, y + (grid_size / 2) * element.size.width, element.size.height * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
		ctx.fill();
		break;
	case "line":
		ctx.strokeStyle = "#" + element.color;
		ctx.lineWidth = element.size;
		ctx.beginPath();
		x = element.x.map(function(e) {
			return gridPoint2Pixel(e)
		});
		y = element.y.map(function(e) {
			return gridPoint2Pixel(e)
		});
		ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
		for (var i = 1; i < x.length; i++) {
			ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
		}
		ctx.stroke();
		break;
	}
}

function draw_temporary_item(element) {
	switch (element.type) {
	case "square":
		temporary_drawing_ctx.fillStyle = "#" + element.color;
		x = gridPoint2Pixel(element.x) + grid_line_width * 2;
		y = gridPoint2Pixel(element.y) + grid_line_width * 2;
		temporary_drawing_ctx.fillRect(x + cursor_line_width / 2, y + cursor_line_width / 2, element.size * grid_size - cursor_line_width * 2, element.size * grid_size - cursor_line_width * 2);
		break;
	case "circle":
		temporary_drawing_ctx.fillStyle = "#" + element.color;
		x = gridPoint2Pixel(element.x) + grid_line_width;
		y = gridPoint2Pixel(element.y) + grid_line_width;
		temporary_drawing_ctx.beginPath();
		temporary_drawing_ctx.arc(x + (grid_size / 2) * element.size, y + (grid_size / 2) * element.size, element.size * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
		temporary_drawing_ctx.fill();
		break;
	case "line":
		temporary_drawing_ctx.strokeStyle = "#" + element.color;
		temporary_drawing_ctx.lineWidth = element.size;
		temporary_drawing_ctx.beginPath();
		x = element.x.map(function(e) {
			return gridPoint2Pixel(e)
		});
		y = element.y.map(function(e) {
			return gridPoint2Pixel(e)
		});
		temporary_drawing_ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
		for (var i = 1; i < x.length; i++) {
			temporary_drawing_ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
		}
		temporary_drawing_ctx.stroke();
		break;
	}
}

/**
 * Function for drawing the grid board
 */
function drawScreen() {
	for (var i = 0; i < grid_count_height; i++) {
		for (var j = 0; j < grid_count_width; j++) {
			var rect = paper.Shape.Rectangle(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
			rect.strokeColor = grid_color;
			group_grid.addChild(rect);
		}
	}
}

/**
 * Draw a temporary item at a position
 * @param {*} ping 
 */
function drawPing(ping) {
	if(ping.grid_id != grid_id) return;
	group_overlay.addChild(paper.Shape.Circle({ 
		center: [ping.position[1], ping.position[2]],
		radius: ping.size[1] / 2,
		fillColor: "#f44242",
		onFrame: function(event) {
			if(event.count >= 100) {
				this.remove();
			}
		}
	}));
}
/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */
function drawTopRuler() {
	paper.projects[1].view.setViewSize(grid_size * grid_count_width + 2 * grid_line_width, grid_size);
	paper.projects[1].activate();
	for (var i = 0; i < grid_count_width; i++) {
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		// var n = ctx2.measureText(i+1).width / 2;
		// ctx2.fillText(i + 1, grid_line_width + (grid_size * i) + (grid_size / 2) - n, grid_size / 1.5);
	}
	paper.projects[2].activate();
}

function drawLeftRuler() {
	paper.projects[0].view.setViewSize(grid_size, grid_size * grid_count_height + 2 * grid_line_width);
	paper.projects[0].activate();
	for (var i = 0; i < grid_count_height; i++) {
		// var n = ctx2.measureText(i+1).width / 2;
		// ctx2.fillText(i + 1, grid_line_width + (grid_size / 2) - n, 10 + grid_line_width + (grid_size * i) + (grid_size / 2) - 6);
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;

		var text = new paper.PointText(new paper.Point(10,10));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = "1";
	}
	paper.projects[2].activate();
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
		x = gridPoint2Pixel(element.x) + grid_line_width * 2;
		y = gridPoint2Pixel(element.y) + grid_line_width * 2;
				
		element.ele = paper.Shape.Rectangle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(element.size.width) * grid_size - cursor_line_width * 2, JSON.parse(element.size.height) * grid_size - cursor_line_width * 2);
		element.ele.fillColor = "#" + element.color;
		group_elements.addChild(element.ele);

		break;
	case "circle":
	case "oval":
		x = gridPoint2Pixel(element.x) + grid_line_width;
		y = gridPoint2Pixel(element.y) + grid_line_width;
				
		element.ele = paper.Shape.Circle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(element.size.width) * (grid_size / 2));
		element.ele.position = new paper.Point(x + (grid_size / 2), y + (grid_size / 2));
		element.ele.fillColor = "#" + element.color;
		group_elements.addChild(element.ele);
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

function draw_temporary_cursor_at_position(x, y, size) {
	switch ($('#selected_shape').val()) {
	case "square":
	case "circle":
		temporary_drawing_ctx.lineWidth = cursor_line_width;
		temporary_drawing_ctx.strokeStyle = "#b38f00";
		temporary_drawing_ctx.strokeRect(x + grid_line_width, y + grid_line_width, grid_size * size, grid_size * size);
		cursor_size = size;
		break;
	case "line":
		temporary_drawing_ctx.fillStyle = grid_highlight;
		temporary_drawing_ctx.beginPath();
		temporary_drawing_ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
		temporary_drawing_ctx.fill();
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
 * Draws the ping
 */
function drawPing(ping) {
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
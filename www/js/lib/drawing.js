/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */
function drawTopRuler() {
	for (var i = 1; i <= grid_count_width; i++) {
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_top_ruler.addChild(rect);

		var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), grid_size - (grid_size / 4)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i;
		group_top_ruler.addChild(text);
	}
	try { toprulerraster.remove(); } catch(e) {};
	toprulerraster = group_top_ruler.rasterize();
	group_top_ruler.removeChildren();
	paper.view.update();
}

function drawLeftRuler() {
	for (var i = 1; i <= grid_count_height; i++) {
		var rect = paper.Shape.Rectangle(grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_left_ruler.addChild(rect);

		var text = new paper.PointText(new paper.Point(grid_size / 2, i * grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i;
		group_left_ruler.addChild(text);
	}
	try { leftrulerraster.remove(); } catch(e) {};
	leftrulerraster = group_left_ruler.rasterize();
	group_left_ruler.removeChildren();
	paper.view.update();
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
	try { elementsraster.remove() } catch(e) {};
	elementsraster = group_elements.rasterize();
	group_elements.removeChildren();
	paper.view.update();
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
	for (var i = 1; i <= grid_count_height; i++) {
		for (var j = 1; j <= grid_count_width; j++) {
			var rect = paper.Shape.Rectangle(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
			rect.strokeColor = grid_color;
			group_grid.addChild(rect);
		}
	}
	try { gridraster.remove(); } catch(e) {};
	gridraster = group_grid.rasterize();
	group_grid.removeChildren();
	paper.view.update();
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
			paper.view.update();
		}
	}));
}
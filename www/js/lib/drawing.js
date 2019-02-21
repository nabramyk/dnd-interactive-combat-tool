/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */
function drawTopRuler(pos) {
	for (var i = 0; i < grid_count_width; i++) {
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, 0 - grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_top_ruler.addChild(rect);
		rect.sendToBack();

		var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), 0 - grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i + 1;
		group_top_ruler.addChild(text);
	}
	try { toprulerraster.remove(); } catch (e) { };
	toprulerraster = group_top_ruler.rasterize();
	group_top_ruler.removeChildren();
	paper.view.update();
}

function drawSelectedPositionTopRuler(pos) {
	var screen = paper.view.center._owner.topLeft;

	if (isUndefined(top_ruler_cursor)) {
		top_ruler_cursor = paper.Shape.Rectangle(pos + (grid_size / 2), grid_line_width, grid_size, grid_size);
		top_ruler_cursor.strokeColor = grid_color;
		top_ruler_cursor.fillColor = grid_highlight;
		toprulerraster.addChild(top_ruler_cursor);

		top_ruler_number = new paper.PointText(new paper.Point(pos, grid_size - (grid_size / 4)));
		top_ruler_number.fillColor = 'white';
		top_ruler_number.justification = 'center';
		toprulerraster.addChild(top_ruler_number);
	}

	top_ruler_number.content = ((pos - grid_line_width) / grid_size) + 0.5;
	top_ruler_number.position = new paper.Point(pos, (screen.y > -60 ? screen.y + 50 : -10));
	top_ruler_cursor.position = new paper.Point(pos, (screen.y > -60 ? screen.y + 50 : -10));

	paper.view.update();
}

function drawLeftRuler(pos) {
	for (var i = 0; i < grid_count_height; i++) {
		var rect = paper.Shape.Rectangle(0 - grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_left_ruler.addChild(rect);

		var text = new paper.PointText(new paper.Point(0 - grid_size / 2, i * grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i + 1;
		group_left_ruler.addChild(text);
	}
	try { leftrulerraster.remove(); } catch (e) { };
	leftrulerraster = group_left_ruler.rasterize();
	group_left_ruler.removeChildren();
	paper.view.update();
}

function drawSelectedPositionLeftRuler(pos) {
	var screen = paper.view.center._owner.topLeft;

	if (isUndefined(left_ruler_cursor)) {
		left_ruler_cursor = paper.Shape.Rectangle(grid_line_width, pos, grid_size, grid_size);
		left_ruler_cursor.strokeColor = grid_color;
		left_ruler_cursor.fillColor = grid_highlight;
		leftrulerraster.addChild(left_ruler_cursor);

		left_ruler_number = new paper.PointText(new paper.Point(grid_size, pos));
		left_ruler_number.fillColor = 'white';
		left_ruler_number.justification = 'center';
		leftrulerraster.addChild(left_ruler_number);
	}

	left_ruler_number.content = ((pos - grid_line_width) / grid_size) + 0.5;
	left_ruler_number.position = new paper.Point((screen.x > -10 ? screen.x + 10 : -10), pos);
	left_ruler_cursor.position = new paper.Point((screen.x > -10 ? screen.x + 10 : -10), pos);
	left_ruler_number.bringToFront();

	paper.view.update();
}

function drawElements() {
	local_stored_grid_space.forEach(function (el) {
		draw_item(el);
	});
	try { elementsraster.remove() } catch (e) { };
	//elementsraster = group_elements.rasterize();
	//group_elements.removeChildren();
	paper.view.update();
}

function draw_local_item(element) {
	switch (element.shape) {
		case "rectangle":
			ele = paper.Shape.Rectangle(gridPoint2Pixel(element.x) + cursor_line_width, gridPoint2Pixel(element.y), JSON.parse(element.size.width) * grid_size - cursor_line_width * 2, JSON.parse(element.size.height) * grid_size - cursor_line_width * 2);
			ele.fillColor = "#" + element.color;
			ele.data.name = element.name;
			ele.data.category = element.category;
			group_elements.addChild(ele);
			paper.view.update();
			break;
		case "circle": break;
		case "line":
			ele = new paper.Path(element.x.map(function(v, i) { return new paper.Point(gridPoint2Pixel(v), gridPoint2Pixel(element.y[i])) }));
			ele.strokeColor = "#" + element.color;
			ele.data.name = element.name;
			ele.data.category = element.category;
			group_elements.addChild(ele);
			paper.view.update();
			console.log(element);
		break;
	}
	return ele;
}

/**
 * Draws the input element to the canvas 
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
	switch (element.type) {
		case "square":
		case "rectangle":
			// x = gridPoint2Pixel(element.x) + grid_line_width * 2;
			// y = gridPoint2Pixel(element.y) + grid_line_width * 2;

			// element.ele = paper.Shape.Rectangle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(element.size.width) * grid_size - cursor_line_width * 2, JSON.parse(element.size.height) * grid_size - cursor_line_width * 2);
			// element.ele.fillColor = "#" + element.color;
			// group_elements.addChild(element.ele);
			console.log(element);
			group_elements.addChild(paper.Shape.Rectangle(element));

			break;
		case "circle":
		case "oval":
			// x = gridPoint2Pixel(element.x) + grid_line_width;
			// y = gridPoint2Pixel(element.y) + grid_line_width;

			// element.ele = paper.Shape.Circle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(element.size.width) * (grid_size / 2));
			// element.ele.position = new paper.Point(x + (grid_size / 2), y + (grid_size / 2));
			// element.ele.fillColor = "#" + element.color;
			// group_elements.addChild(element.ele);

			group_elements.addChild(paper.Shape.Circle(element));
			break;
		case "line":
			// element.ele = new paper.Path(element.x.map(function(v, i) { return new paper.Point(gridPoint2Pixel(v), gridPoint2Pixel(element.y[i])) }));
			// element.ele.strokeColor = "#" + element.color;
			// group_elements.addChild(element.ele);

			group_elements.addChild(paper.Shape.Rectangle(element));
			break;
	}
	paper.view.update();
	return element;
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
	try { gridraster.remove(); } catch (e) { };
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
		onFrame: function (event) {
			if (event.count >= 100) {
				this.remove();
			}
			paper.view.update();
		}
	}));
}
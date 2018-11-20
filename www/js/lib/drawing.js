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

	local_stored_pings.forEach(function(el) {
		ctx.save();
		ctx.fillStyle = "#" + el.color;
		var x = gridPoint2Pixel(el.x) + grid_line_width;
		var y = gridPoint2Pixel(el.y) + grid_line_width;
		ctx.beginPath();
		ctx.globalAlpha = el.opacity;
		ctx.arc(x + (grid_size / 2) * el.size, y + (grid_size / 2) * el.size, el.size * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
		ctx.fill();
		ctx.restore();
	});
}

/**
 * Draws the input element to the canvas 
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
	//ctx.save();
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
	//ctx.restore();
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
 * Draws the cursor at the position and sets the global trackers
 *
 * @param {int} x
 * @param {int} y
 * @param {int} size
 */
function draw_cursor_at_position(x, y, size) {

	if(isUndefined(cursor)) {
		cursor = paper.Shape.Rectangle(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, grid_size * size.width, grid_size * size.height);
		cursor.strokeColor = grid_highlight;
		group_overlay.addChild(cursor);
	}

	selected_grid_x = x;
	selected_grid_y = y;

	switch ($('#selected_shape').val()) {
	case "line":
		overlay_ctx.fillStyle = grid_highlight;
		overlay_ctx.beginPath();
		overlay_ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
		overlay_ctx.fill();
		break;
	default:
		// overlay_ctx.lineWidth = cursor_line_width;
		// overlay_ctx.strokeRect(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, grid_size * size.width, grid_size * size.height);
		cursor.position = new paper.Point(gridPoint2Pixel(selected_grid_x) + grid_line_width + (grid_size / 2), gridPoint2Pixel(selected_grid_y) + grid_line_width + (grid_size / 2));
		cursor_size = size;
	}

	$("#move_to_x").val(selected_grid_x);
	$("#move_to_y").val(selected_grid_y);
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
	paper.view.draw();
}

function drawPing(ping, _grid_id) {
	ping.shape = "circle";
	ping.color = "f44242";
	ping.size = cursor_size;
	ping.id = ping_counter++;
	ping.frame_counter = 0;
	ping.opacity = 0;
	local_stored_pings.push(ping);
	console.log(ping);
	window.setTimeout(function() {
		pingAnimation(ping, _grid_id)
	}, ping_period);
}

function pingAnimation(ping, _grid_id) {
	if (_grid_id != grid_id) return;

	temporary_drawing_ctx.save();
	switch (true) {
	case ping.frame_counter >= 0 && ping.frame_counter < 250:
		temporary_drawing_ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		x = gridPoint2Pixel(ping.x) + grid_line_width;
		y = gridPoint2Pixel(ping.y) + grid_line_width;
		ping.opacity += opacity_rate;
		ping.opacity = ping.opacity >= 1 ? 1 : ping.opacity;
		temporary_drawing_ctx.beginPath();
		temporary_drawing_ctx.fillStyle = "#" + ping.color;
		temporary_drawing_ctx.globalAlpha = ping.opacity;
		temporary_drawing_ctx.arc(x + (grid_size / 2) * ping.size.width, y + (grid_size / 2) * ping.size.height, ping.size.width * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
		temporary_drawing_ctx.fill();
	break;
	case ping.frame_counter >= 250 && ping.frame_counter < 750:
		temporary_drawing_ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		x = gridPoint2Pixel(ping.x) + grid_line_width;
		y = gridPoint2Pixel(ping.y) + grid_line_width;
		temporary_drawing_ctx.beginPath();
		temporary_drawing_ctx.fillStyle = "#" + ping.color;
		temporary_drawing_ctx.globalAlpha = Math.abs(ping.opacity);
		temporary_drawing_ctx.arc(x + (grid_size / 2) * ping.size.width, y + (grid_size / 2) * ping.size.height, ping.size.width * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
		temporary_drawing_ctx.fill();
	break;
	case ping.frame_counter >= 750 && ping.frame_counter < 1000:
		temporary_drawing_ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		x = gridPoint2Pixel(ping.x) + grid_line_width;
		y = gridPoint2Pixel(ping.y) + grid_line_width;
		ping.opacity -= opacity_rate;
		ping.opacity = ping.opacity <= 0 ? 0 : ping.opacity;
		temporary_drawing_ctx.beginPath();
		temporary_drawing_ctx.fillStyle = "#" + ping.color;
		temporary_drawing_ctx.globalAlpha = ping.opacity;
		temporary_drawing_ctx.arc(x + (grid_size / 2) * ping.size.width, y + (grid_size / 2) * ping.size.height, ping.size.width * (grid_size / 2) - grid_line_width, 0, 2 * Math.PI);
		temporary_drawing_ctx.fill();
	break;
	}
	temporary_drawing_ctx.restore();

	ping.frame_counter += ping_period;
	console.log(ping.opacity);
	if (ping.frame_counter < 1000) {
		window.setTimeout(
				function() {
					window.requestAnimationFrame(function() {
						pingAnimation(ping, _grid_id);
					});
				}, ping_period);
	} else {
		local_stored_pings.splice(local_stored_pings.findIndex(function(el) {
			return el.id == ping.id;
		}), 1);
		console.log("Stop!");
		temporary_drawing_ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		return;
	}
}

function canvasClicked(x, y) {
	console.log("Canvas clicked");

	$("#dragging_element_icon").remove();
	selected_element = null;

	var temp = local_stored_grid_space.find(function(el) {
		return gridPoint2Pixel(el.x) < x && gridPoint2Pixel(el.x + JSON.parse(el.size.width)) > x &&
		gridPoint2Pixel(el.y) < y && gridPoint2Pixel(el.y + JSON.parse(el.size.height)) > y;
	});

	if (isUndefined(temp)) {
		cursor_size = { "width" : 1, "height" : 1 };
		selected_grid_x = pixel2GridPoint(x - (x % grid_size));
		selected_grid_y = pixel2GridPoint(y - (y % grid_size));
	} else {
		cursor_size = temp.size;
		selected_grid_x = temp.x;
		selected_grid_y = temp.y;
		selected_element = temp;
	}

	if (x_vertices.length > 0 && y_vertices.length) {
		temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
		var temp_x = x_vertices.slice(0);
		var temp_y = y_vertices.slice(0);
		temp_x.push(selected_grid_x);
		temp_y.push(selected_grid_y);
		draw_temporary_item({
			"type": "line",
			"x": temp_x,
			"y": temp_y,
			"color": $("#element_color").val,
			"size": 3
		});
	}

	draw_cursor_at_position(selected_grid_x, selected_grid_y, cursor_size);
	updateSideMenuContent();
}
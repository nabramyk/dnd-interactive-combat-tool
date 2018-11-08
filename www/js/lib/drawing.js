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
		var n = ctx2.measureText(i).width / 2;
		ctx2.fillText(i + 1, grid_line_width + (grid_size * i) + (grid_size / 2) - n, grid_size / 1.5);
	}
}

function drawLeftRuler() {
	var ruler_left = document.getElementById("ruler_left");
	ruler_left.height = grid_size * grid_count_height + 2 * grid_line_width;
	ruler_left.width = grid_size;
	var ctx2 = ruler_left.getContext("2d");
	ctx2.font = "10px Arial";
	for (var i = 0; i < grid_count_height; i++) {
		var n = ctx2.measureText(i).width;
		ctx2.fillText(i + 1, 0, 10 + grid_line_width + (grid_size * i) + (grid_size / 2) - n);
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
	ctx.save();
	switch (element.shape) {
	case "square":
	case "rectangle":
		ctx.fillStyle = "#" + element.color;
		x = gridPoint2Pixel(element.x) + grid_line_width * 2;
		y = gridPoint2Pixel(element.y) + grid_line_width * 2;
		ctx.fillRect(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(element.size.width) * grid_size - cursor_line_width * 2, JSON.parse(element.size.height) * grid_size - cursor_line_width * 2);
		if(element.rotation != 0) {
			ctx.beginPath();
			console.log(element);
			switch(element.rotation) {
				case 1: 
					x += JSON.parse(element.size.width) * grid_size - 2;
					y += JSON.parse(element.size.height) * grid_size / 2;
				break;
				case 2: 
					x += JSON.parse(element.size.width) * grid_size / 2;
					y += 2;
				break;
				case 3: 
					x += 2;
					y += JSON.parse(element.size.height) * grid_size / 2;
				break;
				case 4: 
					x += JSON.parse(element.size.width) * grid_size / 2;
					y += JSON.parse(element.size.height) * grid_size - 2;
				break;
			}
			ctx.fillStyle = "#FFFFFF";
			ctx.arc(y, x, 2, 0, 2 * Math.PI);
			ctx.fill();
		}
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
	ctx.restore();
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
 * Clears the previous cursor position
 */
function clear_prev_cursor_position() {
	overlay_ctx.clearRect(0, 0, overlay_canvas.width, overlay_canvas.height);

	if (selected_grid_x === -1 || selected_grid_y === -1)
		return;

	overlay_ctx.strokeStyle = grid_color;
	overlay_ctx.lineWidth = grid_line_width;

	overlay_ctx.clearRect(gridPoint2Pixel(selected_grid_x), gridPoint2Pixel(selected_grid_y), cursor_size * grid_size + cursor_line_width, cursor_size * grid_size + cursor_line_width);
}

/**
 * Draws the cursor at the position and sets the global trackers
 *
 * @param {int} x
 * @param {int} y
 * @param {int} size
 */
function draw_cursor_at_position(x, y, size) {

	selected_grid_x = x;
	selected_grid_y = y;

	//   if (gridPoint2Pixel(x) < $("#grid_canvas_scrolling_container").scrollLeft() || gridPoint2Pixel(x) > $("#grid_canvas_scrolling_container").scrollLeft() + $("#grid_canvas_scrolling_container").width()) {
	//     $("#grid_canvas_scrolling_container").scrollLeft(gridPoint2Pixel(x));
	//   }

	//   if (gridPoint2Pixel(y) < $("#grid_canvas_scrolling_container").scrollTop() || gridPoint2Pixel(y) > $("#grid_canvas_scrolling_container").scrollTop() + $("#grid_canvas_scrolling_container").height()) {
	//     $("#grid_canvas_scrolling_container").scrollTop(gridPoint2Pixel(y));
	//   }

	switch ($('#selected_shape').val()) {
	case "line":
		overlay_ctx.fillStyle = grid_highlight;
		overlay_ctx.beginPath();
		overlay_ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
		overlay_ctx.fill();
		break;
	default:
		overlay_ctx.lineWidth = cursor_line_width;
		overlay_ctx.strokeStyle = grid_highlight;
		overlay_ctx.strokeRect(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, grid_size * size.width, grid_size * size.height);
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
	ctx2.lineWidth = grid_line_width;
	ctx2.strokeStyle = grid_color;
	for (var i = 0; i < grid_count_height; i++) {
		for (var j = 0; j < grid_count_width; j++) {
			ctx2.strokeRect(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		}
	}
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
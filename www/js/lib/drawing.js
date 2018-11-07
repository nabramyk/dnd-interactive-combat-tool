/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */

var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,153,0,1)';
var grid_line_width = 0.5;

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
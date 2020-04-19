/**
 * 
 * @param {*} status 
 * @param {*} error 
 */
function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}

var screenWidth = function() { return grid_size * grid_count_width + 2 * grid_line_width; };
var screenHeight = function() { return grid_size * grid_count_height + 2 * grid_line_width; };
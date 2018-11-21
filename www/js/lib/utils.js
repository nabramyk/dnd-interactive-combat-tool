/**
 * Converts a pixel value to a quantized grid location
 * 
 * @param {int} raw_location - a pixel location
 * @returns {int} a quantized grid point
 */
function pixel2GridPoint(raw_location) {
	return raw_location - (raw_location % grid_size) + ( grid_size / 2 ) + grid_line_width;
}

/**
 * Converts a grid location to a quantized pixel value
 *
 * @param {int} grid_point - quantized grid point
 * @returns {int} a pixel location
 */
function gridPoint2Pixel(grid_point) {
	return (grid_point - 1) * grid_size;
}

/**
 * Determine if the value is undefined 
 *
 * @param value - input which may be undefined
 * @returns {boolean} Tru if undefined, false otherwise
 */
function isUndefined(value) {
	return value === undefined;
}

/**
 * 
 * @param {*} status 
 * @param {*} error 
 */
function error_report(status, error) {
	console.log("Error: " + status.status + ", " + error);
}

var screenWidth = function() { return grid_size * grid_count_width + 2 * grid_line_width; };
var screenHeight = function() { return grid_size * grid_count_height + 2 * grid_line_width; }
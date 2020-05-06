app.service('utils', function ($rootScope) {
	this.determinePoint = (dir, el) => {
		var out = { "x": this.pixel2GridPoint(el.bounds.topLeft.x), "y": this.pixel2GridPoint(el.bounds.topLeft.y) };
		switch (dir) {
			case "up": out.y -= $rootScope._grid_size; break;
			case "down": out.y += $rootScope._grid_size; break;
			case "left": out.x -= $rootScope._grid_size; break;
			case "right": out.x += $rootScope._grid_size;
		}
		return out;
	}

	/**
 	* Converts a pixel value to a quantized grid location
 	* 
 	* @param {int} raw_location - a pixel location
 	* @returns {int} a quantized grid point
 	*/
	this.pixel2GridPoint = (raw_location) => {
		return raw_location - (raw_location % $rootScope._grid_size) + ($rootScope._grid_size / 2) + $rootScope._grid_line_width;
	}

	/**
 	* Converts a grid location to a quantized pixel value
 	*
 	* @param {int} grid_point - quantized grid point
 	* @returns {int} a pixel location
 	*/
	this.gridPoint2Pixel = (grid_point) => {
		return (grid_point - 1) * $rootScope._grid_size;
	}

	/**
 	* 
 	* @param {*} status 
 	* @param {*} error 
 	*/
	function error_report(status, error) {
		console.log("Error: " + status.status + ", " + error);
	}

	this.screenWidth = () => { return $rootScope._grid_size * grid_count_width + 2 * grid_line_width; };
	this.screenHeight = () => { return $rootScope._grid_size * grid_count_height + 2 * grid_line_width; };
});
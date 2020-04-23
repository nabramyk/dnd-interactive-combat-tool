var scale = 1;

/** @global {int} selected_grid_x - x coordinate of the selected cursor position */
var selected_grid_x = -1;

/** @global {int} selected_grid_y - y coordinate of the selected cursor position */
var selected_grid_y = -1;

var local_stored_annotations = [];

var grid_spaces_list = [];
var x_vertices = [];
var y_vertices = [];
var vertices = [];

var underlay_canvas;

var mouse_down = false;
var touch_start = false;

var copied_element = null;

var socket;

var movementInterval = 100;

var opacity_rate = 0.04;
var cursor_line_width = 1;

var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,153,0,1)';
var grid_line_width = 0.5;

var hoverTimer, movementTimer;

var isDragging = false;
var line_path, temp;
var temp_line, stored_edited_element_bounds;
var t, b;

app.service('globals', function () {
    
    var _cursor;
    this.getCursor = () => { return _cursor; };
    this.setCursor = (value) => { _cursor = value; };

    var _grid_id = 0;
    this.getGridId = () => { return Number(_grid_id); };
    this.setGridId = (value) => { _grid_id = value; };

    /** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
    var _grid_size = 20;
    this.getGridSize = () => { return Number(_grid_size); };
    this.setGridSize = (value) => { _grid_size = value; };

    /** @global {int} cursor_size - the span of grid spaces the cursor overlays */
    var _cursor_size = 1;
    this.getCursorSize = () => { return Number(_cursor_size); };
    this.setCursorSize = (value) => { _cursor_size = value; };

    var _selected_element = null;
    this.getSelectedElement = () => { return _selected_element; };
    this.setSelectedElement = (value) => { _selected_element = value; };
});
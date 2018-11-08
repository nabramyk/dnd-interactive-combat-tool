/** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
var grid_size = 20;

/** @global {int} grid_count_width */
var grid_count_width = 0;
var grid_count_height = 0;
var grid_id = 0;

var cPosX = 0, cPosY = 0;

/** @global {int} selected_grid_x - x coordinate of the selected cursor position */
var selected_grid_x = -1;

/** @global {int} selected_grid_y - y coordinate of the selected cursor position */
var selected_grid_y = -1;

var selected_element;

/** @global {int} cursor_size - the span of grid spaces the cursor overlays */
var cursor_size = 1;

var local_stored_grid_space = [];
var local_stored_annotations = [];

var grid_spaces_list = [];
var x_vertices = [];
var y_vertices = [];

var grid_canvas, ctx,
underlay_canvas, ctx2,
overlay_canvas, overlay_ctx,
temporary_drawing_canvas, temporary_drawing_ctx;

var mouse_down = false;
var touch_start = false;

var copied_element = null;

var socket;

var movementInterval = 100;

var ping_period = 10;
var opacity_rate = 0.04;
var cursor_line_width = 1;
var ping_counter = 0;

var local_stored_pings = [];

var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,153,0,1)';
var grid_line_width = 0.5;

var hoverTimer, movementTimer;
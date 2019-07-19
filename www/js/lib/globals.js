/** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
var grid_size = 20;

/** @global {int} grid_count_width */
var grid_count_width = 0;
var grid_count_height = 0;
var grid_id = 0;

var scale=1;

/** @global {int} selected_grid_x - x coordinate of the selected cursor position */
var selected_grid_x = -1;

/** @global {int} selected_grid_y - y coordinate of the selected cursor position */
var selected_grid_y = -1;

var selected_element = null;

/** @global {int} cursor_size - the span of grid spaces the cursor overlays */
var cursor_size = 1;

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

var group_grid, group_elements, group_overlay, group_left_ruler, group_top_ruler, group_bottom_ruler, group_right_ruler, group_left_cursor, group_right_cursor, group_top_cursor, group_bottom_cursor;
var cursor;

var leftrulerraster, toprulerraster, bottomrulerraster, rightrulerraster, gridraster, elementsraster, leftcursorraster, rightcursorraster;
var isDragging = false;
var line_path, temp;
var temp_line, stored_edited_element_bounds;
var t, b;
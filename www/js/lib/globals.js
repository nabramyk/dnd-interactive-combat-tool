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

var cursor_line_width = 1;

var grid_color = 'rgba(200,200,200,1)';
var grid_highlight = 'rgba(0,153,0,1)';
var grid_line_width = 0.5;

var isDragging = false;
var line_path, temp;
var temp_line, stored_edited_element_bounds;
var t, b;
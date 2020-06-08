'use strict';

var app = angular.module('clutterApp', ['btford.socket-io', 'ngMaterial']);

app.controller('appController', ['$scope', '$rootScope', 'socket', '$location', '$window', '$http', function($scope, $rootScope, socket, $location, $window, $http) {

    $rootScope._cursor = [];
    $rootScope._grid_id = 0;

    /** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
    $rootScope._grid_size = 20;

    /** @global {int} cursor_size - the span of grid spaces the cursor overlays */
    $rootScope._cursor_size = 1;
    $rootScope._selected_element = null;
    $rootScope._grid_line_width = 0;
    $rootScope._x_vertices = [];
    $rootScope._y_vertices = [];
    $rootScope._selected_grid_x = null;
    $rootScope._selected_grid_y = null;

    var alreadyConnected = false;

    // startregion Sockets

    socket.on('connect', function(msg) {
        if (alreadyConnected) return;
        else alreadyConnected = true;

        socket.emit('init', {}, function(msg) {
            $rootScope.$broadcast('initializeCanvas', msg);
        });
    });

    socket.on('connect_error', (error) => {
        alreadyConnected = false;
        $rootScope.$broadcast('error_channel', error);
    });

    socket.on('connection_timeout', () => {
        alreadyConnected = false;
        $rootScope.$broadcast('error_channel', {});
    });

    socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
            alreadyConnected = false;
            $rootScope.$broadcast('showLoading', msg);
            socket.connect();
        };
    });

    socket.on('ping_rcv', function(msg) {
        $rootScope.$broadcast('drawPing', msg);
    });

    socket.on('resize', function(msg) {
        $rootScope.$broadcast('resizeRcv', msg);
    });

    socket.on('added_element', function(msg) {
        $rootScope.$broadcast('addedElement', msg);
    });

    socket.on('added_elements', function(msg) {});

    socket.on('removed_element', function(msg) {
        console.log(msg);
        $rootScope.$broadcast('removedElement', msg);
    });

    socket.on('move_element', function(msg) {
        $rootScope.$broadcast('move_element_rcv', msg);
    });

    socket.on('edited_element', function(msg) {
        $rootScope.$broadcast('updateElement', msg);
    });

    socket.on('new_grid_space', function(msg) {
        $rootScope.$broadcast('generateGridTab', msg);
    });

    socket.on('renaming_grid', function(msg) {
        $rootScope.$broadcast('renamedGrid', msg);
    });

    socket.on('reset_grid', function(msg) {

    });

    socket.on('delete_grid_space', function(msg) {
        $rootScope.$broadcast('deletedGridSpace', msg);
    });

    socket.on('added_annotation', function(msg) {});
    socket.on('deleted_annotation', function(msg) {});

    socket.on('error_channel', function(msg) {
        $rootScope.$broadcast('error_channel', msg);
    });

    socket.on('pause', (msg) => {
        $rootScope.$broadcast('showLoading', msg);
    });

    socket.on('upload', (msg) => {
        $rootScope.$broadcast('initializeCanvas', msg);
    });

    // endregion Sockets

    $scope.$on('resize', (_, args) => {
        socket.emit('resize', {
            "grid_id": args[0],
            "size": { "width": args[1], "height": args[2] }
        });
    });

    $scope.$on('ping', (_, args) => {
        socket.emit('ping_snd', {
            position: args[0].position,
            size: args[0].size,
            username: args[1]
        });
    });

    $scope.$on('addElementToServer', (_, args) => {
        socket.emit('add_element_to_server', {
            "grid_id": args.grid_id,
            "element": args.element
        }, function(msg) {
            args.element.data.id = msg.id;
            $rootScope._selected_element = args.element;
        });
    });

    $scope.$on('move_element', (_, args) => {
        socket.emit('move_element', args, (msg) => {
            $rootScope.$broadcast('move_element_rcv', msg);
        });
    });

    $scope.$on('createGridSpace', (_) => {
        socket.emit('create_grid_space', {});
    });

    $scope.$on('changeGridSpaceSnd', (_, args) => {
        socket.emit('request_grid_space', {
            "id": args
        }, (msg) => {
            $rootScope.$broadcast('requestGridSpaceRcv', msg);
        });
    });

    $scope.$on('deleteElement', () => {
        socket.emit('delete_element_on_server', {
            "grid_id": $rootScope._grid_id,
            "element_id": $rootScope._selected_element.data.id
        });

        $rootScope._selected_element = null;
    });

    $scope.$on('exportClutter', () => {
        socket.emit('export', {}, (msg) => {
            $http.get('/download', {}).then((data) => {
                console.log(data);

                var a = document.createElement("a");
                a.href = "data:text/json;charset=utf-8," + JSON.stringify(data.data);
                a.download = 'clutter.json';
                a.click();
            }, () => {});
        })
    });

    $scope.$on('changeGridName', (_, args) => {
        socket.emit('rename_grid', {
            "grid_id": $rootScope._grid_id,
            "grid_name": args.gridName
        });
    });

    $scope.$on('sendUpdatedElementToServer', (_, args) => {
        socket.emit('edit_element_on_server', {
            "grid_id": $rootScope._grid_id,
            "id": $rootScope._selected_element.data.id,
            "el": $rootScope._selected_element
        });
    });

    $scope.$on('deleteSpace', () => {
        socket.emit('delete_grid_space_from_server', { 'grid_id': $rootScope._grid_id });
    });

    $scope.$on('reset', () => {
        socket.emit('reset_board', { 'grid_id': $rootScope._grid_id });
    });
}]);;app.controller('clutterController', ['$scope', '$rootScope', 'utils', '$mdSidenav', '$mdToast', function($scope, $rootScope, utils, $mdSidenav, $mdToast) {

    var group_grid,
        group_elements,
        group_overlay,
        group_left_ruler,
        group_top_ruler,
        group_bottom_ruler,
        group_right_ruler,
        group_left_cursor,
        group_right_cursor,
        group_top_cursor,
        group_bottom_cursor,
        line_path,
        group_temporary_drawing_layer;

    var leftrulerraster,
        toprulerraster,
        bottomrulerraster,
        rightrulerraster,
        gridraster,
        elementsraster,
        leftcursorraster,
        rightcursorraster;

    var hover_square = null;
    var hover_point_left = null;
    var hover_point_right = null;
    var hover_point_top = null;
    var hover_point_bottom = null;

    var grid_count_width = 0;
    var grid_count_height = 0;

    var cursor_size = $rootScope._cursor_size;
    var grid_size = $rootScope._grid_size;
    var selected_element = $rootScope._selected_element;
    var grid_line_width = $rootScope._grid_line_width;

    var hover_colour = "#ff0000";
    var cursor_line_width = 1;

    var background_color = 'rgba(256,256,256,1)';
    var grid_color = 'rgba(200,200,200,1)';
    var grid_highlight = 'rgba(0,153,0,1)';

    var isDragging = false;
    var line_path, temp;
    var temp_line, stored_edited_element_bounds;
    var t, b;

    function init() {
        $scope.$broadcast('showLoading', {});

        if (!$scope.paper) {
            $scope.paper = new paper.PaperScope();
            $scope.paper.setup('canvas');
        }

        group_grid = new $scope.paper.Group();
        group_elements = new $scope.paper.Group();
        group_left_ruler = new $scope.paper.Group();
        group_top_ruler = new $scope.paper.Group();
        group_bottom_ruler = new $scope.paper.Group();
        group_right_ruler = new $scope.paper.Group();
        group_left_cursor = new $scope.paper.Group();
        group_right_cursor = new $scope.paper.Group();
        group_top_cursor = new $scope.paper.Group();
        group_bottom_cursor = new $scope.paper.Group();
        group_overlay = new $scope.paper.Group();
        group_temporary_drawing_layer = new $scope.paper.Group();

        hover_point_top = new $scope.paper.Group();
        hover_point_right = new $scope.paper.Group();
        hover_point_bottom = new $scope.paper.Group();
        hover_point_left = new $scope.paper.Group();

        line_path = new $scope.paper.Path();

        $scope.paper.view.onClick = function(event) {
            if ($mdSidenav('add_container').isOpen() && $rootScope._drawing_option == "freehand") { return; }
            if (gridraster.hitTest(event.point) == null || isDragging) { return; }

            try {
                t.remove();
                b.remove();
            } catch (e) {};

            $rootScope._selected_grid_x = event.point.x - (event.point.x % grid_size) + (grid_size / 2) + grid_line_width;
            $rootScope._selected_grid_y = event.point.y - (event.point.y % grid_size) + (grid_size / 2) + grid_line_width;

            var selected_grid_x = $rootScope._selected_grid_x;
            var selected_grid_y = $rootScope._selected_grid_y;

            cursor_size = { "width": 1, "height": 1 };

            var cursor = $rootScope._cursor;
            if (isUndefined(cursor)) {
                cursor = paper.Shape.Rectangle(selected_grid_x, selected_grid_y, grid_size * cursor_size.width, grid_size * cursor_size.height);
                cursor.strokeColor = grid_highlight;
                $rootScope._cursor = cursor;
            }

            if (selected_element != null) selected_element.selected = false;

            try {
                selected_element = group_elements.hitTest(event.point).item;
            } catch (e) {
                selected_element = null;
            }

            $rootScope._selected_element = selected_element;
            $rootScope.$broadcast('canvasClicked');

            stored_edited_element_bounds = null;

            draw_cursor();

            drawSelectedPositionTopRuler(Number(selected_grid_x));
            drawSelectedPositionLeftRuler(Number(selected_grid_y));

            $scope.paper.view.update();
        }

        var toolPan = new $scope.paper.Tool();
        toolPan.activate();

        toolPan.onMouseDrag = function(event) {
            if ($mdSidenav('add_container').isOpen() && $rootScope._drawing_option == "freehand") {
                if (gridraster.hitTest(event.point) != null) {
                    if (temp_line == null) {
                        temp_line = new paper.Path({
                            strokeColor: '#000000',
                            strokeWidth: 1
                        })
                        temp_line.moveTo(event.point);
                        $rootScope._x_vertices.push(event.point.x);
                        $rootScope._y_vertices.push(event.point.y);
                        temp_line.fullySelected = true;
                    } else {
                        temp_line.lineTo(event.point);
                        $rootScope._x_vertices.push(event.point.x);
                        $rootScope._y_vertices.push(event.point.y);
                        temp_line.smooth();
                    }
                }
            } else {
                isDragging = true;
                $scope.paper.view.scrollBy(event.downPoint.subtract(event.point));
                var point = $scope.paper.view.center._owner.topLeft;

                //Stick the left ruler to the left side of the canvas when reaching scrolling overflow
                leftrulerraster.position.x = (point.x > -20 ? point.x + 10 : -10);
                group_left_cursor.position.x = (point.x > -20 ? point.x + 10 : -10);

                //Stick the top ruler to the top of the canvas when reaching scrolling overflow
                toprulerraster.position.y = (point.y > -64 ? point.y + 54 : -10);
                group_top_cursor.position.y = (point.y > -64 ? point.y + 54 : -10);

                //Stick the bottom ruler to the bottom of the canvas when reaching overflow
                bottomrulerraster.position.y = ($scope.paper.view.center._owner.bottom < grid_size * (Number(grid_count_height) + 1) ?
                    $scope.paper.view.center._owner.bottom - (grid_size / 2) :
                    grid_count_height * grid_size + (grid_size / 2));
                group_bottom_cursor.position.y = bottomrulerraster.position.y;

                //Stick the right ruler to the right of the canvas when reaching overflow
                rightrulerraster.position.x = ($scope.paper.view.center._owner.right < grid_size * (Number(grid_count_width) + 1) ?
                    $scope.paper.view.center._owner.right - (grid_size / 2) :
                    grid_count_width * grid_size + (grid_size / 2));

                group_right_cursor.position.x = rightrulerraster.position.x;

            }
            $scope.paper.view.update();
        }

        toolPan.onMouseUp = function(event) {
            try {
                temp_line.simplify();
                paper.view.update();
            } catch (e) {}
            isDragging = false;
        }

        $scope.paper.view.autoUpdate = false;
        drawScreen();

        var point = new $scope.paper.Point(0, 0);
        $scope.paper.view.scrollBy(point.subtract($scope.paper.view.center));

        window.addEventListener('resize', function(evt) {
            $scope.paper.view.update();
        });
    };

    $scope.$on('initializeCanvas', function(_, msg) {
        init();

        group_elements.removeChildren();

        grid_count_height = msg.size.height;
        resizeGridHeight(grid_count_height);
        grid_count_width = msg.size.width;
        resizeGridWidth(grid_count_width);

        var selected_grid_x = -1;
        var selected_grid_y = -1;

        $rootScope._grid_id = msg.spaces[0].id;
        $rootScope.$broadcast('generateGridTabs', msg.spaces);
        $rootScope.$broadcast('hideLoading');

        msg.elements.map(function(el) {
            draw_item(el);
        });

        //local_stored_annotations = msg.annotations;

    });

    function drawScreen() {
        for (var i = 0; i < grid_count_height; i++) {
            for (var j = 0; j < grid_count_width; j++) {
                var rect = paper.Shape.Rectangle(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
                rect.strokeColor = grid_color;
                rect.fillColor = background_color;
                group_grid.addChild(rect);
            }
        }

        try { gridraster.remove(); } catch (e) {};
        gridraster = group_grid.rasterize();
        group_grid.removeChildren();

        gridraster.onMouseEnter = (event) => {
            try {
                hover_square.remove();
            } catch (e) {};

            var hover_x = event.point.x - (event.point.x % grid_size) + (grid_size / 2) + grid_line_width;
            var hover_y = event.point.y - (event.point.y % grid_size) + (grid_size / 2) + grid_line_width;

            hover_square = new paper.Shape.Rectangle(hover_x, hover_y, grid_size, grid_size);
            hover_square.strokeColor = hover_colour;
        }

        gridraster.onMouseMove = (event) => {
            var hover_x = event.point.x - (event.point.x % grid_size) + (grid_size / 2) + grid_line_width;
            var hover_y = event.point.y - (event.point.y % grid_size) + (grid_size / 2) + grid_line_width;

            hover_square.position = new paper.Point(hover_x, hover_y);

            drawHoverPositionTopRuler({ "x": hover_x, "y": hover_y });
            drawHoverPositionLeftRuler({ "x": hover_x, "y": hover_y });

            $scope.paper.view.update();
        };

        gridraster.onMouseLeave = (event) => {
            hover_square.remove();
            hover_square = null;

            hover_point_top.removeChildren();
            hover_point_bottom.removeChildren();

            hover_point_left.removeChildren();
            hover_point_right.removeChildren();

            $scope.paper.view.update();
        };

        $scope.paper.view.update();
    };

    function resizeGridHeight(height) {
        grid_count_height = height;
        drawScreen();
        drawLeftRuler();
        drawRightRuler();
        drawBottomRuler();
    };

    function resizeGridWidth(width) {
        grid_count_width = width;
        drawScreen();
        drawTopRuler();
        drawBottomRuler();
        drawRightRuler();
    };

    /**
     * Left ruler goes 1...grid height from top to bottom
     */
    function drawLeftRuler() {
        for (var i = 0; i < grid_count_height; i++) {
            var rect = paper.Shape.Rectangle(0 - grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
            rect.strokeColor = grid_color;
            rect.fillColor = "#f5f5f5";
            group_left_ruler.addChild(rect);

            var text = new paper.PointText(new paper.Point(0 - grid_size / 2, i * grid_size + (grid_size / 1.5)));
            text.fillColor = 'black';
            text.justification = 'center';
            text.content = i + 1;
            group_left_ruler.addChild(text);
        }
        try { leftrulerraster.remove(); } catch (e) {};
        leftrulerraster = group_left_ruler.rasterize();
        group_left_ruler.removeChildren();
        leftrulerraster.bringToFront();
        $scope.paper.view.update();
    };

    /**
     * Bottom ruler goes grid width...1 from left to right
     */
    function drawBottomRuler() {
        for (var i = 0; i < grid_count_width; i++) {
            var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, (grid_count_height * grid_size) + grid_line_width, grid_size, grid_size);
            rect.strokeColor = grid_color;
            rect.fillColor = "#f5f5f5";
            group_bottom_ruler.addChild(rect);
            rect.sendToBack();

            var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), (grid_count_height * grid_size) + (grid_size / 1.5)));
            text.fillColor = 'black';
            text.justification = 'center';
            text.content = grid_count_width - i;
            group_bottom_ruler.addChild(text);
        }
        try { bottomrulerraster.remove(); } catch (e) {};
        bottomrulerraster = group_bottom_ruler.rasterize();
        group_bottom_ruler.removeChildren();
        bottomrulerraster.bringToFront();
        $scope.paper.view.update();
    };

    /**
     * Right ruler goes grid height...1 from top to bottom
     */
    function drawRightRuler() {
        for (var i = 0; i < grid_count_height; i++) {
            var rect = paper.Shape.Rectangle((grid_count_width * grid_size) + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
            rect.strokeColor = grid_color;
            rect.fillColor = "#f5f5f5";
            group_right_ruler.addChild(rect);

            var text = new paper.PointText(new paper.Point((grid_count_width * grid_size) + grid_size / 2, i * grid_size + (grid_size / 1.5)));
            text.fillColor = 'black';
            text.justification = 'center';
            text.content = grid_count_height - i;
            group_right_ruler.addChild(text);
        }
        try { rightrulerraster.remove(); } catch (e) {};
        rightrulerraster = group_right_ruler.rasterize();
        group_right_ruler.removeChildren();
        rightrulerraster.bringToFront();
        $scope.paper.view.update();
    };

    /**
     * Top ruler goes 1...[grid width] from left to right
     */
    function drawTopRuler() {
        for (var i = 0; i < grid_count_width; i++) {
            var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, 0 - grid_size + grid_line_width, grid_size, grid_size);
            rect.strokeColor = grid_color;
            rect.fillColor = "#f5f5f5";
            group_top_ruler.addChild(rect);
            rect.sendToBack();

            var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), 0 - grid_size + (grid_size / 1.5)));
            text.fillColor = 'black';
            text.justification = 'center';
            text.content = i + 1;
            group_top_ruler.addChild(text);
        }
        try { toprulerraster.remove(); } catch (e) {};
        toprulerraster = group_top_ruler.rasterize();
        group_top_ruler.removeChildren();
        toprulerraster.bringToFront();
        $scope.paper.view.update();
    }

    function draw_cursor() {
        var cursor;

        try {
            cursor = $rootScope._cursor;
            cursor.remove();
        } catch (e) {}

        // switch ($('#selected_shape').val()) {
        //    case "line":
        // cursor = paper.Shape.Circle(new paper.Point(selected_grid_x - (grid_size / 2), selected_grid_y - (grid_size / 2)), 5);
        // cursor.fillColor = grid_highlight;
        // group_overlay.addChild(cursor);
        // if (line_path.segments.length > 0) {
        //     try { temp_line.remove(); } catch (e) { console.log(e) };
        //     temp_line = new paper.Path(line_path.segments);
        //     temp_line.add(cursor.position);
        //     temp_line.strokeColor = "#ff0000";
        //     group_overlay.addChild(temp_line);
        // }
        //         break;
        //     default:
        if (!isUndefined(selected_element) && selected_element != null) {
            selected_element.selected = true;
            selected_element.selectedColor = grid_highlight;
        } else {
            cursor = paper.Shape.Rectangle(0, 0, grid_size * cursor_size.width, grid_size * cursor_size.height);
            cursor.position = new paper.Point(selected_grid_x, selected_grid_y);
            cursor.strokeColor = grid_highlight;
            group_overlay.addChild(cursor);
        }
        // }

        $rootScope._cursor = cursor;
    }

    function drawSelectedPositionTopRuler(pos) {
        var screen = $scope.paper.view.center._owner.topLeft;

        group_top_cursor.removeChildren();
        group_bottom_cursor.removeChildren();

        if (selected_element != null && isUndefined(selected_element.shape)) {
            return;
        }

        var top_ruler_cursor = paper.Shape.Rectangle(selected_grid_x, grid_line_width, 0, 0);
        top_ruler_cursor.fillColor = grid_highlight;
        top_ruler_cursor.size.height = grid_size;
        top_ruler_cursor.size.width = (selected_element == null) ? grid_size : selected_element.size.width;

        var bottom_ruler_cursor = top_ruler_cursor.clone();

        group_top_cursor.addChild(top_ruler_cursor);
        group_bottom_cursor.addChild(bottom_ruler_cursor);

        group_top_cursor.position = new paper.Point((selected_element == null) ? selected_grid_x : selected_element.position.x,
            toprulerraster.position.y);

        group_bottom_cursor.position.y = bottomrulerraster.position.y;
        group_bottom_cursor.position.x = group_top_cursor.position.x;

        if (selected_element != null) {
            for (var i = 0; i < selected_element.size.width / grid_size; i++) {
                var top_ruler_number = new paper.PointText(new paper.Point(grid_size, pos + (i * grid_size)));
                top_ruler_number.fillColor = 'white';
                top_ruler_number.justification = 'center';

                top_ruler_number.content = (selected_element.bounds.left / grid_size) + i + 1;
                top_ruler_number.position = new paper.Point(selected_element.bounds.left + (i * grid_size) + (grid_size / 2), toprulerraster.position.y);

                var bottom_ruler_number = top_ruler_number.clone();
                bottom_ruler_number.content = (grid_count_width - top_ruler_number.content) + 1;
                bottom_ruler_number.position.y = bottomrulerraster.position.y;

                group_top_cursor.addChild(top_ruler_number);
                group_bottom_cursor.addChild(bottom_ruler_number);

                top_ruler_number.bringToFront();
                bottom_ruler_number.bringToFront();

                group_top_cursor.bringToFront();
                group_bottom_cursor.bringToFront();
            }
        } else {
            var top_ruler_number = new paper.PointText(grid_size, new paper.Point(pos + (i * grid_size)));
            top_ruler_number.fillColor = 'white';
            top_ruler_number.justification = 'center';

            top_ruler_number.content = Math.ceil(pos / grid_size);
            top_ruler_number.position = new paper.Point(pos, (screen.y > -60 ? screen.y + 50 : -10));

            var bottom_ruler_number = top_ruler_number.clone();
            bottom_ruler_number.content = (grid_count_width - top_ruler_number.content) + 1;
            bottom_ruler_number.position.y = bottomrulerraster.position.y;

            group_top_cursor.addChild(top_ruler_number);
            group_bottom_cursor.addChild(bottom_ruler_number);

            top_ruler_number.bringToFront();
            bottom_ruler_number.bringToFront();

            group_top_cursor.bringToFront();
            group_bottom_cursor.bringToFront();
        }

        $scope.paper.view.update();
    }

    function drawSelectedPositionLeftRuler(pos) {
        var screen = $scope.paper.view.center._owner.topLeft;

        group_left_cursor.removeChildren();
        group_right_cursor.removeChildren();

        if (selected_element != null && isUndefined(selected_element.shape)) {
            return;
        }

        var left_ruler_cursor = paper.Shape.Rectangle(grid_line_width, pos, 0, 0);
        left_ruler_cursor.fillColor = grid_highlight;
        left_ruler_cursor.size.height = (selected_element == null) ? grid_size : selected_element.size.height;
        left_ruler_cursor.size.width = grid_size;

        var right_ruler_cursor = left_ruler_cursor.clone();

        group_left_cursor.addChild(left_ruler_cursor);
        group_right_cursor.addChild(right_ruler_cursor);

        group_left_cursor.position = new paper.Point(leftrulerraster.position.x,
            ((selected_element == null) ? selected_grid_y : selected_element.position.y));

        group_right_cursor.position.x = rightrulerraster.position.x;
        group_right_cursor.position.y = group_left_cursor.position.y;

        if (selected_element != null) {
            for (var i = 0; i < selected_element.size.height / grid_size; i++) {
                var left_ruler_number = new paper.PointText(new paper.Point(grid_size, group_left_cursor.position + (i * grid_size)));
                left_ruler_number.fillColor = 'white';
                left_ruler_number.justification = 'center';

                left_ruler_number.content = (selected_element.bounds.top / grid_size) + i + 1;
                left_ruler_number.position = new paper.Point(leftrulerraster.position.x, selected_element.bounds.top + (i * grid_size) + (grid_size / 2));

                var right_ruler_number = left_ruler_number.clone();
                right_ruler_number.content = (grid_count_height - left_ruler_number.content) + 1;
                right_ruler_number.position.x = rightrulerraster.position.x;

                group_left_cursor.addChild(left_ruler_number);
                group_right_cursor.addChild(right_ruler_number);

                left_ruler_number.bringToFront();
                right_ruler_number.bringToFront();

                group_left_cursor.bringToFront();
                group_right_cursor.bringToFront();
            }
        } else {
            var left_ruler_number = new paper.PointText(new paper.Point(grid_size, 0));
            left_ruler_number.fillColor = 'white';
            left_ruler_number.justification = 'center';

            left_ruler_number.content = Math.ceil(pos / grid_size);
            left_ruler_number.position = new paper.Point((screen.x > -10 ? screen.x + 10 : -10), pos);

            var right_ruler_number = left_ruler_number.clone();
            right_ruler_number.content = (grid_count_height - left_ruler_number.content) + 1;
            right_ruler_number.position = new paper.Point(right_ruler_cursor.position.x, pos);

            group_left_cursor.addChild(left_ruler_number);
            group_right_cursor.addChild(right_ruler_number);

            left_ruler_number.bringToFront();
            right_ruler_number.bringToFront();

            group_left_cursor.bringToFront();
            group_right_cursor.bringToFront();
        }

        $scope.paper.view.update();
    }

    function drawHoverPositionTopRuler(pos) {
        var screen = $scope.paper.view.center._owner.topLeft;

        hover_point_top.removeChildren();
        hover_point_bottom.removeChildren();

        var top_hover_cursor = paper.Shape.Rectangle(pos.x, grid_line_width, 0, 0);
        top_hover_cursor.fillColor = hover_colour;
        top_hover_cursor.size.height = grid_size;
        top_hover_cursor.size.width = grid_size;

        var bottom_hover_cursor = top_hover_cursor.clone();

        hover_point_top.addChild(top_hover_cursor);
        hover_point_bottom.addChild(bottom_hover_cursor);

        hover_point_top.position = new paper.Point(pos.x, toprulerraster.position.y);

        hover_point_bottom.position.y = bottomrulerraster.position.y;
        hover_point_bottom.position.x = hover_point_top.position.x;

        var top_ruler_number = new paper.PointText(grid_size, new paper.Point(pos.x + grid_size));
        top_ruler_number.fillColor = 'white';
        top_ruler_number.justification = 'center';

        top_ruler_number.content = ((pos.x - grid_line_width) / grid_size) + 0.5;
        top_ruler_number.position = new paper.Point(pos.x, (screen.y > -60 ? screen.y + 50 : -10));

        var bottom_ruler_number = top_ruler_number.clone();
        bottom_ruler_number.content = (grid_count_width - top_ruler_number.content) + 1;
        bottom_ruler_number.position.y = bottomrulerraster.position.y;

        hover_point_top.addChild(top_ruler_number);
        hover_point_bottom.addChild(bottom_ruler_number);

        top_ruler_number.bringToFront();
        bottom_ruler_number.bringToFront();

        hover_point_top.bringToFront();
        hover_point_bottom.bringToFront();
    }

    function drawHoverPositionLeftRuler(pos) {
        var screen = $scope.paper.view.center._owner.topLeft;

        hover_point_left.removeChildren();
        hover_point_right.removeChildren();

        var left_hover_cursor = paper.Shape.Rectangle(grid_line_width, pos.y, 0, 0);
        left_hover_cursor.fillColor = hover_colour;
        left_hover_cursor.size.height = grid_size;
        left_hover_cursor.size.width = grid_size;

        var right_hover_cursor = left_hover_cursor.clone();

        hover_point_left.addChild(left_hover_cursor);
        hover_point_right.addChild(right_hover_cursor);

        hover_point_left.position = new paper.Point(leftrulerraster.position.x, pos.y);

        hover_point_right.position.x = rightrulerraster.position.x;
        hover_point_right.position.y = hover_point_left.position.y;

        var left_ruler_number = new paper.PointText(new paper.Point(grid_size, 0));
        left_ruler_number.fillColor = 'white';
        left_ruler_number.justification = 'center';

        left_ruler_number.content = ((pos.y - grid_line_width) / grid_size) + 0.5;
        left_ruler_number.position = new paper.Point((screen.x > -10 ? screen.x + 10 : -10), pos.y);

        var right_ruler_number = left_ruler_number.clone();
        right_ruler_number.content = (grid_count_height - left_ruler_number.content) + 1;
        right_ruler_number.position = new paper.Point(hover_point_right.position.x, pos.y);

        hover_point_left.addChild(left_ruler_number);
        hover_point_right.addChild(right_ruler_number);

        left_ruler_number.bringToFront();
        right_ruler_number.bringToFront();

        hover_point_left.bringToFront();
        hover_point_right.bringToFront();
    }

    function drawElements() {
        try { elementsraster.remove() } catch (e) {};
        $scope.paper.view.update();
        $rootScope.$broadcast('hideLoading', {});
    }

    function draw_local_item(args) {
        var x = utils.pixel2GridPoint(Number(selected_grid_x));
        var y = utils.pixel2GridPoint(Number(selected_grid_y));

        var ele;

        switch (args.shape) {
            case "rectangle":
                ele = new paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(args.width) * grid_size, JSON.parse(args.height) * grid_size);
                ele.fillColor = args.fillColor;
                ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
                ele.name = "rectangle";
                break;
            case "circle":
                ele = new paper.Shape.Circle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(args.diameter) * (grid_size / 2));
                ele.bounds.topLeft = new paper.Point(x - (grid_size / 2), y - (grid_size / 2));
                ele.fillColor = args.fillColor;
                ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
                ele.name = "circle";
                break;
            case "line":
            case "freehand":
                ele = temp_line.clone();
                ele.fullySelected = false;
                temp_line.remove();
                ele.name = "line";
                ele.strokeColor = args.strokeColor;
                ele.strokeWidth = args.strokeThickness;

                line_path.remove();
                line_path = new paper.Path();
                temp_line = null;

                break;
            case "room":
                ele = new paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(args.width) * grid_size, JSON.parse(args.height) * grid_size);
                ele.strokeColor = args.fillColor;
                ele.strokeWidth = 10;
                ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
                ele.name = "room";
                break;
        }

        ele.data.name = args.name;
        ele.data.category = args.category;

        ele.onMouseEnter = function(evt) {
            if (isDragging) return;
            t = new paper.PointText(evt.point.x, evt.point.y - 20);
            t.content = this.data.name;
            t.pivot = $scope.paper.Shape.Rectangle.topLeft;
            b = $scope.paper.Shape.Rectangle(t.bounds);
            b.size.width += 10;
            b.size.height += 10;
            b.fillColor = 'white';
            b.strokeColor = "black";
            b.bringToFront();
            t.bringToFront();
            $scope.paper.view.update();
        }

        ele.onMouseLeave = function() {
            t.remove();
            b.remove();
            $scope.paper.view.update();
        }

        ele.onMouseMove = function(evt) {
            t.position = new paper.Point(evt.point.x, evt.point.y - 20);
            b.position = new paper.Point(evt.point.x, evt.point.y - 20);
            $scope.paper.view.update();
        }

        group_elements.addChild(ele);
        try {
            selected_element.selected = false;
        } catch (e) {
            console.log(e);
        }

        selected_element = ele;
        ele.selected = true;

        draw_cursor();
        drawSelectedPositionTopRuler(Number(selected_grid_x));
        drawSelectedPositionLeftRuler(Number(selected_grid_y));

        $scope.paper.view.update();
        return ele;
    }

    /**
     * Draws the input element to the canvas
     *
     * @param {Element} element
     * @returns
     */
    function draw_item(element) {
        var ele;

        switch (element.type) {
            case "square":
            case "rectangle":
                ele = new paper.Shape.Rectangle(element);
                break;
            case "circle":
            case "oval":
                ele = new paper.Shape.Circle(element);
                break;
            default:
                ele = new paper.Path(element);
                break;
        }

        ele.onMouseEnter = function(evt) {
            if (isDragging) return;
            t = new paper.PointText(evt.point.x, evt.point.y - 20);
            t.content = this.data.name;
            t.pivot = $scope.paper.Shape.Rectangle.topLeft;
            b = $scope.paper.Shape.Rectangle(t.bounds);
            b.size.width += 10;
            b.size.height += 10;
            b.fillColor = 'white';
            b.strokeColor = "black";
            b.bringToFront();
            t.bringToFront();
            $scope.paper.view.update();
        }

        ele.onMouseLeave = function() {
            try {
                t.remove();
                b.remove();
                $scope.paper.view.update();
            } catch (e) {
                console.log(e);
            }
        }

        ele.onMouseMove = function(evt) {
            t.position = new paper.Point(evt.point.x, evt.point.y - 20);
            b.position = new paper.Point(evt.point.x, evt.point.y - 20);
            $scope.paper.view.update();
        }

        ele.selected = false;

        group_elements.addChild(ele);
        $scope.paper.view.update();
        return element;
    }

    function eraseCursor() {
        try {
            $rootScope._cursor.remove();
        } catch (e) {}

        try {
            group_top_cursor.removeChildren();
            group_left_cursor.removeChildren();
            group_bottom_cursor.removeChildren();
            group_right_cursor.removeChildren();

            $rootScope._selected_element.selected = false;
        } catch (e) {}

        $scope.paper.view.update();
    }

    $scope.$on('drawPing', function(_, ping) {
        group_overlay.addChildren(paper.Shape.Circle({
                center: [ping.position[1], ping.position[2]],
                radius: ping.size[1] / 2,
                fillColor: "#f44242",
                onFrame: function(event) {
                    if (event.count >= 100) {
                        this.remove();
                    }
                    $scope.paper.view.update();
                }
            }),
            new paper.PointText({
                content: ping.username,
                position: [ping.position[1], ping.position[2] - ping.size[2]],
                fontWeight: 'bold',
                fontSize: 16,
                strokeColor: 'white',
                strokeWidth: 0.5,
                onFrame: function(event) {
                    if (event.count >= 100) {
                        this.remove();
                    }
                    $scope.paper.view.update();
                }
            })
        );
    });

    $scope.$on('resizeRcv', (_, msg) => {
        if ($rootScope._grid_id != msg.grid_id) return;
        grid_count_width = msg.size.width;
        grid_count_height = msg.size.height;
        resizeGridWidth(grid_count_width);
        resizeGridHeight(grid_count_height);
        drawElements();
    });

    $scope.$on('addedElement', (_, msg) => {
        if (msg.grid_id != $rootScope._grid_id) return;
        draw_item(msg.element.el);
    });

    $scope.$on('move_element_rcv', (_, msg) => {
        if (msg.grid_id != $rootScope._grid_id) return;
        var element = group_elements.children.find(function(el) { return el.data.id == msg.element.data.id; });
        element.matrix = msg.element.matrix;
        $scope.paper.view.update();
    });

    $scope.$on('requestGridSpaceRcv', (_, msg) => {
        grid_count_height = msg.grid_space.size.height;
        resizeGridHeight(grid_count_height);
        grid_count_width = msg.grid_space.size.width;
        resizeGridWidth(grid_count_width);
        local_stored_annotations = [];

        group_elements.removeChildren();
        group_overlay.removeChildren();

        eraseCursor();

        if (msg.grid_space.elements.length !== 0) {
            msg.grid_space.elements.forEach(function(el) { draw_item(el); });
        }

        if (msg.grid_space.annotations.length !== 0) {
            local_stored_annotations = msg.grid_space.annotations;
        }

        $scope.paper.view.update();
        $rootScope.$broadcast('hideLoading', {});
    });

    $scope.$on('drawLocalElement', (_, args) => {
        if (args.shape == "line" || args.shape == "freehand") {
            if ($rootScope._x_vertices.length <= 1 && $rootScope._y_vertices.length <= 1) {
                return;
            }

            try {
                if (selected_grid_x !== $rootScope._x_vertices[$rootScope._x_vertices.length - 1] || selected_grid_y !== $rootScope._y_vertices[$rootScope._y_vertices.length - 1]) {
                    $rootScope._x_vertices.push(cursor.position.x);
                    $rootScope._y_vertices.push(cursor.position.y);
                }
            } catch (e) {}

            x_vertices = [];
            y_vertices = [];
        }
        var temp_new_ele = draw_local_item(args);
        $rootScope.$broadcast('addElementToServer', { 'grid_id': $rootScope._grid_id, 'element': temp_new_ele });
    });

    $scope.$on('removedElement', (_, msg) => {
        if (msg.grid_id != $rootScope._grid_id) return;

        var temp = group_elements.children[group_elements.children.indexOf(
            group_elements.children.find(
                function(el) {
                    return msg.element_id == el.data.id;
                }
            )
        )];

        temp.remove();
        drawElements();
    });

    $scope.$on('updateElement', (_, msg) => {
        if (msg.grid_id != $rootScope._grid_id) return;

        var element = group_elements.getItem({ data: { id: msg.element.data.id } });
        var bounds = element.bounds;

        element.fillColor = msg.element.fillColor;
        element.matrix = msg.element.matrix;
        element.data = msg.element.data;
        element.size = msg.element.size;
        element.bounds.topLeft = bounds.topLeft;

        $scope.paper.view.update();
    });

    $scope.$on('updateLocalElement', (_, msg) => {
        var bounds = $rootScope._selected_element.bounds;

        $rootScope._selected_element.data.name = msg.name;
        $rootScope._selected_element.data.category = msg.category;

        if ($rootScope._selected_element.name == "room") {
            $rootScope._selected_element.strokeColor = msg.fillColor;
        } else {
            $rootScope._selected_element.fillColor = msg.fillColor;
        }

        $rootScope._selected_element.size.width = msg.width * grid_size;
        $rootScope._selected_element.size.height = msg.height * grid_size;

        if ($rootScope._selected_element.name == "circle") {
            $rootScope._selected_element.radius = msg.diameter / 2 * grid_size;
        }

        $rootScope._selected_element.bounds.topLeft = bounds.topLeft;

        draw_cursor();
        drawSelectedPositionTopRuler(Number(selected_grid_x));
        drawSelectedPositionLeftRuler(Number(selected_grid_y));

        $rootScope.$broadcast('sendUpdatedElementToServer', {});

        $scope.paper.view.update();
    });

    $scope.$on('drawTemporaryElement', (_, args) => {
        console.log(msg);

        var x = utils.pixel2GridPoint(Number(selected_grid_x));
        var y = utils.pixel2GridPoint(Number(selected_grid_y));

        var ele;

        // switch ($("#selected_shape").val()) {
        //     case "rectangle":
        //         ele = new paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(args.width) * grid_size, JSON.parse(args.height) * grid_size);
        //         ele.fillColor = args.fillColor;
        //         ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
        //         ele.name = "rectangle";
        //         break;
        //     case "circle":
        //         ele = new paper.Shape.Circle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(args.width) * (grid_size / 2));
        //         ele.bounds.topLeft = new paper.Point(x - (grid_size / 2), y - (grid_size / 2));
        //         ele.fillColor = args.fillColor;
        //         ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
        //         ele.name = "circle";
        //         break;
        //     case "line":
        //     case "freehand":
        //         ele = temp_line.clone();
        //         ele.fullySelected = false;
        //         temp_line.remove();
        //         ele.name = "line";
        //         break;
        //     case "room":
        //         ele = new paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(args.width) * grid_size, JSON.parse(args.height) * grid_size);
        //         ele.strokeColor = args.fillColor;
        //         ele.strokeWidth = 10;
        //         ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
        //         ele.name = "room";
        //         break;
        // }

        group_temporary_drawing_layer.add(ele);
    });

    $scope.$on('changeOfShape', (_, args) => {
        eraseCursor();

        if (selected_grid_x == -1 && selected_grid_y == -1) {
            return;
        }

        try {
            for (var i = 1; i < x_vertices.length; i++) {
                //clear_item("line", [x_vertices[i - 1], x_vertices[i]], [y_vertices[i - 1], y_vertices[i]], {}, 0);
            }

            $rootScope._x_vertices = [];
            $rootScope._y_vertices.length = [];
        } catch (e) {
            console.log(e);
        }

        selected_element = null;
        selected_grid_x = null;
        selected_grid_y = null;
    });

    $scope.$on('deleteElement', () => {
        eraseCursor();
    });

    $scope.toggleSidebar = () => {
        utils.toggle('sidebar');
    };

    $scope.$on('incrementalMoveElement', (_, args) => {
        incremental_move_element(args);
    });

    $scope.$on('clearCursor', () => {
        eraseCursor();
        $rootScope._selected_element = null;
    });

    $scope.$on('error_channel', (_, msg) => {
        $mdToast.show(
            $mdToast.simple().textContent(msg.message)
        )
    });

    $scope.$on('highlightElement', (_, elem) => {
        var element = group_elements.getItem({ data: { id: elem.id } });
        var ele = element.copyTo(group_overlay);

        ele.fillColor = null;
        ele.strokeColor = '#ebe72d';
        ele.strokeWidth = '3';
        ele.selected = false;

        $scope.paper.view.update();
    });

    $scope.$on('unhighlightElement', (_, element) => {
        var temp = group_overlay.getItem({ data: { id: element.id } });

        temp.remove();

        $scope.paper.view.update();
    });

    $scope.$on('selectElementFromList', (_, element) => {
        var temp = group_overlay.children[group_overlay.children.indexOf(
            group_overlay.children.find(
                function(el) {
                    return element.id == el.data.id;
                }
            )
        )];

        temp.remove();

        temp = group_elements.getItem({ data: { id: element.id } });

        $rootScope._selected_element = temp;
        temp.selected = true;

        $scope.paper.view.update();
    });

    function incremental_move_element(direction) {
        var selected_element = $rootScope._selected_element;

        stored_edited_element_bounds = null;
        if (selected_element != undefined) {
            var temp = utils.determinePoint(direction, selected_element);

            $rootScope.$broadcast('move_element', {
                "grid_id": $rootScope._grid_id,
                "id": selected_element.data.id,
                "direction": direction,
                "size": cursor_size
            });

            if (selected_element.name != "line") {
                selected_grid_x = temp.x - ($rootScope._grid_size / 2);
                selected_grid_y = temp.y - ($rootScope._grid_size / 2);

                var loc = new paper.Point(selected_grid_x, selected_grid_y);
                selected_element.bounds.topLeft = loc;
                //cursor.bounds.topLeft = loc;

                drawSelectedPositionTopRuler(Number(selected_grid_x + ($rootScope._grid_size / 2)), utils.pixel2GridPoint(selected_element.size.width));
                drawSelectedPositionLeftRuler(Number(selected_grid_y + ($rootScope._grid_size / 2)), utils.pixel2GridPoint(selected_element.size.height));

                try {
                    t.remove();
                    b.remove();
                } catch (e) {
                    console.log(e);
                }
            }

            $scope.paper.view.update();
        }
    };

    /**
     * Determine if the value is undefined 
     *
     * @param value - input which may be undefined
     * @returns {boolean} True if undefined, false otherwise
     */
    function isUndefined(value) {
        return value === undefined;
    }
}]);;app.controller('movement_controller', ['$scope', '$rootScope', 'utils', function ($scope, $rootScope, utils) {

    var cursor_size = $rootScope._cursor_size;

    function incremental_move_element(direction) {
        var selected_element = $rootScope._selected_element;

        stored_edited_element_bounds = null;
        if (selected_element != undefined) {
            var temp = utils.determinePoint(direction, selected_element);

            $rootScope.$broadcast('move_element', {
                "grid_id": $rootScope._grid_id,
                "id": selected_element.data.id,
                "direction": direction,
                "size": cursor_size
            });

            // selected_grid_x = temp.x - (globals.getGridSize() / 2);
            // selected_grid_y = temp.y - (globals.getGridSize() / 2);

            // var loc = new paper.Point(selected_grid_x, selected_grid_y);
            // selected_element.bounds.topLeft = loc;
            // cursor.bounds.topLeft = loc;

            // drawSelectedPositionTopRuler(Number(selected_grid_x + (globals.getGridSize() / 2)), pixel2GridPoint(selected_element.size.width));
            // drawSelectedPositionLeftRuler(Number(selected_grid_y + (globals.getGridSize() / 2)), pixel2GridPoint(selected_element.size.height));

            // try {
            //     t.remove();
            //     b.remove();
            // } catch (e) {
            //     console.log(e);
            // }

            // group_overlay.addChild(cursor);
            // paper.view.update();
        }
    };

    $scope.incrementalMoveElement = function (direction) {
        incremental_move_element(direction);
    };
}]);;app.factory('socket', ["socketFactory", function(socketFactory) {
    return socketFactory({
        prefix: '',
        ioSocket: io.connect()
    });
}]);

app.factory('readFile', ["$window", "$q", function($window, $q) {
        var readFile = function(file) {
            var deferred = $q.defer(),
                reader = new $window.FileReader();

            reader.onload = function(ev) {
                var content = ev.target.result;
                deferred.resolve(content);
            };

            reader.readAsText(file);
            return deferred.promise;
        };

        return readFile;
    }])
    .directive('fileBrowser', ["readFile", "$http", "$location", function(readFile, $http, $location) {
        return {
            template: '<input type="file" style="display: none;" />' +
                '<ng-transclude></ng-transclude>',
            transclude: true,
            link: function(scope, element) {
                var fileInput = element.children('input[file]');

                fileInput.on('change', function(event) {
                    var file = event.target.files[0];
                    readFile(file).then(function(content) {
                        try {
                            $http.post("https://" + $location.host() + ":" + $location.port() + "/upload", content, () => {});
                        } catch (e) {
                            console.log(e);
                        }
                    });
                });

                element.on('click', function() {
                    fileInput[0].click();
                });
            }
        };
    }]);

app.directive('keypressEvents', ['$rootScope', '$document', function($rootScope, $document) {
    return {
        restrict: 'A',
        link: function() {
            $document.bind('keydown', function(e) {
                switch (e.key) {
                    case "ArrowUp":
                        $rootScope.$broadcast('incrementalMoveElement', 2);
                        break;
                    case "ArrowRight":
                        $rootScope.$broadcast('incrementalMoveElement', 0);
                        break;
                    case "ArrowDown":
                        $rootScope.$broadcast('incrementalMoveElement', 6);
                        break;
                    case "ArrowLeft":
                        $rootScope.$broadcast('incrementalMoveElement', 4);
                        break;
                    case "Delete":
                        $rootScope.$broadcast('deleteElement', {});
                        break;
                }
            });
        }
    }
}]);;app.component('addContainer', {
    bindings: {
        shape: '=',
        width: '=',
        height: '=',
        category: '=',
        name: '=',
        fillColour: '=',
        strokeColour: '=',
        strokeThickness: '=',
        diameter: '='
    },
    controller: ($scope, $rootScope, utils) => {

        $scope.shapes = ["rectangle", "circle", "line", "freehand", "room"];
        $scope.categories = ["environment", "player", "enemy", "npc"];

        $scope.shape = 'rectangle';
        $scope.category = 'environment';
        $scope.name = '';

        $scope.width = 1;
        $scope.height = 1;
        $scope.diameter = 1;
        $scope.fillColour = '#000000';

        $scope.strokeColour = '#000000';
        $scope.strokeThickness = 1;

        $scope.addMode = true;

        $rootScope._drawing_option = $scope.shapes[0];

        function drawTemporaryElement() {
            $rootScope.$broadcast('drawTemporaryElement', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fill.colour
            });
        };

        $scope.toggleActive = () => {
            utils.toggle('add_container');
        };

        $scope.placeElementAction = () => {
            $rootScope.$broadcast('add_element_to_server', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour,
                'strokeColor': $scope.strokeColour,
                'strokeThickness': $scope.strokeThickness,
                'diameter': $scope.diameter
            });
        };

        $scope.updateElementAction = () => {
            $rootScope.$broadcast('updateLocalElement', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour,
                'strokeColor': $scope.strokeColour,
                'strokeThickness': $scope.strokeThickness,
                'diameter': $scope.diameter
            });
        };

        $scope.$on('canvasClicked', () => {
            if ($rootScope._selected_element == null) {
                $scope.addMode = true;
                return;
            }
            //not sure why I have to do this here and nowhere else
            $scope.$apply(() => {
                $scope.shape = $rootScope._selected_element.shape;
                $scope.category = $rootScope._selected_element.data.category;
                $scope.name = $rootScope._selected_element.data.name;

                try {
                    $scope.width = $rootScope._selected_element.size.width / $rootScope._grid_size;
                    $scope.height = $rootScope._selected_element.size.height / $rootScope._grid_size;
                    $scope.fillColour = $rootScope._selected_element.fillColor.toCSS(true);
                } catch (e) {}

                try {
                    $scope.strokeColour = $rootScope._selected_element.strokeColor.toCSS(true);
                    $scope.strokeThickness = $rootScope._selected_element.strokeWidth.toCSS(true);
                } catch (e) {}

                try {
                    $scope.diameter = $rootScope._selected_element.radius / $rootScope._grid_size * 2;
                } catch (e) {
                    console.log(e);
                }

                $scope.addMode = false;
            });
        });

        $scope.changeOfShape = () => {
            $rootScope._drawing_option = $scope.shape;
            $rootScope.$broadcast('changeOfShape', { 'value': $scope.shape });
        };

        $scope.rotateElement = (angle) => {
            console.log(angle);
            //$rootScope.$broadcast();
        }

        $scope.drawingLines = () => {
            return $rootScope._drawing_option == 'line' || $rootScope._drawing_option == 'freehand';
        }
    },
    templateUrl: 'components/add_container/add_container.html'
});app.component('annotationContainer', {
    templateUrl: '/components/annotation_container/annotation_container.html',
    controller: ($scope, utils) => {
        $scope.toggleActive = () => {
            utils.toggle('annotation_container');
        };
    }
});app.component('gridSpaceContainer', {
    bindings: {
        height: '=',
        width: '=',
        name: '='
    },
    controller: ['$scope', '$rootScope', 'utils', ($scope, $rootScope, utils) => {

        $scope.toggleActive = () => {
            utils.toggle('grid_space_container');
        }

        $scope.onChange = (evt) => {
            if (evt.key == 'Enter') {
                $rootScope.$broadcast('resize', [$rootScope._grid_id, $scope.width, $scope.height]);
            }
        }

        $scope.onRename = (evt) => {
            if (evt.key == 'Enter') {
                $rootScope.$broadcast('changeGridName', { 'gridName': $scope.name });
            }
        }

        $scope.$on('resizeRcv', (_, msg) => { setValues(msg.size.width, msg.size.height) });
        $scope.$on('initializeCanvas', (_, msg) => {
            setValues(msg.size.width, msg.size.height);
            $scope.name = msg.spaces[0].name;
        });

        $scope.$on('requestGridSpaceRcv', (_, msg) => {
            setValues(Number(msg.grid_space.size.width), Number(msg.grid_space.size.height));
            $scope.name = msg.grid_space.name;
        });

        $scope.$on('renamedGrid', (_, msg) => {
            $scope.name = msg.grid_name;
        });

        function setValues(width, height) {
            $scope.width = width;
            $scope.height = height;
        }

        $scope.$on('add_element_to_server', function(_, args) {
            $rootScope.$broadcast('drawLocalElement', args);
        });

        $scope.deleteGridSpace = () => {
            $rootScope.$broadcast('deleteSpace', {});
        };

        $scope.createGridSpace = () => {
            $rootScope.$broadcast('createGridSpace', {});
        };

        $scope.resetGrid = () => {
            console.log('here');
            $rootScope.$broadcast('reset', {});
        };
    }],
    templateUrl: 'components/grid_space/grid_space_container.html'
});app.component('listContainer', {
    bindings: {
        'elements': '<'
    },
    controller: ($scope, $rootScope, utils) => {

        $scope.elements = [];
        $scope.filteredElements = [];

        $scope.toggleActive = () => {
            utils.toggle('list_container');
        };

        $scope.highlightElement = (element) => {
            $rootScope.$broadcast('highlightElement', element);
        };

        $scope.unhighlightElement = (element) => {
            $rootScope.$broadcast('unhighlightElement', element);
        };

        $scope.clickListItem = (element) => {
            $rootScope.$broadcast('selectElementFromList', element);
        };

        $scope.editListItem = (element) => {
            console.log(element);
        };

        $scope.$on('addedElement', function(_, msg) {
            $scope.elements.push(msg.element.el.data);
        });

        $scope.$on('initializeCanvas', function(_, msg) {
            msg.elements.map(function(el) {
                $scope.elements.push(el.data);
            });
        });
    },
    templateUrl: 'components/list_container/list_container.html'
});;app.component('manualContainer', {
    controller: ['$scope', 'utils', ($scope, utils) => {
        $scope.toggleManual = () => {
            utils.toggle('manual_container');
        };
    }],
    templateUrl: 'components/manual/manual_container.html'
});app.component('loadingContainer', {
    bindings: {
        isShowing: '=',
        quote: '=',
        message: '='
    },
    controller: ['$scope', '$timeout', 'utils', ($scope, $timeout, utils) => {

        var timeoutDuration = 3000;
        var isFinishedLoading = false;
        var isTimerFinished = false;

        $scope.isShowing = false;
        $scope.quote = utils.getRandomQuote();
        $scope.message = "";

        $scope.$on('showLoading', (_, msg) => {
            showLoadingScreen(msg.message);
        });

        $scope.$on('hideLoading', () => {
            if (isTimerFinished) {
                $scope.isShowing = false;
                reset();
            } else {
                isFinishedLoading = true;
            }
        });

        $scope.$on('changeGridSpaceSnd', () => {
            showLoadingScreen("Hotswapping grid spaces....")
        });

        $scope.$on('requestGridSpaceRcv', (_, msg) => {
            isFinishedLoading = true;
        });

        function showLoadingScreen(message) {
            $scope.message = message;
            $scope.quote = utils.getRandomQuote();

            $scope.isShowing = true;
            isTimerFinished = false;

            $timeout(() => {
                if (isFinishedLoading) {
                    $scope.isShowing = false;
                    reset();
                } else {
                    isTimerFinished = true;
                }
            }, timeoutDuration)
        }

        function reset() {
            isTimerFinished = false;
            isFinishedLoading = false;
        };
    }],
    templateUrl: 'components/loading_screen/loading_screen.html'
});;app.component('movementContainer', {
    bindings: {
        location_x: '=',
        location_y: '='
    },
    controller: ($scope, $rootScope, utils) => {

        $scope.location_x;
        $scope.location_y;

        $scope.toggleActive = () => {
            utils.toggle('movement_container');
        }

        $scope.$on('canvasClicked', () => {
            $scope.$apply(() => {
                if ($rootScope._selected_element != null) {
                    $scope.location_x = Math.ceil($rootScope._selected_grid_x / $rootScope._grid_size);
                    $scope.location_y = Math.ceil($rootScope._selected_grid_y / $rootScope._grid_size);
                }
            })
        })

        $scope.incrementalMoveElement = (args) => {
            $rootScope.$broadcast('incrementalMoveElement', args);
        }
    },
    templateUrl: 'components/movement_container/movement_container.html'
});app.component('systemContainer', {
    templateUrl: 'components/system_container/system_container.html',
    controller: ['$scope', '$rootScope', 'utils', ($scope, $rootScope, utils) => {
        $scope.toggleActive = (event) => {
            utils.toggle('system_container');
        };

        $scope.export = () => {
            $rootScope.$broadcast('exportClutter', {});
        };
    }]
});app.component('sidebar', {
    bindings: {
        'add_edit': '<',
        'paste_delete': '<',
        'positionNotSelected': '<',
        'copiedElement': '<'
    },
    controller: ['$scope', '$rootScope', 'utils', ($scope, $rootScope, utils) => {
        $scope.add_edit = "Add";
        $scope.paste_delete = "Delete";
        $scope.positionNotSelected = true;
        $scope.copiedElement = null;

        $scope.toggleSection = (element) => {
            utils.toggle(element);
        };

        $scope.pingPosition = () => {
            $rootScope.$broadcast('ping', [$rootScope._cursor, $("#username").val()]);
        };

        $scope.clearCursor = () => {
            $scope.positionNotSelected = true;
            //$rootScope._selected_element = null;
            $scope.add_edit = "Add";
            $rootScope.$broadcast('clearCursor', {});
        };

        $scope.$watch('positionNotSelected', (v) => {});

        $scope.$on('canvasClicked', () => {
            $scope.$apply(() => {
                if ($rootScope._selected_element != null) {
                    $scope.add_edit = "Edit";

                } else {
                    $scope.add_edit = "Add";
                }

                $scope.positionNotSelected = false;
            })
        });

        $scope.$on('deleteElement', () => {
            $scope.add_edit = "Add";
            $scope.positionNotSelected = true;
        });
    }],
    templateUrl: 'components/sidebar/sidebar.html'
});app.component('gridSpaceBar', {
    bindings: {
        spaces: '='
    },
    controller: ($scope, $rootScope) => {
        $scope.spaces = [];
        $scope.selected = 0;

        $scope.$on('generateGridTabs', (_, args) => {
            $scope.spaces = args;
        });

        $scope.$on('generateGridTab', (_, args) => {
            $scope.spaces.push(args);
        });

        $scope.$on('renamedGrid', (_, msg) => {
            $scope.spaces.find((el) => { return el.id == msg.grid_id }).name = msg.grid_name;
        });

        $scope.$on('deletedGridSpace', (_, msg) => {
            $scope.spaces = $scope.spaces.filter((el) => { return el.id != msg.grid_id; });
        });

        $scope.changeGridSpace = (index, args) => {
            $rootScope.$broadcast('changeGridSpaceSnd', args);
            $scope.selected = index;
            $rootScope._grid_id = args;
            $rootScope._selected_element = null;
        };
    },
    templateUrl: 'components/toolbar/grid_space_toolbar.html'
});app.service('utils', ["$rootScope", "$mdSidenav", function($rootScope, $mdSidenav) {
    this.determinePoint = (dir, el) => {
        var grid_size = $rootScope._grid_size;
        var out = { "x": this.pixel2GridPoint(el.bounds.topLeft.x), "y": this.pixel2GridPoint(el.bounds.topLeft.y) };
        switch (dir) {
            case 0:
                out.x += grid_size;
                break; //right
            case 1:
                out.x += grid_size;
                out.y -= grid_size;
                break; //up-right
            case 2:
                out.y -= grid_size;
                break; //up
            case 3:
                out.x -= grid_size;
                out.y -= grid_size;
                break; //up-left
            case 4:
                out.x -= grid_size;
                break; //left
            case 5:
                out.x -= grid_size;
                out.y += grid_size;
                break; //down-left
            case 6:
                out.y += grid_size;
                break; //down 
            case 7:
                out.x += grid_size;
                out.y += grid_size;
                break; //down-right
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

    this.toggle = (componentId) => {
        $mdSidenav(componentId).toggle();
    }

    this.getRandomQuote = () => {
        var quotes = [
            'Stupid is as stupid quotes',
            'In case of emergency, the key is under the mat',
            '3, 2, 1.......',
            'I am standing behind you',
            'Smankle',
            'Do the dew',
            'Oh god, do not let the progress bar hit 100\%!',
            'And behind curtain 3 is.....',
            'I only have the power of Grey Skull.',
            'Where the !#%& are my hard boiled eggs!',
            'It\'s open\!',
            'Oh, that\'s your solution for everything.',
            '(╯°□°)╯︵ ┻━┻',
            'The cake is a lie',
            'Whose been screwing with this thing\?!',
            'That old grey mare, ain\'t what she used to be',
            'Hail to thee Kamp Krusty!',
            'To be or not to be......not to be.',
            'Fun fact: Jet fuel CAN melt steel beams.',
            'Free masons run the country!',
            'From my point of view the Jedi are evil!',
            'Trains are blameless, holy creatures.',
            'Oh right, the quicksand!',
            'BEAT MUSIC! BEAT MUSIC! BEAT MUSIC!',
            'Does anybody know the plot yet?',
            '*miami vice theme song',
            'Do you able to smell that code?',
            'Merry Christmas to all, now you\'re all gonna die!',
            'This is page 3.',
            'Help, I\'ve fallen and I can\'t get up!',
            'Dead or alive, you\'re coming with me.',
            'Garbagio, my boy! What are you doing in the middle of the road?',
            'The force is strong with you, young Skywalker, but you are not a Jedi yet.',
            'Line?',
            'I saw it on T.V.',
            'I am Jack\'s smirking revenge',
            'Stir you around like a soup!',
            '*smokebomb',
            'Wait for it.....',
            'Reticulating splines.....',
            'Your call cannot be completed as dialed.',
            'Supplies!',
            'ACELIPS, that\'ll be the name of our new system!',
            'Where\'s my burrito!',
            'Not Lenny!',
            'I\'m not asking for a fight!',
            'Hey! Listen!',
            'Never gonna let you go!',
            'There\'s always money in the banana stand',
            '#Slpapt',
            '42',
            'I am Error',
            'www.thisman.org',
            'Museums don\'t have foosball, do they?',
            'Watch out Radioactive Man!',
            'Your princess is in another castle.',
            'You Died',
            'I want you to hit me as hard as you can.',
            'Push the little red button',
            'You\'re a wizard Harry',
            'No one expects the Spanish Inquisition',
            'Duff Man can\'t breathe! Oh no!',
            'Na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na Batman!',
            'Obey',
            'Consume',
            'No free will',
            'Are you smoking yet?',
            '_UCK _E _N THE A__ TON_GHT',
            'Did you leave the stove on?',
            'I know what you\'re thinking. Did he fire six shots or only five?',
            'A new challenger approaches',
            'The neighbourhood is now safe.',
            'Burninating the countryside!',
            'Ancient Chinese proverb: Jar will not open.',
            'Don\'t touch that',
            'The verabouts of the wherein Kelley.',
            'No no, I fix. With my pliers.',
            'That\'s staying in.',
            'Hi! Billy Mays with a fantastic product....',
            'Schroedingers Loading Screen: \nIf you can read this, then something is either working or not working.',
            'My belt is holding my pants up, but my belt loop is holding my belt in place. I don\'t know who\'s the real hero down there!',
            'I hate it when the waffles stick together.',
            'We get it, you vape!',
            'Madness is the emergency door.',
            'Timmy get down!',
            'Not the gnome!',
            'Feel the power of the holy flame!',
            'In my restless dreams,\nI see that town.\nSilent Hill.',
            'No whammie, no whammie.....',
            'More like \"Gaygoth\"',
            'Husky Pete\'s',
            'Spaceballs 2: The search for more money',
            'It\'s a fake!',
            'Shikaka!'
        ];

        return quotes[Math.floor(Math.random() * quotes.length)];
    };
}]);
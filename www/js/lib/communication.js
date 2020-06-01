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
}]);
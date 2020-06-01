app.controller('movement_controller', ['$scope', '$rootScope', 'utils', function ($scope, $rootScope, utils) {

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
}]);
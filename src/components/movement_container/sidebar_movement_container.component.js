app.component('movementContainer', {
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
})
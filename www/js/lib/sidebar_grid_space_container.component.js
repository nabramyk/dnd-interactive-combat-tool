app.component('gridSpaceContainer', {
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

        $scope.$on('add_element_to_server', function (_, args) {
            $rootScope.$broadcast('drawLocalElement', args);
        });

        $scope.deleteGridSpace = () => {
            $rootScope.$broadcast('deleteSpace', {});
        };

        
        $scope.createGridSpace = () => {
            $rootScope.$broadcast('createGridSpace', {});
        };
    }],
    templateUrl: '/js/lib/grid_space_container.html'
})
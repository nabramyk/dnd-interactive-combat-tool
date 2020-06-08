app.component('gridSpaceBar', {
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
})
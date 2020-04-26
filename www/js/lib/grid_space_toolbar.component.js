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

        $scope.changeGridSpace = (index, args) => {
            $rootScope.$broadcast('changeGridSpaceSnd', args);
            $scope.selected = index;
            $rootScope._grid_id = args;
        };

        $scope.createGridSpace = () => {
            $rootScope.$broadcast('createGridSpace', {});
        };
        
        $scope.$on('renamedGrid', (_, msg) => {
            $scope.spaces.find((el) => { return el.id == msg.grid_id }).name = msg.grid_name;
        });
    },
    templateUrl: '/js/lib/grid_space_toolbar.html'
})
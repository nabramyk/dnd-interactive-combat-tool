app.component('gridSpaceContainer', {
    templateUrl: '/js/lib/grid_space_container.html',
    controller: ($scope) => {
        $scope.toggleActive = () => {
            $("#grid_space_container").toggleClass('active');
        }
    }
})
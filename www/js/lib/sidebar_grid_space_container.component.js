app.component('gridSpaceContainer', {
    templateUrl: '/js/lib/grid_space_container.html',
    controller: ['$scope', '$rootScope', ($scope, $rootScope) => {

        var grid_count_height = $("#grid_size_vertical").val();
        var grid_count_width = $("#grid_size_horizontal").val();

        $scope.toggleActive = () => {
            $("#grid_space_container").toggleClass('active');
        }

        $("#grid_size_vertical").change(function () {
            grid_count_height = $("#grid_size_vertical").val();
            $rootScope.$broadcast('resize', [$rootScope._grid_id, grid_count_width, grid_count_height]);
        });
    
        $("#grid_size_horizontal").change(function () {
            grid_count_width = $("#grid_size_horizontal").val();
            $rootScope.$broadcast('resize', [$rootScope._grid_id, grid_count_width, grid_count_height]);
        });

        $scope.$on('add_element_to_server', function () {
            $rootScope.$broadcast('drawLocalElement', {});
        });
    }]
})
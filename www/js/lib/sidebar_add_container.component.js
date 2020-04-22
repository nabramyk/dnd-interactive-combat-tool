app.component('addContainer', {
    templateUrl: '/js/lib/add_container.html',
    controller: ($scope, $rootScope) => {
        $scope.toggleActive = () => {
            $("#add_container").toggleClass('active');
        }

        $scope.placeElementAction = () => {
            $rootScope.$broadcast('add_element_to_server');
        };
    }
})
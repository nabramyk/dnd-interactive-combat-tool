app.component('movementContainer', {
    templateUrl: '/js/lib/movement_container.html',
    controller: ($scope, $rootScope) => {
        $scope.toggleActive = () => {
            $("#movement_container").toggleClass('active');
        }
    }
})
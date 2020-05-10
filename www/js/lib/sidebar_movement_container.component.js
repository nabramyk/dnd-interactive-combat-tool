app.component('movementContainer', {
    templateUrl: '/js/lib/movement_container.html',
    controller: ($scope, $rootScope, utils) => {
        $scope.toggleActive = () => {
            utils.toggle('movement_container');
        }
    }
})
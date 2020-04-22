app.component('listContainer', {
    templateUrl: '/js/lib/list_container.html',
    controller: ($scope, $rootScope) => {
        $scope.toggleActive = () => {
            $("#list_container").toggleClass('active');
        }
    }
});
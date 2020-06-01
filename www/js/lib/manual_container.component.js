app.component('manualContainer', {
    controller: ['$scope', 'utils', ($scope, utils) => {
        $scope.toggleManual = () => {
            utils.toggle('manual_container');
        };
    }],
    templateUrl: '/js/lib/manual_container.html'
})
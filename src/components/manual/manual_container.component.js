app.component('manualContainer', {
    controller: ['$scope', 'utils', ($scope, utils) => {
        $scope.toggleManual = () => {
            utils.toggle('manual_container');
        };
    }],
    templateUrl: 'components/manual/manual_container.html'
})
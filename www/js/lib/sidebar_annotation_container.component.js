app.component('annotationContainer', {
    templateUrl: '/js/lib/annotation_container.html',
    controller: ($scope, utils) => {
        $scope.toggleActive = () => {
            utils.toggle('annotation_container');
        };
    }
})
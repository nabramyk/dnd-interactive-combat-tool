app.component('annotationContainer', {
    templateUrl: '/components/annotation_container/annotation_container.html',
    controller: ($scope, utils) => {
        $scope.toggleActive = () => {
            utils.toggle('annotation_container');
        };
    }
})
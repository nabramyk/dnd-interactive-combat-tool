app.component('loadingContainer', {
    bindings: {
        isShowing: '=',
        quote: '=',
        message: '='
    },
    controller: ['$scope', 'utils', ($scope, utils) => {
        $scope.isShowing = true;
        $scope.quote = utils.getRandomQuote();
        $scope.message = "";

        $scope.$on('showLoading', (_, msg) => {
            $scope.message = msg.message;
            $scope.quote = utils.getRandomQuote();
            $scope.isShowing = true;
        });

        $scope.$on('hideLoading', () => {
            $scope.isShowing = false;
        });

        $scope.$on('changeGridSpaceSnd', () => {
            $scope.message = "Hotswapping grid spaces....";
            $scope.quote = utils.getRandomQuote();
            $scope.isShowing = true;
        });

        $scope.$on('requestGridSpaceRcv', (_, msg) => {
            $scope.isShowing = false;
        });
    }],
    templateUrl: '/js/lib/loading_screen.html'
});
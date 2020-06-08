app.component('loadingContainer', {
    bindings: {
        isShowing: '=',
        quote: '=',
        message: '='
    },
    controller: ['$scope', '$timeout', 'utils', ($scope, $timeout, utils) => {

        var timeoutDuration = 3000;
        var isFinishedLoading = false;
        var isTimerFinished = false;

        $scope.isShowing = true;
        $scope.quote = utils.getRandomQuote();
        $scope.message = "";

        $scope.$on('showLoading', (_, msg) => {
            showLoadingScreen(msg.message);
        });

        $scope.$on('hideLoading', () => {
            console.log('here');
            if (isTimerFinished) {
                $scope.isShowing = false;
                reset();
            } else {
                isFinishedLoading = true;
            }
        });

        $scope.$on('changeGridSpaceSnd', () => {
            showLoadingScreen("Hotswapping grid spaces....")
        });

        $scope.$on('requestGridSpaceRcv', (_, msg) => {
            isFinishedLoading = true;
        });

        function showLoadingScreen(message) {
            $scope.message = message;
            $scope.quote = utils.getRandomQuote();

            $scope.isShowing = true;
            isTimerFinished = false;

            $timeout(() => {
                if (isFinishedLoading) {
                    $scope.isShowing = false;
                    reset();
                } else {
                    isTimerFinished = true;
                }
            }, timeoutDuration)
        }

        function reset() {
            isTimerFinished = false;
            isFinishedLoading = false;
        };
    }],
    templateUrl: 'components/loading_screen/loading_screen.html'
});
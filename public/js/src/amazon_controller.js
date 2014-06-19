'use strict';

app.controller('AmazonController', ['$scope', '$timeout', 'Amazon', 
  function($scope, $timeout, Amazon){

    $scope.search = 'Ralph';
    $scope.category = 'Toys';
    $scope.products = [];
    $scope.loading = false;
    var doSearchTimeout = false;

    $scope.searchAmazon = function(){
      Amazon.search($scope.category, $scope.search, function(data){
        $scope.products = data.Item;
      });
    };

    $scope.$watch('search', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      $scope.page = 1;

      doSearchTimeout = $timeout(function(){
        $scope.searchAmazon();
      }, 500);
    });

}]);
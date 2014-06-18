'use strict';

app.controller('AmazonController', ['$scope', '$timeout', 'Amazon', 
  function($scope, $timeout, Amazon){

    $scope.search = 'Ralph';
    $scope.category = 'Toys';
    $scope.products = [];

    $scope.searchAmazon = function(){
      Amazon.search($scope.category, $scope.search, function(data){
        $scope.products = data.Item;
      });
    };

}]);
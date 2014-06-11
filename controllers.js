'use strict';

app.controller('VideoController', ['$scope', '$timeout', 'VineService', function($scope, $timeout, VineService){

  $scope.videos = [];
  $scope.loading = false;
  var doSearchTimeout = false;

  $scope.searchVids = function(page){
    if(!$scope.searchTerm){
      $scope.videos = [];
    }
    else
    {
      $scope.loading = true;

      VineService.get({ tag: $scope.searchTerm, page: page }, function(response){
        $scope.videos = response.data.records;
        $scope.loading = false;
      });
    }
  };

  $scope.$watch('searchTerm', function(){
    if(doSearchTimeout){
      $timeout.cancel(doSearchTimeout);
    }

    doSearchTimeout = $timeout(function(){
      $scope.searchVids();
    }, 250);
  });

}]);
'use strict';

app.controller('ImgurController', ['$scope', '$timeout', 'Imgur',
  function($scope, $timeout, Imgur){

    $scope.images = [];
    $scope.search = 'testing';
    $scope.page = 1;
    $scope.loading = false;
    var doSearchTimeout = false;

    $scope.loadImages = function(){
      Imgur.search($scope.search, $scope.page, function(data){
        $scope.images = data;
      });
    };

    $scope.$watch('search', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      doSearchTimeout = $timeout(function(){
        $scope.loadImages();
      }, 250);
    });

}]);
'use strict';

app.controller('ImgurController', ['$scope', '$timeout', 'Imgur',
  function($scope, $timeout, Imgur){

    $scope.images = [];
    $scope.search = 'basketball';
    $scope.page = 1;
    $scope.loading = false;
    $scope.recent = false;
    $scope.sub = false;
    var doSearchTimeout = false;

    $scope.loadImages = function(){

      $scope.images = [];
      window.scrollTo(0, 0);
      ga('send', 'pageview', 'reddit/' + $scope.search);

      if($scope.recent){
        Imgur.recent($scope.page, function(data){
          $scope.images = data;
        });
      }
      else if($scope.sub){
        Imgur.subrecent($scope.search, $scope.page, function(data){
          console.log(data);
          $scope.images = data;
        });
      }
      else
      {
        Imgur.search($scope.search, $scope.page, function(data){
          $scope.images = data;
        });
      }
    };

    $scope.loadMore = function(){
      $scope.page++;
      $scope.loadImages();
    }

    $scope.$watch('search', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      $scope.page = 1;

      doSearchTimeout = $timeout(function(){
        $scope.loadImages();
      }, 500);
    });

    $scope.$watch('recent', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      $scope.page = 1;

      doSearchTimeout = $timeout(function(){
        $scope.loadImages();
      }, 250);
    });

}]);
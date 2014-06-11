'use strict';

app.controller('VideoController', ['$scope', '$timeout', 'VineService', 
  function($scope, $timeout, VineService){

    $scope.videos = [];
    $scope.loading = false;
    $scope.searchTerm = "fail";
    $scope.page = 1;
    var doSearchTimeout = false;

    $scope.searchVids = function(){
      ga('send', 'pageview', 'vine/' + $scope.searchTerm);

      if(!$scope.searchTerm){
        $scope.videos = [];
      }
      else
      {
        $scope.loading = true;

        VineService.get({ tag: $scope.searchTerm, page: $scope.page }, function(response){
          $scope.videos.push.apply($scope.videos, response.data.records);
          $scope.loading = false;
        });
      }
    };

    $scope.loadMore = function(){
      $scope.page++;
      $scope.searchVids();
    }

    $scope.toggleVideo = function(video){
      var player = document.getElementById("vine-" + video.postId);

      if(!player.getAttribute('src'))
      {
        player.setAttribute('src', video.videoUrl);
        player.play();
      }

      player.addEventListener('click', function(){
        if(player.paused){
          player.play();
        }
        else
        {
          player.pause();
        }
      });
    };

    $scope.$watch('searchTerm', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      doSearchTimeout = $timeout(function(){
        $scope.videos = [];
        $scope.searchVids();
      }, 250);
    });

}]);
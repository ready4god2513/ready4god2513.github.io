'use strict';

app.controller('VideoController', ['$scope', '$timeout', '$location', '$anchorScroll', 'VineService', 
  function($scope, $timeout, $location, $anchorScroll, VineService){

    $scope.videos = [];
    $scope.loading = false;
    $scope.searchTerm = "fail";
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
          console.log($scope.videos);
        });
      }

      $anchorScroll();
    };

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
        $scope.searchVids();
      }, 250);
    });

}]);
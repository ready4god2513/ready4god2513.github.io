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
        });
      }

      // $location.hash('top');
      $anchorScroll();
    };

    $scope.playVideo = function(video){
      var player = document.getElementById("player").cloneNode(true),
          item = document.getElementById("vine-" + video.postId);
      item.innerHTML = null;
      item.appendChild(player);
      player.setAttribute('src', video.videoUrl);
      player.setAttribute('width', '100%');
      player.play();

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
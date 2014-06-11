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
        console.log($scope.videos);
      });
    }
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
      player.pause();
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
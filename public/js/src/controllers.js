'use strict';

app.controller('VideoController', ['$scope', '$timeout', 'Vine', 
  function($scope, $timeout, Vine){

    $scope.videos = [];
    $scope.loading = false;
    $scope.searchTerm = "fail";
    $scope.page = 1;
    $scope.categories = [];
    $scope.category = null;
    var doSearchTimeout = false;

    $scope.searchVids = function(){
      ga('send', 'pageview', 'vine/' + $scope.searchTerm);

      if(!$scope.searchTerm){
        $scope.videos = [];
      }
      else
      {
        $scope.loading = true;

        if($scope.category){
          Vine.channel($scope.category.featuredChannelId, $scope.page, function(response){
            $scope.videos.push.apply($scope.videos, response.records);
            $scope.loading = false;
          });
        }
        else
        {
          Vine.search($scope.searchTerm, $scope.page, function(response){
            $scope.videos.push.apply($scope.videos, response.records);
            $scope.loading = false;
          });
        }
      }
    };

    $scope.loadCategories = function(){
      Vine.channels(function(response){
        $scope.categories = response.records;
      });
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

    $scope.$watch('category', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      doSearchTimeout = $timeout(function(){
        $scope.videos = [];
        $scope.searchVids();
      }, 250);
    });

}]);
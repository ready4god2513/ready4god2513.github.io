'use strict';

app.controller('InstagramController', ['$scope', '$timeout', 'Instagram', 
  function($scope, $timeout, Instagram){

    $scope.pics = [];
    $scope.tag = 'fail';
    $scope.loading = false;
    $scope.maxID = null;

    var doSearchTimeout = false;

    $scope.loadPics = function(){
      ga('send', 'pageview', 'instagram/' + $scope.tag);
      $scope.loading = true;
      Instagram.search($scope.tag, $scope.maxID, function(res){
        $scope.maxID = res.pagination.next_max_id;
        $scope.loading = false;
        $scope.pics.push.apply($scope.pics, res.data);
      });
    };

    $scope.$watch('tag', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      doSearchTimeout = $timeout(function(){
        $scope.pics = [];
        $scope.loadPics();
      }, 500);
    });

}]);
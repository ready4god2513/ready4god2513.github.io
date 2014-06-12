'use strict';

app.controller('InstagramController', ['$scope', '$timeout', 'Instagram', 
  function($scope, $timeout, Instagram){

    $scope.pics = [];
    $scope.tag = 'fail';
    $scope.loading = false;

    var doSearchTimeout = false;

    $scope.loadPics = function(){
      $scope.loading = true;
      Instagram.search($scope.tag, function(data){
        $scope.loading = false;
        $scope.pics = data;
      });
    };

    $scope.$watch('tag', function(){
      if(doSearchTimeout){
        $timeout.cancel(doSearchTimeout);
      }

      doSearchTimeout = $timeout(function(){
        $scope.loadPics();
      }, 250);
    });

}]);
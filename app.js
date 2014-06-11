var app = angular.module('vine', ['ngResource', 'ngRoute']);

app.config(['$routeProvider', function($routeProvider){

  $routeProvider.when('/', {
    templateUrl: '/views/videos.html',
    controller: 'VideoController'
  });

}]);
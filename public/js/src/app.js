var app = angular.module('vine', ['ngResource', 'ngRoute']);

app.config(['$routeProvider', function($routeProvider){

  $routeProvider
    .when('/vine', {
      templateUrl: '/views/vine.html',
      controller: 'VineController'
    })
    .when('/instagram', {
      templateUrl: '/views/instagram.html',
      controller: 'InstagramController'
    })
    .when('/imgur', {
      templateUrl: '/views/imgur.html',
      controller: 'ImgurController'
    })
    .otherwise({
      redirectTo: '/vine'
    });

}]);
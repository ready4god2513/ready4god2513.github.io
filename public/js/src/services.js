'use strict';

app.factory('Vine', ['$http', function($http){
  var baseURL = 'http://bhvine.herokuapp.com';
  return {
    search: function(tag, page, callback){
      $http.jsonp(baseURL + '/search/' + tag + '?page=' + page + '&callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },

    channel: function(tag, page, callback){
      $http.jsonp(baseURL + '/recent/' + tag + '?page=' + page + '&callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },

    channels: function(callback){
      $http.jsonp(baseURL + '/channels?callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },
  };
}]);
'use strict';

app.factory('Vine', ['$http', function($http){
  return {
    search: function(tag, page, callback){
      $http.jsonp('http://bhvine.herokuapp.com/search/' + tag + '?page=' + page + '&callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },

    channel: function(tag, page, callback){
      $http.jsonp('http://bhvine.herokuapp.com/recent/' + tag + '?page=' + page + '&callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },

    channels: function(callback){
      $http.jsonp('http://bhvine.herokuapp.com/channels?callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },
  };
}]);
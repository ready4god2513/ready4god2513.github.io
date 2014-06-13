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

app.factory('Instagram', ['$http', function($http){
  return {
    search: function(tag, callback){
      var endPoint = 'https://api.instagram.com/v1/tags/' + tag + '/media/recent?client_id=642176ece1e7445e99244cec26f4de1f&callback=JSON_CALLBACK';

      $http.jsonp(endPoint).success(function(response){
        callback(response.data);
      });
    }
  }
}]);

app.factory('Imgur', ['$http', function($http){
  var baseURL = 'http://bhvine.herokuapp.com/imgur/';

  return {
    search: function(search, page, callback){
      $http.jsonp(baseURL + search + '/' + page + '?callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },

    recent: function(page, callback){
      $http.jsonp(baseURL + 'recent/' + page + '?callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    },

    subrecent: function(search, page, callback){
      $http.jsonp(baseURL + 'sub/' + search + '/' + page + '?callback=JSON_CALLBACK').success(function(response){
        callback(response.data);
      });
    }
  }
}]);
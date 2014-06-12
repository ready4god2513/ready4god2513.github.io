'use strict';

app.factory('VineSearch', ['$resource', function($resource){
  return $resource('http://bhvine.herokuapp.com/search/:tag', 
  {
    tag: 'search',
    callback: 'JSON_CALLBACK'
  }, 
  {
    get: {
      method: 'JSONP'
    }
  });
}]);

app.factory('VinePopular', ['$resource', function($resource){
  return $resource('http://bhvine.herokuapp.com/popular', 
  {
    tag: 'search',
    callback: 'JSON_CALLBACK'
  }, 
  {
    get: {
      method: 'JSONP'
    }
  });
}]);

app.factory('VineRecent', ['$resource', function($resource){
  return $resource('http://bhvine.herokuapp.com/recent/:tag', 
  {
    tag: 'search',
    callback: 'JSON_CALLBACK'
  }, 
  {
    get: {
      method: 'JSONP'
    }
  });
}]);

app.factory('VineChannels', ['$resource', function($resource){
  return $resource('http://bhvine.herokuapp.com/channels', 
  {
    tag: 'search',
    callback: 'JSON_CALLBACK'
  }, 
  {
    get: {
      method: 'JSONP'
    }
  });
}]);
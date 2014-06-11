'use strict';

app.factory('VineService', ['$resource', function($resource){
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
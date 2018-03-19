/* global _, angular */
var app = angular.module('twitchlive', ['ngRoute', 'angular-jwt'])

.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
          controller: 'MainController',
      })
      .when('/about', {
        templateUrl: 'html/about.html',
        controller: 'SiteController',
      })
      ;

    $locationProvider.html5Mode(true);
}])
    
.factory('twitchFactory', ['$http', 'jwtHelper', function($http, jwt) {
    return {
        'followed': function() {
            return $http.get('https://api.twitch.tv/kraken/streams/');
        },
        'topchannels': function() {
            return $http.get('https://api.twitch.tv/kraken/streams');
        }
    }
}])

.factory('authFactory', ['$http', function($http) {
    return {
        
    }
}])

.controller('MainController', ['$scope', '$filter','$routeParams', '$route', '$location', 'twitchFactory', 'authFactory',
    function($scope, $filter, $routeParams, $route, $location, twitch, auth) {
        
        $scope.authed = true;
        
    }
])

;
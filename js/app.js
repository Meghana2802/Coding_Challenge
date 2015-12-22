'use strict';
var app = angular.module('App', ['LocalStorageModule','angular-md5', 'ngRoute']);
app.config(function($routeProvider) {
  $routeProvider
  // route for the home page
  .when('/', {
      templateUrl : 'partials/index.html',
      controller  : 'NDBController'
  })
  // route for the user page
  .when('/favorites', {
      templateUrl : 'partials/user.html',
      controller  : 'NDBController'
  });
});
app.factory('usdaDataService', ['$http', function ($http) {

    var urlBase = 'http://api.nal.usda.gov/ndb';
    var api = "w5fUF92876QTdHSulxylvjZ08dXtf4XM0V94Kz8u";
    var usdaDataService = {};

    usdaDataService.searchFood = function (search) {
        return $http.get(urlBase+"/search/?q="+search+"&format=json&sort=n&max=25&offset=0&api_key=" + api);
    };

    usdaDataService.foodInfo = function (ndbno) {
        return $http.post(urlBase + "/reports/?ndbno="+ndbno +"&type=b&format=json&api_key=" +api);
    };
    return usdaDataService;

}]);

app.controller('NDBController', function($scope, $location, localStorageService, md5, usdaDataService){
    var pendingTask;

    $scope.ndbno = "";
    $scope.favorites = localStorageService.get('favorites');
    if($scope.search === undefined){
      $scope.search = "";
      fetch();
    }

    $scope.change = function(){
      if(pendingTask){
        clearTimeout(pendingTask);
      }
      pendingTask = setTimeout(fetch, 800);
    };

    function fetch(){
      var key = "s_"+md5.createHash($scope.search || '');
      if(localStorageService.get(key)){
        $scope.foodSearch = localStorageService.get(key);
        if (!$scope.$$phase) $scope.$apply()
      }else{
        usdaDataService.searchFood($scope.search)
        .success(function(response){ 
            $scope.foodSearch = response.list; 
            localStorageService.set( key, response.list);
            // Auto select the first item
            //$scope.update($scope.foodSearch.item[0]);
        }).error(function (response) {
            $scope.foodSearch = {};
        });
      }


    }
    function details(){
      var key = "i_"+md5.createHash($scope.ndbno || '');
      if(localStorageService.get(key)){
        $scope.details = localStorageService.get(key);
        $scope.details.Response = 'True';
        if (!$scope.$$phase) $scope.$apply()
      }else{
        usdaDataService.foodInfo($scope.ndbno)
        .success(function(response){ 
            $scope.details = response.report.food; 
            localStorageService.set( key, response.report.food);
            $scope.details.Response = 'True';
        }).error(function (response) {
            $scope.details = {};
            $scope.details.Response = 'False';
        });
      }
    }

    $scope.update = function(food){
      $location.path('/');
      $scope.search = food.name;
      $scope.ndbno = food.ndbno;
      $scope.change();
      details();
    };

    $scope.select = function(){
      this.setSelectionRange(0, this.value.length);
    }
    $scope.addFav = function(name, ndb){
      $location.path('/favorites');
      var key = 'favorites';
      if(localStorageService.get(key)){
        var favorites= localStorageService.get(key);        
      }else{
        var favorites = {};
      }
      favorites[ndb] = {'name':name, 'ndbno': ndb};
      localStorageService.set(key, favorites);
    }
    $scope.removeFav = function(ndb){
      var key = 'favorites';
      var favorites= localStorageService.get(key);
      console.log(favorites);
      delete favorites[ndb];
      localStorageService.set(key, favorites);
      $location.path('/favorites');
    }
  });

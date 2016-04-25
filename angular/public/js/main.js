// App and controller are attached to HTML with ng-app and ng-controller attributes
var myApp = angular.module('myApp', ['ngResource', 'ui.bootstrap']);

myApp.controller('myCtrl', ['$scope', '$resource', '$timeout', function($scope, $resource, $timeout) {
	// $scope.* variables are accessible in the HTML document this controller is attached to without using the $scope. prefix
	$scope.page = 'search';
	$scope.favorites = [];
	$scope.searchResults = [];

	// $resource objects are an extended object that provides easy Asynchronous calls against APIs
	// isArray refers to what the returned object from the REST API call is going to be (array or single object)
	// Resource for accessing our api
	var Favorites = $resource('/api/favorites/:id', {}, {
		get: {
			method: 'GET',
			isArray: true
		},
		post: {
			method: 'POST',
			isArray: true
		},
		delete: {
			method: 'DELETE',
			isArray: true
		}
	});

	// Resource for accessing the OMDB API
	var Omdb = $resource('http://www.omdbapi.com/', {}, {
		get: {
			method: 'GET',
			isArray: false
		}
	});

	// Function that is accessible in HTML document
	$scope.getFavorites = function() {
		$scope.favorites = [];
		Favorites.get({}, function(data){
			// Get additional details of each favorited movie and push into favorites list
			data.forEach(function(movie) {
				// The first parameter object in a GET/DELETE $resource call is setting url parameters
				// The second parameter is a success callback function (HTTP Status Code 200)
				// The third parameter (optional) is an error callback function (Anything status code other than 200)
				Omdb.get({
					i: movie.imdbID
				}, function(data){
					$scope.favorites.push(data);
				});
			});
		});
	}

	$scope.search = function(searchText) {
		$scope.searchResults = [];
		Omdb.get({
			s: searchText
		}, function(data) {
			// Get additional details of each movie search result and push into search results list
			data.Search.forEach(function(movie) {
				Omdb.get({
					i: movie.imdbID
				}, function(data) {
					$scope.searchResults.push(data);
				});
			});
		});
	}

	$scope.addFav = function(movie) {
		// In POST $resource calls, the first parameter is an optional parameter object for setting url parameters
		// The second parameter is the data passed in a POST request and is displayed here (an object with one parameter called imdbID)
		// The third and fourth parameters are the success/error callback functions
		Favorites.post({
			imdbID: movie.imdbID
		}, function(data) {
			// Get movie's details and push into favorites list
			Omdb.get({
				i: movie.imdbID
			}, function(data) {
				$scope.favorites.push(data);
			});
		});
	}

	$scope.rmvFav = function(movie) {
		Favorites.delete({
			id: movie.imdbID
		}, function(data) {
			// Find movie that was deleted and remove it from favorites list
			for(var i = 0; i < $scope.favorites.length; i++) {
				if(movie.imdbID === $scope.favorites[i].imdbID) {
					$scope.favorites.splice(i,1);
					break;
				}
			}
		});
	}

}]);
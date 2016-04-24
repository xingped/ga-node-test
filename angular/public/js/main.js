var myApp = angular.module('myApp', ['ngResource', 'ui.bootstrap']);

myApp.controller('myCtrl', ['$scope', '$resource', '$timeout', function($scope, $resource, $timeout) {
	$scope.page = 'search';
	$scope.favorites = [];
	$scope.searchResults = [];

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

	$scope.getFavorites = function() {
		$scope.favorites = [];
		$scope.favExpand = [];
		Favorites.get({}, function(data){
			// Get additional details of each favorited movie and push into favorites list
			data.forEach(function(movie) {
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
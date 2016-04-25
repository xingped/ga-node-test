// asynchronus api requests function
function httpAsync(method, url, data, callback) {
    var xmlHttp;
    if(window.XMLHttpRequest) {
    	// for IE7+, Firefox, Chrome, Opera, Safari
    	xmlHttp = new XMLHttpRequest();
    } else {
    	// for IE5/6
    	xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
        }
    }
    xmlHttp.open(method, url, true); // true for asynchronous 
    if(url.indexOf('/api/') === 0) xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(data);
}

// DOM Parser is not available in IE8 or below, I believe
var domParser = new DOMParser();
var mainDiv = document.getElementById('mainDiv');
var currentPage = 'search';

// When search/favorites nav buttons are clicked, get corresponding page
// The proper way to bind click events to HTML tags is as shown here, via addEventListener
// While possible, onclick="" on HTML elements is NOT recommended
document.getElementById('searchPage').addEventListener('click', getSearchPage, false);
document.getElementById('favPage').addEventListener('click', getFavoritesPage, false);

function getSearchPage() {
	httpAsync('GET', 'search.html', null, function(data) {
		currentPage = 'search';
		mainDiv.innerHTML = '';
		mainDiv.insertAdjacentHTML('beforeEnd', data);
		// bind search function to search button
		document.getElementById('searchBtn').addEventListener('click', function() {
			searchText = document.getElementById('searchField').value;
			search(searchText);
		});
		// bind search to pressing enter while in search field
		document.getElementById('searchField').addEventListener('keyup', function(e) {
			e = e || window.event;
			// checks if 'enter' was pressed while the cursor is in the search field
			if(document.activeElement === document.getElementById('searchField') && e.keyCode === 13) {
				searchText = document.getElementById('searchField').value;
				search(searchText);
			}
		});
	});
}

function getFavoritesPage() {
	httpAsync('GET', 'favorites.html', null, function(data) {
		currentPage = 'favorites';
		mainDiv.innerHTML = '';
		mainDiv.insertAdjacentHTML('beforeEnd', data);

		// Get favorites and add to page
		httpAsync('GET', '/api/favorites', null, function(data) {
			data = JSON.parse(data);
			// Get extended movie info for 
			data.forEach(function(movie) {
				httpAsync('GET', 'https://www.omdbapi.com/?i='+movie.imdbID+'&plot=short&r=json', null, function(data) {
					addMovie(document.getElementById('favoritesList'), JSON.parse(data));
				});
			});
		});
	});
}

// Incoming users will initially start on the search page
getSearchPage();

// Create the movie DOM element that will be replicated and inserted into the page for search results and fav list
var movieElem;
httpAsync('GET', 'movie.html', null, function(data) {
	movieElem = domParser.parseFromString(data, 'text/xml');
}, false);

// Get all favorites
var favoritesList;
httpAsync('GET', '/api/favorites', null, function(data) {
	favoritesList = JSON.parse(data);
});

// Send api request to our server to store favorites
function addFav(movie) {
	httpAsync('POST', '/api/favorites', JSON.stringify(movie), function(data) {
		favoritesList = JSON.parse(data);
		var rmvBtn = document.getElementById('rmvFavBtn'+movie.imdbID);
		rmvBtn.className = rmvBtn.className.replace('hidden', '');
		document.getElementById('addFavBtn'+movie.imdbID).className += ' hidden';
	});
}

// Send api request to our server to remove favorite by ID
function removeFav(imdbID) {
	httpAsync('DELETE', '/api/favorites/'+imdbID, null, function(data){
		// remove movie from favorites list and remove element from page
		for(var i = 0; i < favoritesList.length; i++) {
			if(imdbID === favoritesList[i].imdbID) {
				favoritesList.splice(i,1);
				if(currentPage === 'search') {
					// On the search page, simply switch the hidden status of the favorite/remove buttons
					var favBtn = document.getElementById('addFavBtn'+imdbID);
					favBtn.className = favBtn.className.replace('hidden', '');
					document.getElementById('rmvFavBtn'+imdbID).className += ' hidden';
				} else if(currentPage === 'favorites') {
					// On the favorites page, remove the movie element from the page entirely
					var containerElem = document.getElementById('favoritesList');
					var movieElem = document.getElementById(imdbID);
					console.log(imdbID);
					console.log(movieElem);
					if(movieElem) containerElem.removeChild(movieElem);
				}
				break;
			}
		}
	});
}

// Run search against API, create and append elements to search results
// example: http://www.omdbapi.com/?s=Star+Wars&y=&plot=short&r=json
function search(text) {
	httpAsync('GET', 'https://www.omdbapi.com/?s='+encodeURIComponent(text)+'&r=json', null, function(data){
		// destroy current search results
		document.getElementById('searchResults').innerHTML = '';

		// iterate over returned data and create new search results
		data = JSON.parse(data);
		data.Search.forEach(function(movie){
			// Reach back out to omdb api to get movie information
			httpAsync('GET', 'https://www.omdbapi.com/?i='+movie.imdbID+'&plot=short&r=json', null, function(data) {
				addMovie(document.getElementById('searchResults'), JSON.parse(data));
			});
		});
	});
}

// Method to set up and add movie element to the DOM
function addMovie(parent, movie) {
	// Set up DOM element to be created
	var newChild = movieElem.cloneNode(true);
	newChild.getElementsByName('movieElem')[0].setAttribute('id', movie.imdbID);
	newChild.getElementsByName('title')[0].innerHTML = movie.Title;
	newChild.getElementsByName('year')[0].innerHTML = 'Released: '+movie.Year;
	newChild.getElementsByName('director')[0].innerHTML = 'Director: '+movie.Director;
	newChild.getElementsByName('plot')[0].innerHTML = 'Plot: '+movie.Plot;

	// set up element IDs for adding event listeners after movie element is added to DOM
	newChild.getElementsByName('collapseBody')[0].setAttribute('id', 'collapseBody'+movie.imdbID);
	newChild.getElementsByName('collapseHeader')[0].setAttribute('id', 'collapseHeader'+movie.imdbID);
	newChild.getElementsByName('addFavBtn')[0].setAttribute('id', 'addFavBtn'+movie.imdbID);
	newChild.getElementsByName('rmvFavBtn')[0].setAttribute('id', 'rmvFavBtn'+movie.imdbID);

	// check if element is in favorites list and hide add/remove favorite button as appropriate
	var found = false
	for(var i = 0; i < favoritesList.length; i++) {
		if(movie.imdbID === favoritesList[i].imdbID) {
			newChild.getElementsByName('addFavBtn')[0].className += ' hidden';
			found = true;
			break;
		}
	}
	if(!found) {
		newChild.getElementsByName('rmvFavBtn')[0].className += ' hidden';
	}

	// Add the new dom element to the search results
	parent.insertAdjacentHTML('beforeEnd', newChild.documentElement.outerHTML);

	// Click function to show/hide movie details when movie title is clicked
	document.getElementById('collapseHeader'+movie.imdbID).addEventListener('click', function(){
		var collapseBody = document.getElementById('collapseBody'+movie.imdbID);
		if(collapseBody.className.indexOf('hidden') > -1) {
			collapseBody.className = collapseBody.className.replace('hidden', '');
		} else {
			collapseBody.className = collapseBody.className + ' hidden';
		}
	});

	// set up event listeners for add/remove fav buttons
	document.getElementById('addFavBtn'+movie.imdbID).addEventListener('click', function() {
		addFav({imdbID: movie.imdbID});
	});
	document.getElementById('rmvFavBtn'+movie.imdbID).addEventListener('click', function() {
		removeFav(movie.imdbID);
	});
}
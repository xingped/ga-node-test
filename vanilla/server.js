var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
// missing bodyParser declaration
var bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// Missing parenthesis
app.use('/', express.static(path.join(__dirname, 'public')));

// Good coding note: prefix api request paths with /api/
// Good coding note: Always send a status code
// Missing closing bracket and parenthesis
app.get('/api/favorites', function(req, res){
  var data = fs.readFileSync('./data.json');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(data);
});

// Wrong method and missing leading slash
app.post('/api/favorites', function(req, res){
  // Missing closing bracket and semicolon after return statement
  if(!req.body || !req.body.imdbID){
    res.send("Error, Object with imdbID not provided");
    return;
  }
  
  // open data file, append new favorite, write data file
  var data = JSON.parse(fs.readFileSync('./data.json'));

  // make sure movie isn't already in favorites
  var found = false;
  for(var i = 0; i < data.length; i++) {
    if(req.body.imdbID === data[i].imdbID) {
      found = true;
      break;
    }
  }
  if(!found) data.push(req.body);

  fs.writeFile('./data.json', JSON.stringify(data));
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(data);
});

app.delete('/api/favorites/:id', function(req, res){
  // Loop over stored data, remove indicated favorite
  var data = JSON.parse(fs.readFileSync('./data.json'));
  for(var i = 0; i < data.length; i++) {
    if(data[i].imdbID === req.params.id) {
      data.splice(i,1);
      fs.writeFile('./data.json', JSON.stringify(data));
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send([]);
});

// misspelling of "listen" function call
app.listen(3000, function(){
  console.log("Listening on port 3000");
});
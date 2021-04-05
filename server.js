'use strict';

require("dotenv").config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
// const cors = require('cors');
const DATABASE_URL=process.env.DATABASE_URL;

const app = express();
const PORT = process.env.PORT || 3000;
// app.use(cors());
// app.use(express.urlencoded());
app.set('view engine', 'ejs');

const client = new pg.Client(DATABASE_URL);
client.on('error', err => console.error(err));



// app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static( "./puplic"));

app.post('/searches', createSearch);
app.get('/', renderHomePage);
app.get('/hello', renderHomePage);
app.get('/searches/new', showForm);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

client.connect().then(() => {
  app.listen(PORT, () => {
      console.log(`The PORT is : ${PORT}`);
  })
})



function Book(info) {

   const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
   this.thumbnail=info.imageLinks?info.imageLinks.thumbnail:'https://i.imgur.com/J5LVHEL.jpg';
   this.title = info.title || 'No title available';
   this.authors=info.authors;
   this.description=info.description;
}

function renderHomePage(request, response) {

  const selectBookQuery = 'SELECT * FROM books;';
  client.query(selectBookQuery).then((results => {
    response.render('pages/index.ejs', { results: results.rows });
  })).catch(error => {
    console.log('Error',error)
  });
 
  // response.render('pages/index');
}

function showForm(request, response) {
  response.render('pages/searches/new.ejs');
}

function createSearch(request, response) {
  let url = `https://www.googleapis.com/books/v1/volumes`;

  console.log(request.body);
  const searchBy = request.body.searchBy;
  const searchValue = request.body.search;
  const queryObj = {};
  if (searchBy === 'title') {
    // url = `https://www.googleapis.com/books/v1/volumes&q=${searchValue}`;
    queryObj['q'] = `+intitle:${searchValue}`;

  } else if (searchBy === 'author') {
    queryObj['q'] = `+inauthor:${searchValue}`;
//    url = `https://www.googleapis.com/books/v1/volumes&q=${searchValue}`;
  }

  superagent.get(url).query(queryObj).then(apiResponse => {
    return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
  }).then(results => {
    response.render('pages/searches/show', { searchResults: results })
  }).catch(error => {
    console.log('ERROR', error);
    return res.render('pages/error', { error: error });
  });
}


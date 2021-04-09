'use strict';

const express = require('express');
const superagent = require('superagent');
// const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;
// app.use(cors());
app.use(express.urlencoded());
app.set('view engine', 'ejs');

app.use(express.static( "./puplic"));
app.use(express.urlencoded({ extended: true }));


app.get('/', renderHomePage);
app.get('/hello', renderHomePage);
app.get('/searches/new', showForm);
app.post('/searches', createSearch);




app.get('*', (request, response) => response.status(404).send('This route does not exist'));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

function Book(info) {

   const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

   this.thumbnail=info.imageLinks?info.imageLinks.thumbnail:'https://i.imgur.com/J5LVHEL.jpg';
   this.title = info.title || 'No title available';
   this.authors=info.authors || 'No authors available';
   this.description=info.description || 'No description available';
}

function renderHomePage(request, response) {
  response.render('pages/index');
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
    return response.render('pages/error', { error: error });
  });
}
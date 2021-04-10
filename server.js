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


app.use(express.static( "./puplic"));
app.use(express.urlencoded({ extended: true }));


app.get('/', renderHomePage);
app.get('/hello', renderHomePage);
app.get('/searches/new', showForm);
app.post('/searches', createSearch);




app.get('*', (request, response) => response.status(404).send('This route does not exist'));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

const client = new pg.Client(DATABASE_URL);
client.on('error', err => console.error(err));



// app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static( "./puplic"));
app.post('/searches',createSearch);
app.post('/books',saveData);
app.get('/book/:id',getMyBook);
app.get('/searches/new',showForm);
app.get('/', renderHomePage);
app.get('/hello', renderHomePage);
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
   this.authors=info.authors ||'No authors available';
   this.isbn = info.industryIdentifiers[0].identifiers || 'No ISBN available'; 
   this.description=info.description || 'No description available' ;

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


function showForm(request, response){

  response.render('pages/searches/new.ejs');

}
function getMyBook(request, response) {
  const id= request.params.id;
  const myReq='SELECT * FROM books WHERE id=$1'
  const idValue= [id];

  client.query(myReq,idValue).then(results=>{
    console.log(results.rows[0]);
response.render('pages/books/detail', {results:results.rows[0]})
  }).catch(error=>{
    console.log('ERROR',error)
  })

}

function saveData(request, response) {

  const { title,ISPN, authors, description , image_url } = request.body;

  const sqlQuery = 'INSERT INTO books (title,ISPN, authors, description , image_url ) VALUES($1,$2,$3,$4,$5) RETURNING id;';
  const safeValues = [title,ISPN, authors, description , image_url ];

  client.query(sqlQuery, safeValues).then(results => {
    response.redirect(`/book/${results.rows[0].id}`);
  }).catch(error=>{
    console.log('ERROR',error)
  })

  // response.render('pages/searches/new.ejs');
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


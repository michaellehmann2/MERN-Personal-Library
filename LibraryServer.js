//comment 
require('dotenv').config();
const express = require('express');
const {MongoClient} = require('mongodb');

const cs = process.env.MONGO_URI;
let db;
let books;

async function start() {
  const client = new MongoClient(cs);
    await client.connect();
    db = client.db("Library");
    books = db.collection("Books");
  console.log("listening on port 3000");
  app.listen(3000);
}

var app = express();

//provided middleware for CORS
app.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods',
  'GET,PUT,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',
  'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === "OPTIONS") res.sendStatus(200);
  else next();
});

app.use(express.json());

//get more than one book
app.get('/books', (req,res) => {
  var query = req.query;

  //if there was no query
  if (Object.keys(query).length < 1) {
    books.find()
    .project({_id: 0})  //we only want our id and the title returned
    .toArray()
    .then( allBooks => {
      res.send(JSON.stringify(allBooks))
    })
  }

  //if query was available books
  else if (query.avail=='true') {
    books.find( {"avail" : true } ).project({_id: 0}).toArray()
    .then ( allBooks => {
      res.send(JSON.stringify(allBooks))
    })
  }

  //if query was for unavailable books
  else if (query.avail=='false') {
    books.find( {"avail" : false }).project({_id: 0}).toArray()
    .then ( allBooks => {
      res.send(JSON.stringify(allBooks))
    })
  }
});

//get one book
app.get('/books/:id', (req,res) => {
  books.findOne( {"id" : req.params.id})
  .then( bookDetails => {
    //if book with specified id doesn't exist
    if (bookDetails == null) {
      res.sendStatus(404);
    }
    else {
      //get rid of mongo id, we don't need that
      delete bookDetails._id;
      res.send(JSON.stringify(bookDetails))
    }
  })
});

//add new book
app.post('/books', (req,res) => { 
  //check to see if requested id already exists
  books.findOne( {"id" : req.body.id })
  .then (book => {
    if (book == null) {
      books.insertOne(req.body);
      res.sendStatus(201);
    }
    //if book with that id already exists, we can't create a new book with that id
    else {
      res.sendStatus(403);
    }
  })
});

//update existing book details
app.put('/books/:id', (req,res) => { 
  //check if that id already exists
  books.findOne( {"id" : req.params.id})
  .then(book => {
    if (book == null) {
      res.sendStatus(404);
    }
    else {
      books.updateOne(book, {$set: req.body});
      res.sendStatus(200);
    }
  })
});

//delete existing book
app.delete('/books/:id', (req,res) => {
  //check if book with that id exists
  books.findOne( {"id" : req.params.id} )
  .then(book => {
    if (book == null) {
      res.sendStatus(204);
    }
    else {
      books.deleteOne(book);
      res.sendStatus(200);
    }
  })
});


start()
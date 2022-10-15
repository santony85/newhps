// Chargement de la bibliothèque express
const express = require('express');
const ejs = require('ejs');
const app = express();
const http = require('http');
const alasql = require('alasql');
const regexp_quote = require("regexp-quote");


app.set('view engine', 'ejs');

//const MongoClient = require('mongodb', {useUnifiedTopology: true}).MongoClient;
const assert = require('assert');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require("helmet");
const morgan = require('morgan')
const path = require('path');
const minify = require('express-minify');
const compression = require('compression')
const ObjectID = require('mongodb').ObjectID;

var idc = 'AB5433FF54678';
var delOld = "";
var num = 0;
var session = require('client-sessions');

var mongo = require('mongodb');
var Server = mongo.Server,
  Db = mongo.Db;
  
var dbo;
var db;

var server = new Server('localhost', 27017, { auto_reconnect: true });
dbo = new Db('engie', server);

dbo.open(function(err, db) {
  if (!err) {
	dbo.authenticate("AdminDbR@@t", "NewPass2015", function(err, res) {
	  // callback
	  console.log("Connected to 'engie' database");
	});
  }
});


/*MongoClient.connect(url, function (err, db) {
	if (err) throw err;
	db = db;
	dbo = db.db("newhps");
	console.log("Database connected!");
});*/

//app.use(compression());
//app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json({limit: "50mb"}));

//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

app.get('/listrapportscdv/:idp',function(req,res){
  var idp="63345fcfd512fe03c686211b"	
  //var idp = req.params.idp.toString();
  var globTable=[];
  dbo.collection("newhpsusers").find({idcdv:idp},{"_id":1}).toArray(function (err, items) {
	var test = items;
	let result = test.map(({ _id }) => _id)	

	let param =  {
	  "$or": [
		{
		  "idcomhps1": {
			"$in": result
		  }
		},
		{
		  "idcomhps2": {
			"$in": result
		  }
		}
	  ]
	}
	var pr = JSON.stringify(param)
	dbo.collection("newhpsrdv").find(JSON.parse(pr)).sort({"dateRdv": 1}).toArray(function (err, items2) {
	  res.json(items2)
	})
	
  })
})





/*----- /API -----*/

var httpServer = http.createServer(app);
httpServer.listen(99);
console.log("Server connected! port 90");
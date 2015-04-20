var mongo = require('mongodb').MongoClient,
    express = require('express'),
    app = express(),
    cons = require('consolidate'), // Templating library adapter for Express
    swig = require('swig'),
    routes = require('./routes'); // Routes for our application
    //http = require("http");

//var conn = mongo.db('mongodb://localhost:27017/Otf2Data'); // db connection


mongo.connect('mongodb://localhost:27017/Otf2Data', function(err, db){


	swig.setDefaults({ varControls: ['<%=', '%>'] }); // change standard swig template


	app.engine('html', cons.swig);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');

	app.use(express.static(__dirname + '/public'));


	var bodyParser = require('body-parser');
	app.use( bodyParser.json() );       // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded({ extended: true }));



	routes(app, db);

	app.listen(3000);
	console.log('Express server started on port ' + 3000);

});




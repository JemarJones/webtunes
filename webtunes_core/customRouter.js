var mysql = require('mysql');
var db_config = {
	host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
	port     : process.env.OPENSHIFT_MYSQL_DB_PORT,
	user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
	password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
	database : 'app',
	socket   : process.env.OPENSHIFT_MYSQL_DB_SOCKET
	// host     : '127.0.0.1',
	// port     : '3306',
	// user     : 'adminaa3VEnF',
	// password : 'WVD5jG1Tz3Dx',
	// database : 'app',
	// socket   : process.env.OPENSHIFT_MYSQL_DB_SOCKET
};

var connection;
handleDisconnect();

function handleDisconnect() {
	connection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused.
	connection.connect(function(err) {              // The server is either down
	if(err) {                                     // or restarting (takes a while sometimes).
		console.log('error when connecting to db:', err);
		setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
	}                                     // to avoid a hot loop, and to allow our node script to
	});                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
                                          connection.on('error', function(err) {
                                          	console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
			handleDisconnect();                         // lost due to either server restart, or a
		} else {                                      // connnection idle timeout (the wait_timeout
			throw err;                                  // server variable configures this)
                                      }
                                  });
                                      }




//Router functions for the customPage
exports.customPage = function(req, res){
	var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
	console.log(query);
	var albums;
	connection.query(query,function(err,rows,fields){
		if (!err){
			console.log("The rows are as following");
			console.log(rows);
			albums = organize(rows);
			console.log(albums);
		}else{
			console.log(err);
		}
	});
	res.render('customCoverArt',{css: ['../css/customPage.css'],js: ['../js/customPage.js'], albums: [{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'}]});
	// res.render('customCoverArt',{css: ['../css/customPage.css'],js: ['../js/customPage.js'], albums: albums});
};
var organize = function(rows){
	var albums = [];
	for (var i = 0; i < rows.length; i++){
		var position = contains(albums,rows[i].album);
		if (position == albums.length){
			albums[position] = [];
		}
		albums[position][albums[position].length] = rows[i];
	}
	return albums;
};
var contains = function(albums, newAlbum){
	//Todo: implement with binaryinsertionsort
	for (var i = 0; i < albums.length; i++){
		if (albums[i][0].album == newAlbum){
			return i;
		}
	}
	return albums.length;
};
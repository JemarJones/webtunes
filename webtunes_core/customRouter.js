var sqlStarter = require('./sqlStarter');


//Router functions for the customPage
exports.customPage = function(req, res){
	var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
	var albums;
	sqlStarter.connection.query(query,function(err,rows,fields){
		if (!err){
			albums = organize(rows);
			res.render('customCoverArt',{css: ['../css/customPage.css','http://fonts.googleapis.com/css?family=Roboto'],js: ['../js/customPage.js'], albums: albums});
		}else{
			console.log(err);
		}
	});
};
//A function that client js can call to get the albums array
exports.albumData = function(req,res){
	var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
	var albums;
	sqlStarter.connection.query(query,function(err,rows,fields){
		if (!err){
			albums = organize(rows);
			res.send(albums);
		}else{
			console.log(err);
		}
	});
};
//Organizes rows into albums
var organize = function(rows){
	var albums = [];
	for (var i = 0; i < rows.length; i++){
		var position = posToPlace(albums,rows[i]);
		if (position == albums.length){
			albums[position] = [];
		}
		albums[position][albums[position].length] = rows[i];
	}
	return albums;
};
//Finds the position that the new track should be placed
var posToPlace = function(albums, newTrack){
	//Todo: implement with binaryinsertionsort
	for (var i = 0; i < albums.length; i++){
		if (albums[i][0].album == newTrack.album){
			return i;
		}
	}
	return albums.length;
};

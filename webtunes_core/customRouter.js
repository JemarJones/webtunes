var sqlStarter = require('./sqlStarter');


//Router functions for the customPage
exports.customPage = function(req, res){
	var albums = getData(req);
	console.log(albums);
	if (albums != -1){
		console.log("Got through");
		res.render('customCoverArt',{css: ['../css/customPage.css'],js: ['../js/customPage.js'], albums: albums});
	}else{
		console.log("oops");
	}
};
exports.albumData = function(req,res){
	var albums = getData(req);
	console.log(albums);
	if (albums != -1){
		console.log("Got through albums request");
		res.send(albums);
	}else{
		console.log("albums request oops");
	}
};
var getData = function(req){
	var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
	var albums;
	sqlStarter.connection.query(query,function(err,rows,fields){
		if (!err){
			albums = organize(rows);
			console.log("normal: " + albums);
			return albums;
		}else{
			console.log(err);
			console.log("err: " + albums);
			return -1;
		}
	});
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

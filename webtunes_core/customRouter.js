var sqlStarter = require('./sqlStarter');
//Router functions for the customPage
exports.customPage = function(req, res){
	var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
	// console.log(query);
	var albums;
	sqlStarter.connection.query(query,function(err,rows,fields){
		if (!err){
			// console.log("The rows are as following");
			// console.log(rows);
			albums = organize(rows);
			// console.log(albums);
			// console.log(albums[0][0].art_sm);
			// console.log(albums[0][0].artist);
			// console.log(albums[0][0].title);
			res.render('customCoverArt',{css: ['../css/customPage.css'],js: ['../js/customPage.js'], albums: albums});
		}else{
			console.log(err);
		} 
	});
	// res.render('customCoverArt',{css: ['../css/customPage.css'],js: ['../js/customPage.js'], albums: [{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'},{img: '../images/toPimp.jpeg', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar'}]});
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
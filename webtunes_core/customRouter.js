var fs = require('fs');
var xmldoc = require('xmldoc');
var async = require('async');
var SpotifyWebApi = require('spotify-web-api-node');
var sqlStarter = require('./sqlStarter');

exports.homePage = function(req,res){
	res.render('homePage',{css: ['../css/homePage.css','//fonts.googleapis.com/css?family=Roboto:300'],js: ['https://code.jquery.com/jquery-2.1.3.min.js','../js/homePage.js']});
};

exports.uploadXML = function(req,res){
	console.log(req.files.xml_file.path);
	console.log(req.body.username);

	var songarray=new Array();
	var albumarray=new Array();
	var playcounter;
	var albtest;
  var spotifyCounter=0;
  var databaseAddedCounter=0;
  var errorCounter=0;
	var spotifyApi = new SpotifyWebApi();
  var started=0;
  var currentsong=['','','','',0];

  fs.readFile(req.files.xml_file.path, function(err, data) {
          var document = new xmldoc.XmlDocument(data);
          var extracteddata = document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict");
          //extracteddata=result.plist.dict[0].dict[0].dict;
                /*
                    HEY GUYS WE'RE SOFTWARE ENGINEERS! LOOK AT US USE A QUEUE!
                */
                var spotifyQueue = async.queue(function(task,callback){
                    var thissong = task.thissong;
                    //var thisint = task.thisint;
                    //var keycheck = task.keycheck;

                    currentsong=['','','','',0];
                    //var playcount=0;
                    //console.log(thissong);

                    for (k=0;k<thissong.length-1;k++){
                        
                          if (thissong[k]==" Name"){currentsong[0]=thissong[k+1].split("  ")[1].replace(/ft\./g,"").replace(/feat\./g,"").replace(/\(/g,"").replace(/\)/g,"");}
                          if (thissong[k]==" Artist"){currentsong[1]=thissong[k+1].split("  ")[1];}
                          if (thissong[k]==" Album Artist"){currentsong[2]=thissong[k+1].split("  ")[1];}
                          if (thissong[k]==" Album"){currentsong[3]=thissong[k+1].split("  ")[1];}
                          if (thissong[k]==" Play Count"){currentsong[4]=thissong[k+1].split("  ")[1];}
                    }
                    //console.log(currentsong);
                    spotifyApi.searchTracks(currentsong[0]+" - "+currentsong[1])
                        .then(function(data) {
                        // console.log(data.body.tracks.items[0].name);
                             if (data.body.tracks.items[0]!=undefined){
                             var spotifysong=data.body.tracks.items[0];
                             //console.log(spotifysong);
                             var name = spotifysong.name;
                             //console.log(name);
                             var artist = spotifysong.artists[0].name;
                             var album = spotifysong.album.name;
                             var artlg=spotifysong.album.images[0].url;
                             var artmd=spotifysong.album.images[1].url;
                             var artsm=spotifysong.album.images[2].url;
                             var trackid=spotifysong.id;
                             var albumid=spotifysong.album.id;
                             var albumartist=currentsong[2];
                             var playcount = currentsong[4];
                             console.log(name+" - "+artist);
                             console.log(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid);

                             songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid)); 
                             albumarray.push(new Album(artmd,album,albumartist));
                             callback();
                             //console.log(songarray.length); 
                             //show_image(albummd);
                             //albtest=artmd;
                            }

                            if (data.body.tracks.items[0]==undefined){
                              console.log("Not Found on Spotify");
                              callback();
                            }
                        }, function(err) {
                            errorCounter++;
                            console.log(err);
                            console.log(errorCounter);
                            setTimeout(callback(), 20000);
                            
                            
                            //callback();

                            //console.log(songarray);
                        });
                 },10);

        //spotifyQueue.pause();
                for(var i=0;i<extracteddata.length;i++){
                    //Put each item from the data into are queue to be processed by spotify
                    var parseString=extracteddata[i].toString().replace(/\s<key>/g,"").replace(/<\/key>/g,"").replace(/<integer>/g,"").replace(/<\/integer>/g,"").replace(/<string>/g,"").replace(/<\/string>/g,"");
                    var parseArray=parseString.split("\n")
                    parseArray=parseArray.splice(1,parseArray.length-2)

                    spotifyQueue.push({
                        thissong : parseArray
                        //thissong : extracteddata[i].string,
                        //thisint : extracteddata[i].integer,
                        //keycheck : extracteddata[i].key
                    },function (err) {
                       if (spotifyQueue.length()==0 && started==0){
                        console.log("qwert");
                        spotifyQueue.drain();
                      }
                      console.log(spotifyQueue.length());
                    });

                   
                }
                //spotifyQueue.resume();

                spotifyQueue.drain = function(){
                    //Once the queue is empty
                    console.log("All items processed.");
                    //res.render('customCoverArt',{css: ['./css/customPage.css'],js: ['./js/customPage.js'], albums: albumarray});
                    
                    //Let's just push this to the sql db for now.
                    for(var i=0;i<songarray.length;i++){
                        started=1;
                        var song = songarray[i];
                        //song.name=song.name.replace(/-/g,"").replace(/\?/g,"").replace(/Interlude/g,"");
                        var query = "INSERT INTO user_libraries (user,title,artist,album,playcount,art_lg,art_md,art_sm,track_id,album_id) VALUES ('"+req.body.username+"','"
                            +sqlStarter.escape(song.name)+"','"
                            +sqlStarter.escape(song.artist)+"','"
                            +sqlStarter.escape(song.album)+"',"
                            +song.playcount+",'"
                            +sqlStarter.escape(song.artlg)+"','"
                            +sqlStarter.escape(song.artmd)+"','"
                            +sqlStarter.escape(song.artsm)+"','"
                            +sqlStarter.escape(song.trackid)+"','"
                            +sqlStarter.escape(song.albumid)+"')";
                        
                        spotifyCounter++;
                        console.log(query);

                        sqlStarter.connection.query(query,function(err,rows,fields){
                            if (!err){
                                databaseAddedCounter++;
                                console.log("Added to db.");
                                console.log("i ="+i+" databaseAddedCounter = "+ databaseAddedCounter+" spotifyCounter = "+spotifyCounter);
                                //console.log(spotifyQueue.length());
                                if (databaseAddedCounter==spotifyCounter){
                                  console.log("Everything added to DB");
                                  console.log("Number of songs where the API timed out"+errorCounter);
                                  var querydone = "INSERT INTO users (user,complete) VALUES ('"+req.body.username+"','"
                                                  +1+"')";
                                  sqlStarter.connection.query(querydone,function(err,rows,fields){
                                  if (!err){
                                  console.log("COMPLETED VALUE UPDATED TO USERS DB.")
                                   }else{
                                  console.log(err);
                                  }
                                  });
                                }

                            }else{
                                console.log(err);
                            }
                        });

                    }
                    res.send("Success");

                }   
  });	res.render('waitingRoom',{css: ['../css/loader.css'],js:[]});

};

//Router functions for the customPage
exports.customPage = function(req, res){
  var userLoadedQuery = "SELECT * FROM users WHERE user='"+req.params.user+"'";
  sqlStarter.connection.query(userLoadedQuery,function(err,rows,fields){
    if (!err && rows.length > 0){
      if (rows[0].complete != 1){
        //User isnt done loading so we pull up the load screen
        res.render('waitingRoom',{css: ['../css/loader.css'],js:[]});
      }else{
        //The user exists and is done loading so he go ahead and render there page
        var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
        var albums;
        sqlStarter.connection.query(query,function(err,rows,fields){
          if (!err){
            albums = organize(rows);
            user = req.params.user + " | ";
            user = user.substr(0, 1).toUpperCase() + user.substr(1);
            res.render('customPage',{css: ['../css/customPage.css','//fonts.googleapis.com/css?family=Roboto:300'],js: ['../js/customPage.js'], user: user , albums: albums});
          }else{
            console.log(err); 
          }
        });
      }
    }else{
      //Error or non-existant user, we send them to the homepage
      console.log(err);
      res.redirect('../../');
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

exports.pingUser = function(req,res){
	var query = "SELECT * FROM users WHERE user='"+req.params+"'";
	sqlStarter.connection.query(query,function(err,rows,fields){
		if(!err){
			if(rows.length==0){
				//No user by that name exists.
				res.send("User Not Found");
			}
		} else {
			console.log(err);
		}
	});
}

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

//song name, album , artist , play count, album art url, track id, album id
function Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid){
  this.name=name;
  this.artist=artist;
  this.album=album;
  this.playcount=playcount;
  this.artlg=artlg;
  this.artmd=artmd;
  this.artsm=artsm;
  this.trackid=trackid;
  this.albumid=albumid;
}

function Album(artmd,album,artist){
  this.img=artmd;
  this.title=album;
  this.artist=artist;
}

var fs = require('fs');
var xmldoc = require('xmldoc');
var async = require('async');
var SpotifyWebApi = require('spotify-web-api-node');
var sqlStarter = require('./sqlStarter');
var LastfmAPI = require('lastfmapi');
var lfm = new LastfmAPI({
  'api_key' : 'e0d66a3b8ea5fa90bb9ab39aa51762fd',
  'secret' : 'is 8ab78265bdc75215631380724adefbcf'
});
var colors = require('colors');

exports.homePage = function(req,res){
	res.render('homePage',{css: ['../css/homePage.css','//fonts.googleapis.com/css?family=Roboto:100'],js: ['https://code.jquery.com/jquery-2.1.3.min.js','../js/homePage.js']});
};

exports.uploadXML = function(req,res){
	console.log(req.files.xml_file.path);
	console.log(req.body.username);

	var songarray=new Array();
	var albumarray=new Array();
	var playcounter;
  var parsedCounter = 0;
	var albtest;
  var spotifyCounter=0;
  var databaseAddedCounter=0;
  var errorCounter=0;
  var spotifyApi = new SpotifyWebApi();
  var started=0;
  var currentsong=['','','','',0];

  fs.readFile(req.files.xml_file.path, function(err, data) {
    if(err){
      console.log("Error reading XML.");
      res.send("Critical Error: Failed to load file");
    }

    console.log("XMl Read successfully.");


    var document = new xmldoc.XmlDocument(data);
    var extracteddata = document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict");
          //extracteddata=result.plist.dict[0].dict[0].dict;
    /*
      HEY GUYS WE'RE SOFTWARE ENGINEERS! LOOK AT US USE A QUEUE!
    */
    var spotifyQueue = async.queue(function(task,callback){
      var thissong = task.thissong;
      currentsong=['','','','',0];

      for (k=0;k<thissong.length-1;k++){

        if (thissong[k]==" Name"){currentsong[0]=thissong[k+1].split("  ")[1].replace(/ft\./g,"").replace(/feat\./g,"").replace(/\(/g,"").replace(/\)/g,"").replace(/Feat\./g,"").replace(/Ft\./g,"");}
        if (thissong[k]==" Artist"){currentsong[1]=thissong[k+1].split("  ")[1];}
        if (thissong[k]==" Album Artist"){currentsong[2]=thissong[k+1].split("  ")[1];}
        if (thissong[k]==" Album"){currentsong[3]=thissong[k+1].split("  ")[1];}
        if (thissong[k]==" Play Count"){currentsong[4]=thissong[k+1].split("  ")[1];}
        //if (thissong[k].split("  ")[1]=="Podcast"){setTimeout(callback(),1000);}
      }

      spotifyApi.searchTracks(currentsong[0]+" - "+currentsong[1])
        .then(function(data) {
          // console.log(data.body.tracks.items[0].name);
          if (data.body.tracks.items[0]!=undefined){
           var spotifysong=data.body.tracks.items[0];
               //console.log(spotifysong);
               var name = spotifysong.name;
               var artist = spotifysong.artists[0].name;
               var album = spotifysong.album.name;
               var artlg=spotifysong.album.images[0].url;
               var artmd=spotifysong.album.images[1].url;
               var artsm=spotifysong.album.images[2].url;
               var trackid=spotifysong.id;
               var albumid=spotifysong.album.id;
               var albumartist=currentsong[2];
               var playcount = currentsong[4];
               console.log("Found Spotify data for: ".cyan+name+" - "+artist);
               songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid)); 
               //albumarray.push(new Album(artmd,album,albumartist));
               setTimeout(callback(),1000);
          } else {
                lastfmsong=currentsong.slice(0);
                console.log("Not found on Spotify: ".cyan +lastfmsong[0]+" - "+lastfmsong[1]);
                lfm.track.getInfo({
                    'track' : lastfmsong[0],
                    'artist' : lastfmsong[1]
                }, function (err, track) {
                  if (track!=undefined && track.album!=undefined){
                    var name = track.name;
                    var artist = track.artist["name"];
                    var album = track.album["title"];
                    var artlg=track.album["image"][1]["#text"];
                    var artmd=track.album["image"][2]["#text"];
                    var artsm=track.album["image"][3]["#text"];
                    var albumartist=track.album["artist"];
                    var trackid='-';
                    var albumid='-';
                    var playcount = lastfmsong[4];
                    //console.log(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid);
                    console.log("Found Last.fm data for: ".cyan + name + " - " + artist);
                    songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid));
                    setTimeout(callback(),1000);
                  } else if (track==undefined || track.album==undefined || err){
                    console.log("No data found for: ".yellow + lastfmsong[0] + " - " + lastfmsong[1]);
                    setTimeout(callback(),1000);
                  }
                  if (err) {
                    console.log("Error: ".red,err);
                  }

                });
              }
        }, function(err) {
            errorCounter++;
            console.log(err);
            console.log(errorCounter);
            callback();
        });
      },10);

        //Add all of the items to the queue
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
                      parsedCounter++;
                      //Every 5 or so, update the DB (or if it's the last one)
                      if(spotifyQueue.length()==0 || parsedCounter%5 == 0){
                        var update_trackcount = "UPDATE users SET track_count='"+parsedCounter+"' WHERE user='"+req.body.username+"'";
                        sqlStarter.connection.query(update_trackcount,function(err,rows){
                          if(err){
                            console.log(err);
                          }
                          console.log("Updated the parsedCounter on the SQL Database".green);
                        });
                      }


                      if (spotifyQueue.length()==0 && started==0){
                        spotifyQueue.drain();
                      }

                      console.log("Queue items left: ".magenta + spotifyQueue.length());
                    });
        }
                //spotifyQueue.resume();

        spotifyQueue.drain = function(){
          //Once the queue is empty
          console.log("All items processed.".magenta);
          //res.render('customCoverArt',{css: ['./css/userPage.css'],js: ['./js/userPage.js'], albums: albumarray});
          
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
            //console.log(query);

            sqlStarter.connection.query(query,function(err,rows,fields){
              if (!err){
                databaseAddedCounter++;
                console.log("Added to db.");
                console.log("i ="+i+" databaseAddedCounter = "+ databaseAddedCounter+" spotifyCounter = "+spotifyCounter);
                        //console.log(spotifyQueue.length());
                        if (databaseAddedCounter==spotifyCounter){
                          //Update complete to 1
                          var update_complete = "UPDATE users SET complete=1 WHERE user='"+req.body.username+"'";
                          sqlStarter.connection.query(update_complete,function(err,rows,fields){
                            console.log("Everything added to DB".green.bold);
                            console.log("Number of songs where the API timed out = "+errorCounter);
                          });
                        }
              } else {
                console.log(err);
              }
            });
          }
        }   
  
    spotifyQueue.pause();
    //Now let's render the waiting room. First update the database to include the final size of the library
    var add_user = "INSERT INTO users (user,complete,track_count,total_tracks) VALUES ('"+req.body.username+"','0','0','"+spotifyQueue.length()+"')";
    console.log("Adding the user. "+add_user);
    sqlStarter.connection.query(add_user,function(err,rows,fields){
      if(!err){
        console.log("User added");
        spotifyQueue.resume();
        res.render('waitingRoom',{css: ['../css/loader.css','//fonts.googleapis.com/css?family=Roboto:100'],js:['https://code.jquery.com/jquery-2.1.3.min.js','../js/pinger.js'],user:req.body.username});
      } else {
        console.log(err);
        res.send("Database error");
      }
    });
  });
};

//Router functions for the userPage
exports.userPage = function(req, res){
  var userLoadedQuery = "SELECT * FROM users WHERE user='"+req.params.user+"'";
  sqlStarter.connection.query(userLoadedQuery,function(err,rows,fields){
    console.log(rows);
    if (!err && rows.length > 0){
      if (rows[0].complete != 1){
        //User isnt done loading so we pull up the load screen
        res.render('waitingRoom',{css: ['../css/loader.css','//fonts.googleapis.com/css?family=Roboto:100'],js:['https://code.jquery.com/jquery-2.1.3.min.js','../js/pinger.js'],user:req.params.user});
      }else{
        //The user exists and is done loading so he go ahead and render there page
        var query = "SELECT * FROM user_libraries WHERE user='"+req.params.user+"'";
        var albums;
        sqlStarter.connection.query(query,function(err,rows,fields){
          if (!err){
            albums = organize(rows);
            //Giving the lib view its initial sort
            sortedSongs = rows;
            quickSort(sortedSongs,'title');
            user = req.params.user + " | ";
            user = user.substr(0, 1).toUpperCase() + user.substr(1);
            res.render('userPage',{css: ['../css/userPage.css','//fonts.googleapis.com/css?family=Roboto:100'],js: ['../js/userPage.js'], user: user , albums: albums, sortedSongs: sortedSongs});
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
//A function that finds all matching music in a users library and returns it
exports.musicSearch = function(req, res){
  //Getting parameters
  var user = req.params.user;
  var key = req.params.key;//Search key
  //This is to handle the special case of there being an empty search key
  if (key === undefined){
    key = "";
  }
  var sortby = req.params.sortby;
  //Starting off by querying for the users music
  var query = "SELECT * FROM user_libraries WHERE user='"+user+"'";
  sqlStarter.connection.query(query,function(err,rows,fields){
    if (!err){
      var matches = [];
      for (var i = 0; i < rows.length; i++){
        //TODO MAYBE?  Do substring search instead of indexOf
        if (rows[i].title.toLowerCase().indexOf(key.toLowerCase()) > -1 || rows[i].album.toLowerCase().indexOf(key.toLowerCase()) > -1 || rows[i].artist.toLowerCase().indexOf(key.toLowerCase()) > -1){
          matches[matches.length] = rows[i];
        }
      }
      //Sending back an array of all songs and an array of all albums for their corresponding views
      quickSort(matches,sortby);
      res.send([matches, organize(matches)]);
    }else{
      console.log(err);
    }
  });
};
//An implementation of 3-way partitioned quicksort for strings
var quickSort = function(a,sortBy){
  var CUTOFF = 15;

  var shuffle = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      exch(array,currentIndex,randomIndex);
    }

    return array;
  };
  var charAt = function(s,d){
    if (d == getVal(s,sortBy).length){
      return -1;
    }else{
      return getVal(s,sortBy)[d];
    }
  };
  var sortStr = function(a,lo,hi,d){
    //cutoff to insertionsort for small subarrays
    if (hi <= lo + CUTOFF) {
      insertion(a, lo, hi, d);
      return;
    }

    var lt = lo;
    var gt = hi;
    var v = charAt(a[lo], d);
    var i = lo + 1;
    while (i <= gt) {
      var t = charAt(a[i], d);
      if (t < v){
        exch(a, lt++, i++);
      } else if (t > v) {
        exch(a, i, gt--);
      } else{
        i++;
      }
    }

    // a[lo..lt-1] < v = a[lt..gt] < a[gt+1..hi]. 
    sortStr(a, lo, lt-1, d);
    if (v >= 0) {
      sortStr(a, lt, gt, d+1);
    }
    sortStr(a, gt+1, hi, d);
  };
  var sortInt = function(a,lo,hi){
    if (hi <= lo + CUTOFF){
        insertionInt(a,lo,hi);
        return;
    }
    var j = partition(a,lo,hi);
    sortInt(a,lo,j-1);
    sortInt(a,j+1,hi);
  };
  var partition = function(a,lo,hi){
    var i = lo;
    var j = hi + 1;
    var v = getVal(a[lo],sortBy);
    while (true){

        while(getVal(a[++i],sortBy) > v){
            if (i == hi){
                break;
            }
        }

        while(v > getVal(a[--j],sortBy)){
            if (j == lo){
                break;
            }
        }

        if (i >= j){
            break;
        }
        exch (a,i,j);
    }
    exch(a,lo,j);

    return j;
  };
  var insertion = function(a,lo,hi,d){
    for (var i = lo; i <= hi; i++){
      for (var j = i; j > lo && less(a[j], a[j-1], d); j--){
          exch(a, j, j-1);
        }
      }
  };
  var insertionInt = function(a,lo,hi){
    for (var i = lo; i <= hi; i++){
      for (var j = i; j > lo && a[j] > a[j-1]; j--){
          exch(a, j, j-1);
        }
      }
  };
    var exch = function(a,i,j){
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    };

    var less = function(v,w,d){
      for (var i = d; i < Math.min(v.title.length, w.title.length); i++) {
        if (getVal(v,sortBy)[i] < getVal(w,sortBy)[i]) {
          return true;
        }
        if (getVal(v,sortBy)[i] > getVal(w,sortBy)[i]) {
          return false;
        }
      }
      return getVal(v,sortBy).length < getVal(w,sortBy).length;
    };
    var getVal = function(obj, sortBy){
      switch(sortBy){
        case 'title':
          return obj.title.toLowerCase();
          break;
        case 'album':
          return obj.album.toLowerCase();
          break;
        case 'artist':
          return obj.artist.toLowerCase();
          break;
        case 'playcount':
          return obj.playcount;
          break;
      }
    };
    a = shuffle(a);
    if (sortBy == "playcount"){
      sortInt(a, 0, a.length - 1);
    }else{
      sortStr(a, 0, a.length - 1, 0);
    }
  };
  exports.pingUser = function(req,res){
   var query = "SELECT * FROM users WHERE user='"+req.body.user+"'";
   sqlStarter.connection.query(query,function(err,rows,fields){
    if(!err){
     if(rows.length==0){
				//No user by that name exists.
				res.send("User Not Found");
			} else {
        var sentVar = {};
        sentVar.user = rows[0].user;
        sentVar.complete = rows[0].complete;
        sentVar.progress = rows[0].track_count;
        sentVar.outof = rows[0].total_tracks;
        res.send(sentVar);
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

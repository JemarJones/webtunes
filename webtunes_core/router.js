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
//Check used by page to preemptively check that the username isnt taken
exports.checkuser = function(req,res){
  //We just make a query for the user and check if one with that name exists
  var userLoadedQuery = "SELECT * FROM users WHERE user='"+req.params.user+"'";
  sqlStarter.connection.query(userLoadedQuery,function(err,rows,fields){
    if (!err){
      var taken;
      if (rows.length !== 0){
        taken = true;
      }else{
        taken = false;
      }
      res.send(taken);
    }else{
      console.log(err);
    }
  });
};
exports.uploadXML = function(req,res){
	console.log(req.files.xml_file.path);
	console.log(req.body.username);
  //This check is just to make sure that a taken username isnt submitted, 
  //even though the client side should take care of it (Because really all they have to do is change the "disabled" attr on the button anyway..)
  var userLoadedQuery = "SELECT * FROM users WHERE user='"+req.params.username+"'";
  var taken;
  sqlStarter.connection.query(userLoadedQuery,function(err,rows,fields){
    if (!err){
      if (rows.length !== 0){
        taken = true;
      }else{
        taken = false;
      }
    }else{
      console.log(err);
    }
  });
  if (taken){
    return;//Because i have no earthly idea how to wrap that mess down there..
  }
  //Please clean this up and then do that ^ if statement correctly..
  var tagarray=new Array();
	var songarray=new Array();
	var albumarray=new Array();
	var playcounter;
  var parsedCounter = 0;
  var albtest;
  var spotifyCounter=0;
  var databaseAddedCounter=0;
  var errorCounter=0;
  var spotifyApi = new SpotifyWebApi({
    clientId : '228486b3feaf411586151d99d358c135',
    clientSecret : '4c9d49e596ac40809c1a4ac90c5fa0d3'
  });
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
          if (thissong[k].split("  ")[1]=="Podcast"){callback();}
        }
      //console.log(currentsong);
        spotifyApi.searchTracks(currentsong[0]+" - "+currentsong[1])
        .then(function(data) {
          //console.log("spotify search done");
          //console.log(data.body.tracks.items[0]);
          //console.log(data.body.tracks.items[0].album.images);
          if (data.body.tracks.items[0]!=undefined){
            var spotifysong=data.body.tracks.items[0];
            //console.log("spotify search done and info found");
            //console.log(spotifysong);
            //console.log(spotifysong.album.images);
            if (spotifysong.album.images.length>=3 && spotifysong.album.images!=undefined){
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
              var tagarray=[];
              //console.log("got all info from spotify");
              lfm.track.getInfo({
                   'track' : currentsong[0],
                   'artist' : currentsong[1]
              }, function (err, track) {
                  if (track!=undefined && track.toptags.tag!=undefined){
                    //console.log("tryna get da tags");
                    for (t=0;t<track.toptags.tag.length-1;t++){
                      //console.log("tag found after spotify search");
                      tagarray.push(track.toptags.tag[t].name)
                    }
                    if (tagarray.length>5){
                      console.log("Truncated tag array");
                      tagarray=tagarray.slice(0,4);
                    }
                    console.log("Found Spotify data and tags for: ".cyan+name+" - "+artist);
                    songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tagarray.toString()));
                    callback(); 
                  } else {
                    console.log("Found Spotify data and no tags for: ".cyan+name+" - "+artist);
                    songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,"")); 
                    callback();
                  }
              });

              //console.log("Found Spotify data for: ".cyan+name+" - "+artist);
              //songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tagarray.toString())); 
              //albumarray.push(new Album(artmd,album,albumartist)); 
            } else {
              console.log("No Album Art");
              callback();
            }
          } else {
            lastfmsong=currentsong.slice(0);
            console.log("Not found on Spotify: ".cyan +lastfmsong[0]+" - "+lastfmsong[1]);
            lfm.track.getInfo({
              'track' : lastfmsong[0],
              'artist' : lastfmsong[1]
            }, function (err, track) {
              //console.log("last fm searchd");
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
                var tagarray=[];
                if (track.toptags.tag!=undefined){
                  console.log("tags found after lastfm search");
                  for (t=0;t<track.toptags.tag.length-1;t++){
                    console.log(track.toptags.tag[t].name);
                    tagarray.push(track.toptags.tag[t].name);
                  }
                }
                //console.log("Tag array length is ="+tagarray.length)
                if (tagarray.length>5){
                  console.log("Truncated tag array");
                  tagarray=tagarray.slice(0,4);
                }
                //console.log(tagarray.toString());
                //console.log(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid);
                console.log("Found Last.fm data for: ".cyan + name + " - " + artist);
                songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tagarray.toString()));
                callback();
              } else if (track==undefined || track.album==undefined || err){
                console.log("No data found for: ".yellow + lastfmsong[0] + " - " + lastfmsong[1]);
                callback();
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
  },5);

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
      var query = "INSERT INTO user_libraries (user,title,artist,album,playcount,art_lg,art_md,art_sm,track_id,album_id,tags) VALUES ('"+req.body.username+"','"
        +sqlStarter.escape(song.name)+"','"
        +sqlStarter.escape(song.artist)+"','"
        +sqlStarter.escape(song.album)+"',"
        +song.playcount+",'"
        +sqlStarter.escape(song.artlg)+"','"
        +sqlStarter.escape(song.artmd)+"','"
        +sqlStarter.escape(song.artsm)+"','"
        +sqlStarter.escape(song.trackid)+"','"
        +sqlStarter.escape(song.albumid)+"','"
        +sqlStarter.escape(song.tags)+"')";
        //console.log(song.tags);

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
            user = rows[0].user + " | ";
            // user = user.substr(0, 1).toUpperCase() + user.substr(1);
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
      sortedSongs = rows;
      quickSort(sortedSongs,'title');
      res.send([albums, sortedSongs]);
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
        //Here we check if all words in the key match song data from this song
        var matched = true;
        var keyParts = key.split(" ");
        for (var k = 0; k < keyParts.length; k++){
          if (!(keyWithin(rows[i].title.toLowerCase(),keyParts[k].toLowerCase()) || keyWithin(rows[i].album.toLowerCase(),keyParts[k].toLowerCase()) || keyWithin(rows[i].artist.toLowerCase(),keyParts[k].toLowerCase()))){
            matched = false;
          }
        }
        if (matched){
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
//A function that uses boyer-moore to check for a key in a chunk of text, returns true if found and false if not
var keyWithin = function(text,keyPat){
  //Implementation of Boyer-moore substring search
    var R = 256;//Radix value
    //Array for mapping the bad and good characters, helps with skipping
    var charSkip = [];
    for (var c = 0; c < R; c++){
      charSkip[c] = -1;
    }
    for (var j = 0; j < keyPat.length; j++){
      charSkip[keyPat.charCodeAt(j)] = j;
    }
    //Performing boyer-moore search, boolean return value will indicate if the key was found
    var M = keyPat.length;
    var N = text.length;
    var skip;
    for (var i = 0; i <= N - M; i += skip){
      skip = 0;
      for (var j = M-1; j >= 0; j--){
            //If theres a mismatch we calculate the skip and break out
            if (keyPat[j] != text[i+j]){
              skip = Math.max(1, j-charSkip[text.charCodeAt(i+j)]);
              break;
            }
          }
        //Returning true if the pattern has been found
        if (skip === 0) return true;
      }
    //Pattern wasnt found so we indicate so with a value of false
    return false;
  };
//Collection of some quicksort varaitions for sorting songs
var quickSort = function(a,sortBy){
  var CUTOFF = 15;//The amount at which we will switch to insertion sort due to overhead

  //An implementation of 3-way quicksort for strings
  var sortStr = function(a,lo,hi,d){
    //cutoff to insertionsort for small subarrays
    if (hi <= lo + CUTOFF) {
      insertionStr(a, lo, hi, d);
      return;
    }

    //Some setup for this step
    var lt = lo;
    var gt = hi;
    var v = getVal(a[lo],sortBy)[d];
    var i = lo + 1;
    //Partitioning this section
    while (i <= gt) {
      var t = getVal(a[i],sortBy)[d];
      if (t < v){
        exch(a, lt++, i++);
      } else if (t > v) {
        exch(a, i, gt--);
      } else{
        i++;
      }
    }
    //Recursevly continuing the quicksort on each partition as necesary
    sortStr(a, lo, lt-1, d);
    if (v !== undefined) {
      sortStr(a, lt, gt, d+1);
    }
    sortStr(a, gt+1, hi, d);
  };
  //Simple string insertion sort for the cutoff
  var insertionStr = function(a,lo,hi,d){
    for (var i = lo; i <= hi; i++){
      for (var j = i; j > lo && less(a[j], a[j-1], d); j--){
        exch(a, j, j-1);
      }
    }
  };
  //Quick comparision function
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
  //An implementation of quicksort for ints
  var sortInt = function(a,lo,hi){
    if (hi <= lo + CUTOFF){
      insertionInt(a,lo,hi);
      return;
    }
    //Partitioning this section
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
    //Recursevly continuing the quicksort on each partition as necesary
    sortInt(a,lo,j-1);
    sortInt(a,j+1,hi);
  };
  //Simple int insertion sort for the cutoff
  var insertionInt = function(a,lo,hi){
    for (var i = lo; i <= hi; i++){
      for (var j = i; j > lo && a[j].playcount > a[j-1].playcount; j--){
        exch(a, j, j-1);
      }
    }
  };
  //A implementation of the knuth shuffle algorithm
  var shuffle = function(array) {
    for (var i = 0; i < array.length; i++){
      //Choosng random index
      var r = Math.floor(Math.random() * i);
      //Exchanging with random index
      exch(array,i,r);
    }
  };
  //Straightforward exchange function
  var exch = function(a,i,j){
    var temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  };
  //This function gets the approprieve value to be used for sorting according to what is requested to sort by
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
  shuffle(a);//Shuffle to mitigate the worst case input
  //Calling the sort appropriate for the type of our sortBy 
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
  // var lo = 0;
  // var hi = albums.length - 1;
  // var mid;
  // while(hi >= lo){
  //   mid = lo + (hi - lo)/2;
  //   if (albums[mid][0].album == newTrack.album){
  //     return mid;
  //   }else if (albums[mid][0].album < newTrack.album) {
  //     lo = mid + 1;
  //   }else{
  //     hi = mid - 1;
  //   }
  // }
  // return mid;
	//Todo: implement with binaryinsertionsort
	for (var i = 0; i < albums.length; i++){
		if (albums[i][0].album == newTrack.album){
			return i;
		}
	}
	return albums.length;
};

//song name, album , artist , play count, album art url, track id, album id
function Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tags){
  this.name=name;
  this.artist=artist;
  this.album=album;
  this.playcount=playcount;
  this.artlg=artlg;
  this.artmd=artmd;
  this.artsm=artsm;
  this.trackid=trackid;
  this.albumid=albumid;
  this.tags=tags;
}

function Album(artmd,album,artist){
  this.img=artmd;
  this.title=album;
  this.artist=artist;
}

exports.getCloudData = function(req,res){
  var user = req.body.user;
  //Query DB for data for the cloud. Let's try artists first
  var query = "SELECT * FROM user_libraries WHERE user='"+user+"'";
  sqlStarter.connection.query(query,function(err,rows,fields){
    if(err){
      console.log("Error: ".red,err);
    } else {
      //Run through the data and return the words
      var artist_data = {};
      for(var i=0;i<rows.length;i++){
        if(artist_data[rows[i].artist]!= null){
          artist_data[rows[i].artist].size += rows[i].playcount;
        } else {
          artist_data[rows[i].artist] = {
            size: rows[i].playcount,
            text: rows[i].artist
          };
        }
      }
      //Now that we've got this list, flatten it
      var return_data = [];
      for(var artist in artist_data){
        return_data.push(artist_data[artist]);
      }

      res.send(return_data);
    }
  });
}

exports.getBubbleData = function(req,res){
  var user = req.body.user;
  //Query DB for data for the cloud. Let's try artists first
  var query = "SELECT * FROM user_libraries WHERE user='"+user+"'";
  sqlStarter.connection.query(query,function(err,rows,fields){
    if(err){
      console.log("Error: ".red,err);
    } else {
      //Count the artists
      var counted_artists = {};

      for(var i=0;i<rows.length;i++){
        if(counted_artists[rows[i].artist]!= null){
          counted_artists[rows[i].artist].size += rows[i].playcount;
        } else {
          counted_artists[rows[i].artist] = {
            size: rows[i].playcount,
            name: rows[i].artist
          };
        }
      }

      var to_sort = [];
      //Now we've got an object filled with artists. Turn it into an array and sort it
      for(var artist in counted_artists){
        to_sort.push(counted_artists[artist]);
      }

      to_sort.sort(compare);
      to_sort = to_sort.slice(0,50);
      shuffle(to_sort);

      //We now have a list of length 25, sorted in order
      //Put it all in return_data
      var return_data = {
        "name": "flare",
        "children": []
      };

      for(var i=0;i<to_sort.length;i++){
        return_data.children.push(to_sort[i]);
      }

      res.send(return_data);
    }
  });
}


exports.getTagData = function(req,res){
  var user = req.body.user;
  //Query DB for data for the cloud. Let's try artists first
  var query = "SELECT * FROM user_libraries WHERE user='"+user+"'";
  sqlStarter.connection.query(query,function(err,rows,fields){
    if(err){
      console.log("Error: ".red,err);
    } else {
      //Count the artists
      var counted_artists = {};

      for(var i=0;i<rows.length;i++){
        var tags = rows[i].tags.split(",");
        console.log(tags);
        for(var j=0;j<tags.length;j++){
          if(tags[j] == '') continue;

          if(tags[j] == "hiphop" || tags[j] == "hip hop"){
            tags[j] = "hip-hop";
          }


          if(counted_artists[tags[j]] != null){
            counted_artists[tags[j]].size++;
          } else {
            counted_artists[tags[j]] = {
              size : 1,
              name : tags[j]
            }
          }
        }
      }

      var to_sort = [];
      //Now we've got an object filled with artists. Turn it into an array and sort it
      for(var artist in counted_artists){
        to_sort.push(counted_artists[artist]);
      }

      to_sort.sort(compare);
      to_sort = to_sort.slice(0,100);
      shuffle(to_sort);

      //We now have a list of length 25, sorted in order
      //Put it all in return_data
      var return_data = {
        "name": "flare",
        "children": []
      };

      for(var i=0;i<to_sort.length;i++){
        return_data.children.push(to_sort[i]);
      }

      res.send(return_data);
    }
  });
}

exports.getTrackData = function(req,res){
  var user = req.body.user;
  //Query DB for data for the cloud. Let's try artists first
  var query = "SELECT * FROM user_libraries WHERE user='"+user+"'";
  sqlStarter.connection.query(query,function(err,rows,fields){
    if(err){
      console.log("Error: ".red,err);
    } else {
      var return_data = {
        songs: [],
        plays: [],
        colors: ['#0000b4','#0082ca','#0094ff','#0d4bcf','#0066AE','#074285','#00187B','#285964','#405F83','#416545','#4D7069','#6E9985','#7EBC89','#0283AF','#79BCBF','#99C19E'],
      };

      var object_arr = [];
      for(var i=0;i<rows.length;i++){
        object_arr.push({
          name: rows[i].title,
          size: rows[i].playcount
        });
      }

      //Sort
      object_arr.sort(compare);
      object_arr = object_arr.slice(0,return_data.colors.length);
      for(var i=0;i<object_arr.length;i++){
        return_data.songs.push(object_arr[i].name);
        return_data.plays.push(object_arr[i].size);
      }

      res.send(return_data);
    }
  });
}
function compare(a,b) {
  if (a.size < b.size)
     return 1;
  if (a.size > b.size)
    return -1;
  return 0;
}
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

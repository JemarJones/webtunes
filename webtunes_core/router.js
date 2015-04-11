var fs = require('fs');
var xmldoc = require('xmldoc');
var async = require('async');
var SpotifyWebApi = require('spotify-web-api-node');
var sqlStarter = require('./sqlStarter');
var algorithms = require('./algorithms');
var LastfmAPI = require('lastfmapi');
var xmlparser = require('./xmlparser.js');
var lfm = new LastfmAPI({
  'api_key' : 'e0d66a3b8ea5fa90bb9ab39aa51762fd',
  'secret' : 'is 8ab78265bdc75215631380724adefbcf'
});
var colors = require('colors');
var spotifyApi = new SpotifyWebApi({
    clientId : '228486b3feaf411586151d99d358c135',
    clientSecret : '4c9d49e596ac40809c1a4ac90c5fa0d3'
  });

exports.homePage = function(req,res){
	res.render('homePage',{css: ['../css/homePage.css','//fonts.googleapis.com/css?family=Roboto:100'],js: ['https://code.jquery.com/jquery-2.1.3.min.js','../js/homePage.js']});
};

exports.instructionsPage = function(req,res){
  res.render('instructionsPage',{css: ['../css/instructionsPage.css','//fonts.googleapis.com/css?family=Roboto:100'],js: ['https://code.jquery.com/jquery-2.1.3.min.js']});
};

function parseXML(input_user,data,callback){
  //callback : function(input_user,xml_data)
  var xml_document = new xmldoc.XmlDocument(data);
  var extracteddata = xml_document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict");

  //Keep track of how many items we've processed
  var parsedCounter = 0;

  //Parsed data: Array of objects
  var parsed_songs = [];

  //Now that we have the data, we can start to parse it.
  //Let's use a queue,because we're software engineers and that's how we do
  //Implemented using async.js : 10 worker asynchronous queue
  var spotifyQueue = async.queue(parseSong);

  //Add all of the items in our XML to the queue
  for(var i=0;i<extracteddata.length;i++){

    //Parse the XML into an array of data
    var parseString=extracteddata[i].toString().replace(/\s<key>/g,"").replace(/<\/key>/g,"").replace(/<integer>/g,"").replace(/<\/integer>/g,"").replace(/<string>/g,"").replace(/<\/string>/g,"");
    var parseArray=parseString.split("\n")
    parseArray=parseArray.splice(1,parseArray.length-2)

    //Pass the array of data to the queue
    spotifyQueue.push({
      thissong : parseArray
    },function (song) {
      //Run this code after each item in the queue is processed
      if(!song){
        //We didn't find a song, just skip it.
        console.log("No song found. Skipping");
      } else {
        //Add the song to our parsed data
        parsed_songs.push(song);

        //Increment the number of processed items
        parsedCounter++;
        //Every 5 items, update the DB (or if it's the last one)
        if(spotifyQueue.length()==0 || parsedCounter%5 == 0){
          var update_trackcount = "UPDATE users SET track_count='"+parsedCounter+"' WHERE user='"+input_user+"'";
          sqlStarter.connection.query(update_trackcount,function(err,rows){
            if(err){
              console.log(err);
            }
            console.log("Updated the parsedCounter on the SQL Database".green);
          });
        }

        //Print how many we have left
      }
      console.log("Queue items left: ".magenta + spotifyQueue.length());

    });
  }

  //Once the queue is finished
  spotifyQueue.drain = function(){
    //This is the callback for parseXML being called. It will return us to uploadXML
    console.log("Calling the drain function");
    callback(input_user,parsed_songs);
  };
}

function parseSong(task,callback){

        var thissong = task.thissong;
        currentsong=['','','','',0];

        for (k=0;k<thissong.length-1;k++){

          if (thissong[k]==" Name"){currentsong[0]=thissong[k+1].split("  ")[1].replace(/ft\./g,"").replace(/feat\./g,"").replace(/\(/g,"").replace(/\)/g,"").replace(/Feat\./g,"").replace(/Ft\./g,"");}
          if (thissong[k]==" Artist"){currentsong[1]=thissong[k+1].split("  ")[1];}
          if (thissong[k]==" Album Artist"){currentsong[2]=thissong[k+1].split("  ")[1];}
          if (thissong[k]==" Album"){currentsong[3]=thissong[k+1].split("  ")[1];}
          if (thissong[k]==" Play Count"){currentsong[4]=thissong[k+1].split("  ")[1];}
          if (thissong[k].split("  ")[1]=="Podcast"){callback(); return;}
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

              //Last.fm api seems to be calling back twice, so let's do a check
              var hasCalledBack = false;
              
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
                    if(!hasCalledBack){
                      hasCalledBack = true;
                      callback(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tagarray.toString()));
                    }
                  } else {
                    console.log("Found Spotify data and no tags for: ".cyan+name+" - "+artist);
                    if(!hasCalledBack){
                      hasCalledBack = true;
                      callback(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,""));
                    }
                  }
              });

              //console.log("Found Spotify data for: ".cyan+name+" - "+artist);
              //songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tagarray.toString())); 
              //albumarray.push(new Album(artmd,album,albumartist)); 
            } else {
              console.log("No Album Art");
              callback(false);
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
                callback(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid,tagarray.toString()));
              } else if (track==undefined || track.album==undefined || err){
                console.log("No data found for: ".yellow + lastfmsong[0] + " - " + lastfmsong[1]);
                callback(false);
              }
              if (err) {
                console.log("Error: ".red,err);
              }
            });
          }
        }, function(err) {
          if(err){
            console.log(err);
            callback(false);
          }
        });
}

function addSongsToDB(input_user,parsed_songs,callback){
  //Loop through all of the songs asynchronously
  algorithms.asyncLoop(parsed_songs.length,function(loop){
    var i=loop.iteration();
    //Each loop, run this

    var song = parsed_songs[i];

    var query = "INSERT INTO user_libraries (user,title,artist,album,playcount,art_lg,art_md,art_sm,track_id,album_id,tags) VALUES ('"+input_user+"','"
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

    sqlStarter.connection.query(query,function(err,rows,fields){
      if (!err){
        console.log("Added song: " + i + " of "+parsed_songs.length);
      } else {
        console.log(err);
      }
      loop.next();
    });
  },function(){
    //Once the asyncloop is done (all songs have been added)
    callback();
  });
}

exports.uploadXML = function(req,res){
  var input_user = req.body.username;
  var input_xml = req.files.xml_file.path;

  isUserTaken(input_user,function(usernameTaken){
    if(usernameTaken){
      res.send(false);
    } else {
      //Username isn't taken
      fs.readFile(req.files.xml_file.path,function(err,data){
        if(err){
          console.log("Error reading XML.".red,err);
          res.send("Critical Error: Failed to load file");
        } else {
          //Successfully read XML file
          console.log("XML Read Successfully.".green);

          //Add the user to the database to show that we're currently parsing their data
          console.log("Adding the user:  "+req.body.username);


          var xml_document = new xmldoc.XmlDocument(data);
          var extracteddata = xml_document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict");

          var add_user = "INSERT INTO users (user,complete,track_count,total_tracks) VALUES ('"+req.body.username+"','0','0','"+extracteddata.length+"')";
          sqlStarter.connection.query(add_user,function(err,rows,fields){
            if(!err){
              console.log("User added");

              //Render the waiting room for the user
              res.render('waitingRoom',{css: ['../css/loader.css','//fonts.googleapis.com/css?family=Roboto:100'],js:['https://code.jquery.com/jquery-2.1.3.min.js','../js/pinger.js'],user:req.body.username});
              parseXML(input_user,data,function(input_user,xml_data){
                //We're done parsing the XML, add it all to the db
                console.log("Calling addSongsToDB...");
                addSongsToDB(input_user,xml_data,function(){
                  //We done!
                  var update_complete = "UPDATE users SET complete=1 WHERE user='"+req.body.username+"'";
                  sqlStarter.connection.query(update_complete,function(err,rows,fields){
                    console.log("Everything added to DB".green.bold);
                    fs.unlink(req.files.xml_file.path,function(err){
                      if(err){
                        console.log(err);
                      } else {
                        console.log("Deleted XML at location: "+req.files.xml_file.path);
                        console.log("User upload Completed: ".green.bold + input_user);
                      }
                    })
                  });
                });
              });
            } else {
              console.log(err);
              res.send("Database error");
            }
          });

          
        }
      });
    }
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
            albums = algorithms.organize(rows);
            //Giving the lib view its initial sort
            sortedSongs = rows;
            algorithms.quickSort(sortedSongs,'title');
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
//A function that searches and sorts user songs as instructed
exports.musicSearchAndSort = function(req, res){
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
          if (!(algorithms.keyWithin(rows[i].title.toLowerCase(),keyParts[k].toLowerCase()) || algorithms.keyWithin(rows[i].album.toLowerCase(),keyParts[k].toLowerCase()) || algorithms.keyWithin(rows[i].artist.toLowerCase(),keyParts[k].toLowerCase()))){
            matched = false;
          }
        }
        //Adding this to the list of songs matching the request
        if (matched){
          matches[matches.length] = rows[i];
        }
      }
      algorithms.quickSort(matches,sortby);//Sorting the library according to the requested field
      //Sending back an array of all songs and an array of all albums for their corresponding views
      res.send([matches, algorithms.organize(matches)]);
    }else{
      console.log(err);
    }
  });
};

//Check used by page to preemptively check that the username isnt taken
exports.checkuser = function(req,res){
  isUserTaken(req.params.user,function(isTaken){
    res.send(isTaken);
  });
};
exports.pingUser = function(req,res){
 var query = "SELECT * FROM users WHERE user='"+req.body.user+"'";
 sqlStarter.connection.query(query,function(err,rows,fields){
  if(!err){
   if(rows.length===0){
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
};

function isUserTaken(user,callback){
  //This check is just to make sure that a taken username isnt submitted, 
  //even though the client side should take care of it (Because really all they have to do is change the "disabled" attr on the button anyway..)
  var userLoadedQuery = "SELECT * FROM users WHERE user='"+user+"'";
  sqlStarter.connection.query(userLoadedQuery,function(err,rows,fields){
    if (!err){
      if (rows.length !== 0){
        //A row has been returned, therefore the username is taken
        callback(true);
      }else{
        //Username isn't taken
        callback(false);
      }
    }else{
      //If there's an error, we will just pretend that it's taken
      console.log(err);
      callback(true);
    }
  });
}

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

/*Helper Functions*/



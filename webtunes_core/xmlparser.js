var fs = require('fs'),
xmldoc = require('xmldoc'),
async = require('async');
var SpotifyWebApi = require('spotify-web-api-node');
var sqlStarter = require('./sqlStarter');


exports.xml = function(req ,res){
	var songarray=new Array();
    var albumarray=new Array();
    var currentsong=['','','',0,'','',''];
    var playcounter;
    var albtest;
    var spotifyApi = new SpotifyWebApi();
    var extracteddata;



	fs.readFile(__dirname + '/kkk.xml', function(err, data) {
          var document = new xmldoc.XmlDocument(data);
          extracteddata = document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict");
          //extracteddata=result.plist.dict[0].dict[0].dict;
                /*
                    HEY GUYS WE'RE SOFTWARE ENGINEERS! LOOK AT US USE A QUEUE!
                */
                var spotifyQueue = async.queue(function(task,callback){
                    var thissong = task.thissong;
                    //var thisint = task.thisint;
                    //var keycheck = task.keycheck;

                    currentsong=['','','','',''];
                    var playcount=0;
                    //console.log(keycheck);
                    /*
                    for (k=0;k<keycheck.length;k++){
                        if (keycheck[k]=='Name') {currentsong[0]=thissong[(k-1)];}
                        if (keycheck[k]=='Artist') {currentsong[1]=thissong[(k-1)];}
                        if (keycheck[k]=='Album Artist') {currentsong[2]=thissong[(k-1)];}
                        if (keycheck[k]=='Album'){currentsong[3]=thissong[(k-1)]}
                        if (keycheck[k]=='Disc Number') {playcount++;}
                        if (keycheck[k]=='Disc Count') {playcount++;}
                        if (keycheck[k]=='Track Number') {playcount++;}
                        if (keycheck[k]=='Track Count') {playcount++;}
                        if (keycheck[k]=='Year') {playcount++;}
                        if (keycheck[k]=='BPM') {playcount++;}
                        if (keycheck[k]=='Bit Rate') {playcount++;}
                        if (keycheck[k]=='Sample Rate') {playcount++;}
                    }*/
                    //playcounter = thisint[++playcount];
                    for (k=0;k<thissong.length-1;k++){
                          console.log(parseArray);
                          if (parseArray[k]==" Name"){currentsong[0]=thissong[k+1].split("  ")[1].replace(/ft\./g,"").replace(/feat\./g,"").replace(/\(/g,"").replace(/\)/g,"");}
                          if (parseArray[k]==" Artist"){currentsong[1]=thissong[k+1].split("  ")[1];}
                          if (parseArray[k]==" Album Artist"){currentsong[2]=thissong[k+1].split("  ")[1];}
                          if (parseArray[k]==" Album"){currentsong[3]=thissong[k+1].split("  ")[1];}
                          if (parseArray[k]==" Play Count"){currentsong[4]=thissong[k+1].split("  ")[1];}
                          
                    }
                    console.log(currentsong);
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
                             //console.log(name,artist,album,playcounter,artlg,artmd,artsm,trackid,albumid);

                             songarray.push(new Song(name,artist,album,playcount,artlg,artmd,artsm,trackid,albumid)); 
                             albumarray.push(new Album(artmd,album,albumartist));
                             //callback();
                             //console.log(songarray); 
                             //show_image(albummd);
                             albtest=artmd;
                            }
                            callback();
                        }, function(err) {
                            console.log(err);
                            callback();
                            //console.log(songarray);
                        });
                 },10);
              
                for(i=0;i<extracteddata.length;i++){
                    //Put each item from the data into are queue to be processed by spotify
                    //var extracteddata = document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict")[i];
                    //console.log(extracteddata.toString());
                    var parseString=extracteddata[i].toString().replace(/\s<key>/g,"").replace(/<\/key>/g,"").replace(/<integer>/g,"").replace(/<\/integer>/g,"").replace(/<string>/g,"").replace(/<\/string>/g,"");
                    var parseArray=parseString.split("\n");
                    parseArray=parseArray.splice(1,parseArray.length-2);
                    spotifyQueue.push({
                        thissong : parseArray
                        //thissong : extracteddata[i].string,
                        //thisint : extracteddata[i].integer,
                        //keycheck : extracteddata[i].key
                    })
                }
                

                spotifyQueue.drain = function(){
                    //Once the queue is empty
                    console.log("All items processed.");
                    //res.render('customCoverArt',{css: ['./css/customPage.css'],js: ['./js/customPage.js'], albums: albumarray});
                    
                    //Let's just push this to the sql db for now.
                    for(var i=0;i<songarray.length;i++){
                        var song = songarray[i];
                        var query = "INSERT INTO user_libraries (user,title,artist,album,playcount,art_lg,art_md,art_sm,track_id,album_id) VALUES ('TestUser','"
                            +sqlStarter.escape(song.name)+"','"
                            +sqlStarter.escape(song.artist)+"','"
                            +sqlStarter.escape(song.album)+"',"
                            +song.playcount+",'"
                            +sqlStarter.escape(song.artlg)+"','"
                            +sqlStarter.escape(song.artmd)+"','"
                            +sqlStarter.escape(song.artsm)+"','"
                            +sqlStarter.escape(song.trackid)+"','"
                            +sqlStarter.escape(song.albumid)+"')";
                        console.log(query);
                        sqlStarter.connection.query(query,function(err,rows,fields){
                            if (!err){
                                console.log("Added to db.")
                            }else{
                                console.log(err);
                            }
                        });
                    }

                    res.send("Success");
                }                

  });
}

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



var fs = require('fs'),
xmldoc = require('xmldoc'),
async = require('async');
var SpotifyWebApi = require('spotify-web-api-node');

var songarray=new Array();
  var albumarray=new Array();
  var currentsong=['','','',0,'','',''];
  var playcounter;
  var albtest;
//var parser = new xml2js.Parser();
var spotifyApi = new SpotifyWebApi();

fs.readFile(__dirname + '/webtunes_core/mixed-playlist.xml', function(err, data) {
	//console.log(data);
	var document = new xmldoc.XmlDocument(data);
	var keyNode = document.childrenNamed("dict")[0].childrenNamed("dict")[0].childrenNamed("dict")[3]/*.childrenNamed("key")*/;
	//String regex = "\\s*\\bkey\\b\\s*";
	var parseString = keyNode.toString().replace(/\s<key>/g,"").replace(/<\/key>/g,"").replace(/<integer>/g,"").replace(/<\/integer>/g,"").replace(/<string>/g,"").replace(/<\/string>/g,"");
	var parseArray=parseString.split("\n")
	parseArray=parseArray.splice(1,parseArray.length-2)
	for (var i = 0; i < parseArray.length - 1; i++) {
		if (parseArray[i]==" Name")
		{
			console.log(parseArray[i+1].split("  ")[1]);
		}
	};
	//console.log(parseArray/*.split("\n")*/);
	//console.log(document.toString())
});



/*
fs.readFile(__dirname + '/mixed-playlist.xml', function(err, data) {
  	parser.parseString(data, function (err, result) {
      	extracteddata=result.plist.dict[0].dict[0].dict;

                  //HEY GUYS WE'RE SOFTWARE ENGINEERS! LOOK AT US USE A QUEUE!

              var spotifyQueue = async.queue(function(task,callback){
                  var thissong = task.thissong;
                  var thisint = task.thisint;
                  var keycheck = task.keycheck;
                  currentsong=['','','','','',''];
                  var playcount=2;
                  //console.log(keycheck);
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
                  }
                  playcounter = thisint[++playcount];
                  spotifyApi.searchTracks(currentsong[0]+" - "+currentsong[1])
                      .then(function(data) {
                      // console.log(data.body.tracks.items[0].name);
                           if (data.body.tracks.items[0]!=undefined){
                           var spotifysong=data.body.tracks.items[0];
                           //console.log(spotifysong);
                           var name = spotifysong.name;
                           console.log(name);
                           var artist = spotifysong.artists[0].name;
                           var album = spotifysong.album.name;
                           var artlg=spotifysong.album.images[0].url;
                           var artmd=spotifysong.album.images[1].url;
                           var artsm=spotifysong.album.images[2].url;
                           var trackid=spotifysong.id;
                           var albumid=spotifysong.album.id;
                           var albumartist=currentsong[2];
                           var playcount = 0;
                           //console.log(name+" - "+artist);
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
              for(var i=0;i<extracteddata.length;i++){
                  //Put each item from the data into are queue to be processed by spotify
                  spotifyQueue.push({
                      thissong : extracteddata[i].string,
                      thisint : extracteddata[i].integer,
                      keycheck : extracteddata[i].key
                  })
           	   }
    });
});
*/



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


function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }
 
            if (index < iterations) {
                index++;
                func(loop);
 
            } else {
                done = true;
                callback();
            }
        },
 
        iteration: function() {
            return index - 1;
        },
 
        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}
var fs = require('fs'),
xml2js = require('xml2js');
exports.xml = function(req ,res){
	
	var parser = new xml2js.Parser();
	fs.readFile(__dirname + '/TPL.xml', function(err, data) {
    	parser.parseString(data, function (err, result) {

        	extracteddata=result.plist.dict[0].dict[0].dict;
        	var songarray=[];


        	for (i = 0; i < extracteddata.length; i++) { 
        		var thissong = extracteddata[i].string;
        		var keyarray=['null','null','null'];
        		var currentsong=['','',''];
        		keycheck=extracteddata[i].key;
        		//for (k=0;k<keycheck.length;k++){
        		//	if (keycheck[k]=='Name') {keyarray[0]=(k-1);}
        		//	if (keycheck[k]=='Artist') {keyarray[1]=(k-1);}
        		//	if (keycheck[k]=='Album') {keyarray[2]=(k-1);}
        		//}

				for (k=0;k<keycheck.length;k++){
        			if (keycheck[k]=='Name') {currentsong[0]=thissong[(k-1)];}
        			if (keycheck[k]=='Artist') {currentsong[1]=thissong[(k-1)];}
        			if (keycheck[k]=='Album') {currentsong[2]=thissong[(k-1)];}
        		}


    			songarray.push(new Song(currentsong[0],currentsong[1],currentsong[2]));


			}
			//for (j = 0; j < songarray.length; j++) { 
        	//	console.log(songarray[j].name+','+songarray[j].artist+","+songarray[j].album);
        	//}

        	//console.log(keycheck);
        	res.send(songarray);

        	//res.send("Done");
   		});
	});
}

function Song(name,artist,album){
    this.name=name;
    this.artist=artist;
    this.album=album;
}
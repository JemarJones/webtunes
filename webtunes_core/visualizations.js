var sqlStarter = require('./sqlStarter.js');
var algorithms = require('./algorithms.js');

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
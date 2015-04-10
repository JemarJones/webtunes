//A function that uses boyer-moore to check for a key in a chunk of text, returns true if found and false if not
exports.keyWithin = function(text,keyPat){
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
exports.quickSort = function(a,sortBy){
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
  var kShuffle = function(array) {
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
      case 'album':
        return obj.album.toLowerCase();
      case 'artist':
        return obj.artist.toLowerCase();
      case 'playcount':
        return obj.playcount;
    }
  };
  kShuffle(a);//Shuffle to mitigate the worst case input
  //Calling the sort appropriate for the type of our sortBy 
  if (sortBy == "playcount"){
    sortInt(a, 0, a.length - 1);
  }else{
    sortStr(a, 0, a.length - 1, 0);
  }
};

//Organizes rows into albums
exports.organize = function(rows){
  var albums = [];
  //Processing all songs
  for (var i = 0; i < rows.length; i++){
    var position = posToPlace(albums,rows[i]);//Getting position where this song should be placed
    if (position == albums.length){
      //Initializng album position if it wasnt previously existant
      albums[position] = [];
    }
    //Insertign song into its album
    albums[position][albums[position].length] = rows[i];
  }
  //Returning fully organized albums
  return albums;
};
//Finds the position that the new track should be placed
var posToPlace = function(albums, newTrack){
  //Going through all albums already created and checking if the new track belongs in any of them
  for (var i = 0; i < albums.length; i++){
    if (albums[i][0].album == newTrack.album){
      return i;
    }
  }
  //If a matchign album wasnt found, we place this one in a new album at the end of the array
  return albums.length;
};

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
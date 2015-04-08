var fill;
function drawCloud(){
  fill = d3.scale.category20();
  
  $.post("../getCloudData",{
    user: $('meta[name="user"]').attr('content')
  }).done(function(data){
    $("#visualization").html("");
    var max = 0;
    for(var i=0;i<data.length;i++){
      if(data[i].size > max){
        max = data[i].size;
      }
    }

    data.sort(compare);
    data = data.slice(0,25);

    d3.layout.cloud().size([1000,1000])
    .words(data)
    .padding(5)
    .rotate(function() { return ~~(Math.random()*120 - 60); })
    .font("Impact")
    .fontSize(function(d) { return 230*(d.size/max) })
    .on("end", draw)
    .start();
  });
};

function draw(words){
    d3.select("#visualization").append("svg")
        .attr("width", 1000)
        .attr("height", 1000)
      .append("g")
        .attr("transform", "translate(500,500)")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}

function compare(a,b) {
  if (a.size < b.size)
     return 1;
  if (a.size > b.size)
    return -1;
  return 0;
}
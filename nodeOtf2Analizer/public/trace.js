(function(){

  var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

  var traceId = document.getElementById("TraceId").value;

  var locNumber = document.getElementById("LocNumber").value;

  //var lval = document.getElementById("lval");

  //var rval = document.getElementById("rval");

  //var blockWidth = 20; // TODO вместо этого использовать длительность события










  function ColorScale(opsArray){
    var _maxValue = opsArray.length + 1;

    var _opsIndexes = [];

    for (var i = 0; i < opsArray.length; i++) {
      _opsIndexes[opsArray[i]] = i + 1;
    }


    var _colorScale1 = d3.scale.linear()
      .domain([0, _maxValue / 4])
      .range(["#800080","#0000FF"])
      .interpolate(d3.cie.interpolateLch);

    // От blue до green
    var _colorScale2 = d3.scale.linear()
      .domain([_maxValue / 4, _maxValue / 2])
      .range(["#0000FF","#008000"])
      .interpolate(d3.cie.interpolateLch);

    // От green до yellow
    var _colorScale3 = d3.scale.linear()
      .domain([_maxValue / 2, 3 * _maxValue / 4])
      .range(["#008000","#FFFF00"])
      .interpolate(d3.cie.interpolateLch);

    // От yellow до red
    var _colorScale4 = d3.scale.linear()
      .domain([3 * _maxValue / 4, _maxValue])
      .range(["#FFFF00","#FF0000"])
      .interpolate(d3.cie.interpolateLch);




    this.GetColor = function(opName){
      var value = _opsIndexes[opName];

      if(value / _maxValue < 0.25){
        return _colorScale1(value);
      }
      if(value / _maxValue < 0.5){
        return _colorScale2(value);
      }
      if(value / _maxValue < 0.75){
        return _colorScale3(value);
      }
        return _colorScale4(value);
    }
  }






  var blockHeight = 20;

  var margin = {top: 20, right: 30, bottom: 200, left: 40},
    margin2 = {top: 20, right: 30, bottom: 100, left: 0},
    width = 960 - margin.left - margin.right,
    height = blockHeight * locNumber,// - margin.top - margin.bottom,
    height2 = blockHeight * locNumber + 100; - margin2.top - margin2.bottom;

  var y = d3.scale.ordinal()
    .rangeRoundBands([0, height], .1);

  var y2 = d3.scale.linear()
    .range([height2, height2 - blockHeight * 3 - 7]);

  var x = d3.scale.linear()
    .range([0, width]);

  var x2 = d3.scale.linear()
    .range([0, width]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var xAxis2 = d3.svg.axis().scale(x2).orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var chart = d3.select("#chart_placeholder")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = chart.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  
/*
  var pppp = 0;
  oboe("../events/" + traceId)
    .start(function(data){
      console.log(1);
      pppp++;
    })
    .node('{Chunk}[*]', function(chunk){
      
      //if(pppp % 100 == 0){
      //  console.log(chunk);
        
      //}
      if(pppp == 252){
        console.log(chunk);
      }
      console.log(pppp);
      pppp++;

      return oboe.drop;
      //console.log(data);
    })
    .on('done', function(data){
      //console.log(data);
      console.log(pppp);
    })
*/
  d3.json("../point_operations/" + traceId, function(error, pointOps) {

    console.log(pointOps);

    d3.json("../operations/" + traceId, function(error, ops) {
    
      console.log(1); 
      var colorPicker = new ColorScale(ops);

      d3.json("../events/" + traceId, function(error, data) {

        console.log(2); 

        y.domain(data.map(function(d) { return d.Location; }));
        x.domain([d3.min(data, function(d) { return d.TimeBegin; }), d3.max(data, function(d) { return d.TimeEnd; })]);
        x2.domain([x.domain()[0], x.domain()[1]]);

        //lval.set("value", x.domain()[0]);
        //rval.set("value", x.domain()[1]);
        //document.getElementById("lval").value = x.domain()[0];
        //document.getElementById("rval").value = x.domain()[1];
        //lval.value(x.domain()[0]);
        //rval.value(x.domain()[1]);


        chart.append("g")
          .attr("class", "x axis1")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
        chart.append("g")
          .attr("class", "y axis")
          .call(yAxis);

       // var line = d3.svg.line()
       //   .interpolate("basis")
       //   .x(function(d, i) { return x2(d.Time); })
       //   .y(function(d, i) { return y2(d.Count); });

        d3.json("../events_per_time/" + traceId, function(error, data2) {
          d3.json("../max_events_per_time/" + traceId, function(error, m) {
            y2.domain([0, m.Max]);

            context.selectAll(".prev-line")
                .data(data2)
              .enter().append("line")
                .classed("prev-line", true)
                .attr("x1", function(d) { return x2(d.Time); })
                .attr("y1", function(d) { return y2(0); })
                .attr("x2", function(d) { return x2(d.Time); })
                .attr("y2", function(d) { return y2(d.Count); });

            context.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", height2 - blockHeight * 3 - 8)
                .attr("height", blockHeight * 3 + 7);
          });
        });




        

            


        

        var brush = d3.svg.brush()
          .x(x2)
          .on("brush", brushed);
        function brushed() {
          x.domain(brush.empty() ? x2.domain() : brush.extent());
          chart.select(".x.axis1").call(xAxis);
          renderBars();
          
        }


        d3.select("#right")
          .on("click", function(d){
            if(!brush.empty()){
              var delta = x.domain()[1] - x.domain()[0];

              if(x.domain()[1] + delta / 5 > x2.domain()[1]){
                x.domain([x2.domain()[1] - delta, x2.domain()[1]]);
              }
              else{
                x.domain([x.domain()[0] + delta / 5, x.domain()[1] + delta / 5]);
              }

              chart.select(".x.axis1").call(xAxis);
              renderBars();
              brush.extent(x.domain());
              brush(d3.select(".brush").transition());
            }
          }); 


        d3.select("#plus")
          .on("click", function(d){
            var delta = x.domain()[1] - x.domain()[0];
            x.domain([x.domain()[0] + delta / 4, x.domain()[1] - delta / 4])
          
            chart.select(".x.axis1").call(xAxis);
            renderBars();
            
            brush.extent(x.domain());

            brush(d3.select(".brush").transition());
          });

        d3.select("#minus")
          .on("click", function(d){
            if(!brush.empty()){
              var delta = x.domain()[1] - x.domain()[0];

              var left = x.domain()[0] - delta / 2 < x2.domain()[0] ? x2.domain()[0] : x.domain()[0] - delta / 2;
              var right = x.domain()[1] + delta / 2 > x2.domain()[1] ? x2.domain()[1] : x.domain()[1] + delta / 2

              x.domain([left, right]);

              chart.select(".x.axis1").call(xAxis);
              renderBars();
              
              brush.extent(x.domain());

              brush(d3.select(".brush").transition());
            }

          }); 


        d3.select("#left")
          .on("click", function(d){
            if(!brush.empty()){
              var delta = x.domain()[1] - x.domain()[0];

              if(x.domain()[0] - delta / 5 < x2.domain()[0]){
                x.domain([x2.domain()[0], x2.domain()[0] + delta]);
              }
              else{
                x.domain([x.domain()[0] - delta / 5, x.domain()[1] - delta / 5]);
              }

              chart.select(".x.axis1").call(xAxis);
              renderBars();
              brush.extent(x.domain());
              brush(d3.select(".brush").transition());
            }
          }); 



          console.log(1); 






        function renderBars () {

          chart.selectAll(".bar")
            .remove();

          chart.selectAll(".x.axis1 .tick line.grid-line")
            .remove();

           console.log(1); 
          chart.selectAll(".bar")
              .data(data)
            .enter().append("rect")
              .attr("class", function(d) { return "bar main "; })
              .attr("x", function(d) { return x(d.TimeBegin) > 0 ? x(d.TimeBegin) : 0; })
              .attr("y", function(d) { return y(d.Location); })
              .attr("height", y.rangeBand())
              .attr("fill", function(d){return colorPicker.GetColor(d.Operation);})
              .attr("width", function(d) { 

               // var tb = 
                var left = x(d.TimeBegin) > 0 ? x(d.TimeBegin) : 0;
                var right = x(d.TimeEnd) <= width ? x(d.TimeEnd) : width;
                if(right < 0 || left > width){
                  return 0;
                }
                else{
                  return right - left;
                }
              })
              .on("mouseover", function(d) {      
                    div.transition()        
                        .duration(200)      
                        .style("opacity", .9);      
                    div .html( d.Operation + "<br/>Sent: " + d.SizeSent + "<br/>Received: " + d.SizeReceived+ "<br/>Start: " + d.TimeBegin+ "<br/>End: " + d.TimeEnd)  
                        .style("left", (d3.event.pageX + 48) + "px")     
                        .style("top", (d3.event.pageY - 28) + "px");    
                    })                  
              .on("mouseout", function(d) {       
                    div.transition()        
                        .duration(500)      
                        .style("opacity", 0);  
                });

          chart.selectAll(".x.axis1 .tick")
            .append("line")
              .classed("grid-line", true)
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", 0)
              .attr("y2", -height + locNumber / 2);



          chart.selectAll(".point-line")
            .remove();

          chart.selectAll(".point-line")
                .data(pointOps)
              .enter().append("line")
                .classed("point-line", true)
                .attr("x1", function(d) { return x(d.TimeBegin); })
                .attr("y1", function(d) { return y(d.From ) + blockHeight / 2; })
                .attr("x2", function(d) { return x(d.TimeEnd); })
                .attr("y2", function(d) { return y(d.To) + blockHeight / 2; })
                .on("mouseover", function(d) {     
                    div.transition()        
                        .duration(200)      
                        .style("opacity", .9);      
                    div .html( "TimeBegin: " + d.TimeBegin + "<br/>TimeEnd: " + d.TimeEnd+ "<br/>Size: " + d.Size )  
                        .style("left", (d3.event.pageX + 48) + "px")     
                        .style("top", (d3.event.pageY - 28) + "px");    
                    })                  
                .on("mouseout", function(d) {    
                        div.transition()        
                            .duration(500)      
                            .style("opacity", 0);  
                });

          document.getElementById("lval").value = Math.round(x.domain()[0]);
          document.getElementById("rval").value = Math.round(x.domain()[1]);

        }

        chart.selectAll(".y.axis .tick line").remove();

        chart.selectAll(".y.axis .tick")
          .append("line")
            .classed("grid-line", true)
            .attr("x1", 0)
            .attr("y1", - height / locNumber / 2 + 1)
            .attr("x2", width)
            .attr("y2", - height / locNumber / 2 + 1);


        renderBars();

        context.append("g")
          .attr("class", "x axis2")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);
              
      });








      


      var legend = d3.select("#legend")
          .attr("height", ops.length * blockHeight * 3)
          .attr("width", 300);




      var b = legend.selectAll("g")
          .data(ops)
        .enter().append("g")
          .attr("transform", function(d,i){return "translate(0," + i * blockHeight * 2 + ")";});


      b.append("rect")
        .attr("class", function(d) { return "bar "; })
        .attr("width" , blockHeight * 2)
        .attr("height" , blockHeight)
        .attr("fill", function(d){return colorPicker.GetColor(d);});

      b.append("text")
        .attr("x", blockHeight * 2.5)
        .attr("y", blockHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) { return "- " + d; });
      //legend.data(ops)
      //      .enter().append("text")
      //        .attr("x", 5)
      //        .attr("y", 5)
      //        .attr("dy", ".35em")
      //        .text(function(d) { console.log(d); return d; });
  /*
      legend.selectAll(".bar")
            .data(ops)
          .enter().append("rect")
            .attr("class", function(d) { return "bar " + d; })
            .attr("x", 5)
            .attr("y", function(d, i) { return i * (blockHeight + 3); })
            .attr("height", blockHeight)
            .attr("width", blockHeight * 2)
          .append("text")
              .attr("x", 0)
              .attr("y", 0)
              .attr("dy", ".35em")
              .text(function(d) { console.log(d); return d; });

      legend.selectAll(".bar")
          .append("line")
            .classed("tick", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 100)
            .attr("y2", 100);*/

    });

  });

})();
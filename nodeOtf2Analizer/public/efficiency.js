(function(){

  var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

  var groupName = document.getElementById("GroupName").value;


  var locNumber = 15;


  var blockHeight = 20;

  var margin = {top: 50, right: 30, bottom: 200, left: 140},
    margin2 = {top: blockHeight * locNumber , right: 30, bottom: 30, left: 0},
    width = 960 - margin.left - margin.right,
    height = blockHeight * locNumber * 2,// - margin.top - margin.bottom,
    height2 = blockHeight * locNumber ;// - margin2.top - margin2.bottom;

  var y = d3.scale.linear()
    .range([blockHeight * locNumber , 0]);

  var y2 = d3.scale.linear()
    .range([height, blockHeight * locNumber]);

  var x = d3.scale.linear()
    .range([0, width]);

  var x2 = d3.scale.linear()
    .range([0, width]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var xAxis2 = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var yAxis2 = d3.svg.axis()
    .scale(y2)
    .orient("left");

  var chart = d3.select("#chart_placeholder")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = chart.append("g")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "context")
    .append("g")
      .attr("transform", "translate(" + margin2.left + "," + (blockHeight * locNumber - 200) + ")");


      d3.json("../EfficiencyData/" + groupName, function(error, data) {

        console.log(data); 

        var maxTime = data[0].Time;

        var minProcs = data[0].MaxLoc + 1;
        //var minTime = d3.max(data, function(d) { return d.Time; })

        x.domain(d3.extent(data, function(d) { return d.MaxLoc + 1; }));
        y.domain([0, d3.max(data, function(d) { return  maxTime / d.Time ; })]);

        y2.domain([0, d3.max(data, function(d) { return  maxTime / d.Time * minProcs / (d.MaxLoc + 1) ; })]);


        chart.append("g")
            .attr("class", "x axis1")
            .attr("transform", "translate(0," + blockHeight * locNumber  + ")")
            .call(xAxis)
          .append("text")
            .attr("x", width / 2)
            .attr("y", 50)
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Processor number");

        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", - 50)
            .attr("x", - blockHeight * locNumber * 0.5 )
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Speedup");


        context.append("g")
            .attr("class", "x axis2")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis2)
          .append("text")
            .attr("x", width / 2)
            .attr("y", 50)
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Processor number");
        
        context.append("g")
            .attr("class", "y axis")
            .call(yAxis2)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", - 50)
            .attr("x", - blockHeight * locNumber * 1.5 )
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Efficiency");
        




        function renderBars () {

          //chart.selectAll(".bar")
          //  .remove();

          chart.selectAll(".x.axis1 .tick line.grid-line")
            .remove();


          var line = d3.svg.line()
           .x(function(d) { return x(d.MaxLoc + 1); })
           .y(function(d) { return y(maxTime / d.Time); });

          chart.append("path")
            .datum(data)
            .attr("class", "speedup-line")
            .attr("d", line)

          chart.selectAll(".speedup-dot")
              .data(data)
            .enter().append("circle")
            .attr("class", "speedup-dot")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d.MaxLoc + 1); })
            .attr("cy", function(d) { return y(maxTime / d.Time); })

          //document.getElementById("lval").value = Math.round(x.domain()[0]);
          //document.getElementById("rval").value = Math.round(x.domain()[1]);



          var line2 = d3.svg.line()
           .x(function(d) { return x(d.MaxLoc + 1); })
           .y(function(d) { return y2(maxTime / d.Time * minProcs / (d.MaxLoc + 1)); });

          context.append("path")
            .datum(data)
            .attr("class", "efficiency-line")
            .attr("d", line2)

          context.selectAll(".efficiency-dot")
              .data(data)
            .enter().append("circle")
            .attr("class", "efficiency-dot")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d.MaxLoc + 1); })
            .attr("cy", function(d) { return y2(maxTime / d.Time * minProcs / (d.MaxLoc + 1)); })
          
          


        }


        chart.selectAll(".y.axis .tick line").remove();

        chart.selectAll(".y.axis .tick")
          .append("line")
            .classed("grid-line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0);


        context.selectAll(".y.axis .tick line").remove();

        context.selectAll(".y.axis .tick")
          .append("line")
            .classed("grid-line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0);

        renderBars();


        



      });



})();
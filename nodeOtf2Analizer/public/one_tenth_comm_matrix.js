(function(){




  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }



  var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

  var traceId = document.getElementById("TraceId").value;

  var locNumber = document.getElementById("LocNumber").value;

  var currentPartLabel = document.getElementById("current_part");



  var stats = document.getElementById("stats_content");

  



  d3.selection.prototype.last = function(){
    var last = this.size()-1;
    return d3.select(this[0][last]);
  }

  var blockHeight = 20;

  var margin = {top: 20, right: 170, bottom: 50, left: 100},
    width = 960 - margin.left - margin.right,
    height = blockHeight * locNumber;

 

  var y = d3.scale.ordinal()
    .domain(d3.range(parseInt(locNumber) + 1))
    .rangeRoundPoints([0, height]);

  var x = d3.scale.ordinal()
    .domain(d3.range(parseInt(locNumber) + 1))
    .rangeRoundPoints([0, width]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var chart = d3.select("#chart_placeholder")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var gradient = chart.append("svg:defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x1", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "red");

  gradient.append("stop")
    .attr("offset", "25%")
    .attr("stop-color", "yellow");

  gradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", "green");

  gradient.append("stop")
    .attr("offset", "75%")
    .attr("stop-color", "blue");

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "purple");


  function ColorScale(minValue, maxValue){
    var _minValue = minValue;
    var _maxValue = maxValue;
    var _delta = _maxValue - _minValue;

    var _colorScale1 = d3.scale.linear()
    .domain([_minValue, _minValue + _delta / 4])
      .range(["#800080","#0000FF"])
      .interpolate(d3.cie.interpolateLch);

    // От blue до green
    var _colorScale2 = d3.scale.linear()
      .domain([_minValue + _delta / 4,_minValue + _delta / 2])
      .range(["#0000FF","#008000"])
      .interpolate(d3.cie.interpolateLch);

    // От green до yellow
    var _colorScale3 = d3.scale.linear()
      .domain([_minValue + _delta / 2, _minValue + 3 * _delta / 4])
      .range(["#008000","#FFFF00"])
      .interpolate(d3.cie.interpolateLch);

    // От yellow до red
    var _colorScale4 = d3.scale.linear()
      .domain([_minValue + 3 * _delta / 4, _maxValue])
      .range(["#FFFF00","#FF0000"])
      .interpolate(d3.cie.interpolateLch);


    this.GetColor = function(value){
      if(_minValue == _maxValue){
        return "#FF0000";
      }

      if((value - _minValue) / _delta < 0.25){
        return _colorScale1(value);
      }
      if((value - _minValue) / _delta < 0.5){
        return _colorScale2(value);
      }
      if((value - _minValue) / _delta < 0.75){
        return _colorScale3(value);
      }
        return _colorScale4(value);
    }
  }




  var partsNumber = parseInt(getParameterByName("pn")) || 10;

  d3.json("../SizeSent_parts/" + traceId + "?pn=" + partsNumber, function(error, allData) {

    var _curGroup = 0;
    var _groupNumber = allData.length;

    /*
    var tmpCount = 0;
    for(var i = 0; i < 10; i++){
      var t1 = allData[i].Sends;

      for(var j = 0; j < t1.length; j++){
        if(t1[j].From == 7 && t1[j].To == 23){
          tmpCount += t1[j].SizeSent;
        }
      }
    }
    */

    currentPartLabel.textContent = (allData[_curGroup].Group + 1) + "/" + partsNumber;
    
    data = allData[_curGroup].Sends;


    chart.append("g")
      .attr("class", "x axis1")
      .call(xAxis);

    chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);





    chart.selectAll(".x.axis1 .tick line").remove();
    chart.selectAll(".y.axis .tick line").remove();


    chart.selectAll(".x.axis1 .tick")
        .append("line")
          .classed("grid-line", true)
          .attr("x1", (x(0) - x(1)) / 2 )
          .attr("y1", 0 )
          .attr("x2", (x(0) - x(1)) / 2 )
          .attr("y2", ((y(0) - y(1)) * locNumber - blockHeight / 2 ));

    chart.selectAll(".y.axis .tick")
      .append("line")
        .classed("grid-line", true)
        .attr("x1", x(0) )
        .attr("y1", (y(0) - y(1)) / 2 )
        .attr("x2", x(locNumber))
        .attr("y2", (y(0) - y(1)) / 2 );



    chart.selectAll(".x.axis1") 
      .attr("transform", "translate(0," + (height - (blockHeight + (y(0) - y(1) )) * locNumber / 2) + ")")
      

    chart.selectAll(".y.axis") 
      .attr("transform", "translate(" + ((x(0) - x(1)) / 2 ) + ",0)")



    chart.selectAll(".x.axis1 .tick text").last().remove();
    chart.selectAll(".y.axis .tick text").last().remove();

    chart.append("rect")
        .attr("x", 20)
        .attr("y", 20)
        .attr("width", 30)
        .attr("height", height)
        .attr("transform", "translate(" + (width ) + "," + (-margin.top - blockHeight / 2) + ")")
        .attr("fill", "url(#gradient)");



    for (var i = 0; i < 5; i++) {
        chart.append("line")
          .classed("colorscale-tick", true)
          .attr("x1", 20)
          .attr("y1", 20 + i * height / 4)
          .attr("x2", 70)
          .attr("y2", 20 + i * height / 4)
          .attr("transform", "translate(" + (width ) + "," + (-margin.top - blockHeight / 2) + ")")

    };


    function renderBars () {

      d3.select("#stats_content").selectAll("*").remove();

      var addStat = function(list, string){
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(string));
        list.appendChild(li);
      }

      function sortNumbers(a, b){
        return a - b;
      }

      // Подсчитываем статистику

      var maxMessage = 0;
      for (var i = allData[_curGroup].Sends.length - 1; i >= 0; i--) {
        if(allData[_curGroup].Sends[i].SizeSent > maxMessage){
          maxMessage = allData[_curGroup].Sends[i].SizeSent;
        }
      };

      var maxLocs = [];
      for (var i = allData[_curGroup].Sends.length - 1; i >= 0; i--) {
        if(allData[_curGroup].Sends[i].SizeSent / maxMessage > 0.98 && maxLocs.indexOf(allData[_curGroup].Sends[i].From) == -1){
          maxLocs.push(allData[_curGroup].Sends[i].From);
        }
        
      };
      maxLocs.sort(sortNumbers);






      var SendMessages = [];

      for (var i = locNumber - 1; i >= 0; i--) {
        SendMessages[i] = 0;
      };

      for (var i = allData[_curGroup].Sends.length - 1; i >= 0; i--) {
        SendMessages[allData[_curGroup].Sends[i].From] += allData[_curGroup].Sends[i].SizeSent;
      };

      var maxSendMessage = 0;
      for (var i = locNumber - 1; i >= 0; i--) {
        if(SendMessages[i] > maxSendMessage){
          maxSendMessage = SendMessages[i];
        }
      };


      var maxSendLocs = [];
      for (var i = locNumber - 1; i >= 0; i--) {
        if(SendMessages[i] / maxSendMessage > 0.98){
          maxSendLocs.push(i);
        }
        
      };
      maxSendLocs.sort(sortNumbers);



      var RecvMessages = [];

      for (var i = locNumber - 1; i >= 0; i--) {
        RecvMessages[i] = 0;
      };

      for (var i = allData[_curGroup].Sends.length - 1; i >= 0; i--) {
        RecvMessages[allData[_curGroup].Sends[i].To] += allData[_curGroup].Sends[i].SizeSent;
      };

      var maxRecvMessage = 0;
      for (var i = locNumber - 1; i >= 0; i--) {
        if(RecvMessages[i] > maxRecvMessage){
          maxRecvMessage = RecvMessages[i];
        }
      };


      var maxRecvLocs = [];
      for (var i = locNumber - 1; i >= 0; i--) {
        if(RecvMessages[i] / maxRecvMessage > 0.98){
          maxRecvLocs.push(i);
        }
        
      };
      maxRecvLocs.sort(sortNumbers);




      console.log(allData[_curGroup]);
      addStat(stats, "Max Message Length: " + maxMessage);
      addStat(stats, "Locations With Max Message: " + maxLocs.join(", "));


      addStat(stats, "Max Sends: " + maxSendMessage);
      addStat(stats, "Locations With Max Sends: " + maxSendLocs.join(", "));

      addStat(stats, "Max Recvs: " + maxRecvMessage);
      addStat(stats, "Locations With Max Recvs: " + maxRecvLocs.join(", "));



      var minSizeSent = d3.min(data, function(d) { 
        if(d.To >= 0){
          return d.SizeSent;
        }
      });

      var maxSizeSent = d3.max(data, function(d) { 
        if(d.To >= 0){
          return d.SizeSent;
        }
      });

      var colorPicker = new ColorScale(minSizeSent, maxSizeSent);

      chart.selectAll(".colorscale-text")
        .remove();

      for (var i = 0; i < 5; i++) {

        chart.append("text")
          .classed("colorscale-text", true)
          .attr("x", 80)
          .attr("y", 30 + i * height / 4)
          .attr("x2", 70)
          .text(maxSizeSent - i * (maxSizeSent - minSizeSent) / 4)
          .attr("font-size", "12px")
          .attr("transform", "translate(" + (width ) + "," + (-margin.top - blockHeight / 2) + ")");
      };



      chart.selectAll(".bar")
        .remove();


      chart.selectAll(".bar")
          .data(data)
        .enter().append("rect")
          .attr("class", function(d) { return "bar main "; })
          .attr("x", function(d) { 
            if(d.To > -1 ){
              return x(d.To) - (x(1) - x(0)) / 2;
            }            
          })
          .attr("y", function(d) { return y(d.From) - (y(1) - y(0)) / 2; })
          .attr("height", function(d) { 
            if(d.To > -1 ){
              return y(1) - y(0);
            }    
          })
          .attr("width", function(d) { return x(1) - x(0);})
          .attr("fill", function(d){return colorPicker.GetColor(d.SizeSent);})
          .on("mouseover", function(d) {      
                div.transition()        
                    .duration(200)      
                    .style("opacity", .9);      
                div .html( "SizeSent: " + d.SizeSent + "<br/>From: " + d.From+ "<br/>To: " + d.To)  
                    .style("left", (d3.event.pageX + 40) + "px")     
                    .style("top", (d3.event.pageY - 40) + "px");    
                })                  
          .on("mouseout", function(d) {       
                div.transition()        
                    .duration(500)      
                    .style("opacity", 0);  
            });
    }

    renderBars();



    function rightclick(){
            if(_curGroup < _groupNumber - 1){
              _curGroup++;  
            }
            else{
              _curGroup = 0;
            }

            currentPartLabel.textContent = (allData[_curGroup].Group + 1) + "/" + partsNumber;
            data = allData[_curGroup].Sends;

            renderBars();
    }



    d3.select("#right")
          .on("click", function(d){
            rightclick();
    }); 


    function leftclick(){
            if(_curGroup > 0){
              _curGroup--;  
            }
            else{
              _curGroup = _groupNumber - 1;
            }

            currentPartLabel.textContent = (allData[_curGroup].Group + 1) + "/" + partsNumber;
            data = allData[_curGroup].Sends;

            renderBars();

    }

    d3.select("#left")
          .on("click", function(d){
            leftclick();
    }); 


    var _start = false;

    var str_stp = d3.select("#play-stop");

    var playEvent;

    str_stp
          .on("click", function(d){

            if(_start){
              str_stp[0][0].textContent = "start";
              _start = false;
              clearInterval(playEvent);

            }
            else{
              str_stp[0][0].textContent = "stop";
              _start = true;
              playEvent = setInterval(rightclick, 200);
            }
            


    }); 



  
  });



})();
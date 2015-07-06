


angular.module('traceApp', [])
  .controller('TraceController', ['$scope', '$http', '$templateCache',
  function($scope, $http, $templateCache) {
    $scope.posCount = 0;
    
    $scope.refreshPosition = true;

    $scope.canvas = document.getElementById("myCanvas");
    
    $scope.players = [];
    
    $scope.traces = [];
    
    $scope.currentPlayer = {};
    


    
    
    $scope.getTraces = function(){
      $http({method: "GET", url: "/traces", cache: false}).
          success(function(traces, status) {
              //console.log(rooms);
              $scope.traces = traces;
          }).
          error(function(data, status) {
            $scope.data = data || "Request failed";
            $scope.status = status;
        });
      
    };

    $scope.getEfficiencyGroup = function(){
      $http({method: "GET", url: "/efficiency", cache: false}).
          success(function(grps, status) {
              //console.log(rooms);
              $scope.EfficiencyGroups = grps;
          }).
          error(function(data, status) {
            $scope.data = data || "Request failed";
            $scope.status = status;
        });
      
    };
    
    $scope.init = function(){
      $scope.getTraces();
      $scope.getEfficiencyGroup();
    };
    
    
  }]);
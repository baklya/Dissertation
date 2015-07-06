module.exports = exports = function(app, db) {


   // var _CHUNK_SIZE = 8000; // количество событий передаваемое клиенту единовремено в потоке

    app.get('/', function(req, res){
        res.render('index');
    });
    
    



    app.get('/traces', function(req, res) {
        db.collection('TraceIds').find({ Status: "done" }, {_id: 0}).toArray(function(err, traces) {
            if(err) throw err;
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(traces));
        });
    });
    



    // показывать операции трассы
    app.get('/operations/:traceId', function(req, res) {
        db.collection('Events').distinct('Operation', {TraceId: req.params.traceId}, function(err, ops) {
            if(err) throw err;
            if(ops.length){
                ops.sort();
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(ops));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });


    // количество событий в данный момент
    app.get('/events_per_time/:traceId', function(req, res) {
        db.collection('Events').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: "$TimeEnd", Count : {$sum: 1}}}, {$project: {Time : "$_id", Count: 1, _id: 0}}, {$sort: {Time: 1}}],{allowDiskUse : true}, function(err, events) {
            if(err) throw err;
            if(events.length){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(events));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });



    // максимум событий во времени
    app.get('/max_events_per_time/:traceId', function(req, res) {
        db.collection('Events').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: "$TimeEnd", Count : {$sum: 1}}}, {$project: {Time : "$_id", Count: 1, _id: 0}}, {$group: {_id: "Max", Max : {$max : "$Count"}}}, {$project : {_id : 0, Max : 1}}],{allowDiskUse : true}, function(err, max) {
            if(err) throw err;
            if(max[0]){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(max[0]));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });


    // размеры посылки и приема сообщений по каждому процессу
    app.get('/messages_per_process/:traceId', function(req, res) {
        db.collection('Events').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: "$Location", TotalSent : {$sum: "$SizeSent"}, TotalReceived : {$sum : "$SizeReceived"}}}, {$project: {Location : "$_id", TotalReceived: 1, TotalSent: 1, _id: 0}}, {$sort : {Location : 1}}], {allowDiskUse : true}, function(err, sizes) {
            if(err) throw err;
            if(sizes.length){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(sizes));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });




    
    app.get('/events/:traceId', function(req, res) {        
        var iteration = 0;
        var tempRes = '';
        var first = true;
        res.writeHead(200, {'Content-Type': 'application/json'});

        res.write("[");
        db.collection('Events').find({ TraceId: req.params.traceId}, {_id: 0, TraceId : 0}).sort({Location: 1})
            .on('data', function(item){
                var prefix = first ? '' : ',';
                res.write(prefix + JSON.stringify(item));
                first = false;
            })
            .on('end', function(){
                res.write("]");
                res.end();
            })
    });


    app.get('/point_operations/:traceId', function(req, res) {        
        var iteration = 0;
        var tempRes = '';
        var first = true;
        res.writeHead(200, {'Content-Type': 'application/json'});

        res.write("[");
        db.collection('PointOperations').find({ TraceId: req.params.traceId}, {_id: 0, TraceId : 0}).sort({Location: 1})
            .on('data', function(item){
                var prefix = first ? '' : ',';
                res.write(prefix + JSON.stringify(item));
                first = false;
            })
            .on('end', function(){
                res.write("]");
                res.end();
            })
    });



    
    // enter trace
    app.get('/traces/:id', function(req, res) {
        db.collection('TraceIds').findOne({ TraceId: req.params.id, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('trace', {trace: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });
    
 



    //EfficiencyGroup
    app.get('/efficiency', function(req, res) {
        db.collection('TraceIds').distinct('EfficiencyGroup', {Status: "done" }, function(err, grps) {
            if(err) throw err;
            if(grps.length){
                grps.sort();
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(grps));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });


    app.get('/efficiency/:Group', function(req, res) {
        // TODO сложный запрос с возвратом только нужных данных

        // нужно получить время - количество процесосв

        db.collection('TraceIds').findOne({ EfficiencyGroup: req.params.Group, Status: "done" },function(err, traces) {
            if(err) throw err;
            console.log(traces)
            if(traces){

                res.render('efficiency', {Name: req.params.Group});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });

/*
        db.collection('TraceIds').find({ EfficiencyGroup: req.params.Group, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('efficiency', {data: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
        */
    });



    app.get('/EfficiencyData/:Group', function(req, res) {
        // TODO сложный запрос с возвратом только нужных данных

        // нужно получить время - количество процесосв

        //db.collection('TraceIds').distinct('TraceId', { EfficiencyGroup: req.params.Group, Status: "done" }, function(err, traces) {

        db.collection('TraceIds').aggregate([{$match: {EfficiencyGroup: req.params.Group, Status: "done"}}, {$project: {TraceId : 1, _id: 0}}], function(err, traces) {
            if(err) throw err;
            if(traces.length){


                db.collection('Events').aggregate([{$match: {$or: traces} }, {$group: {_id: "$TraceId", MaxLoc : {$max : "$Location" }, MaxTime: {$max : "$TimeEnd"}, MinTime: {$min : "$TimeBegin"}}}, {$project: { Time: {$subtract : ["$MaxTime", "$MinTime"]}, MaxLoc: 1, _id: 0}}, {$sort: {MaxLoc: 1}}],{allowDiskUse : true}, function(err, trs) {
                    if(err) throw err;
                    if(trs.length){

                        //res.render('efficiency', {data: traces});

                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify(trs));
                    }
                    else{
                        res.status(404).send('Page Not Found');
                    }
                });








                //res.render('efficiency', {data: traces});

                //res.writeHead(200, {'Content-Type': 'application/json'});
                //res.end(JSON.stringify(traces));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });

/*
        db.collection('TraceIds').find({ EfficiencyGroup: req.params.Group, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('efficiency', {data: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
        */
    });


    // communication matrix
    app.get('/comm_matrix/:id', function(req, res) {
        db.collection('TraceIds').findOne({ TraceId: req.params.id, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('comm_matrix', {trace: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });



    // матрица делить на 10 частей по времени
    app.get('/SizeSent_parts/:traceId', function(req, res) {
        db.collection('PointOperations').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: "MinMaxCount", Count: { $sum: 1 }, Min : {$min : "$TimeBegin"}, Max : {$max : "$TimeEnd"}}}], function(err, minMaxCount) {
            if(err) throw err;

            var delta = minMaxCount[0].Max - minMaxCount[0].Min + 2;

            var partsNumber = parseInt(req.query.pn) || 10;


            db.collection('PointOperations').aggregate([{$match: {TraceId: req.params.traceId}},{$project: {From: 1, To: 1, Part: { $divide:[{ $subtract: [ "$TimeEnd", minMaxCount[0].Min ] }, delta]} , SizeSent: "$Size",  _id: 0 }}, {$group: {_id: {From: "$From", To: "$To", GroupNumber: {$subtract:[ {$multiply:['$Part',partsNumber]},  {$mod:[{$multiply:['$Part',partsNumber]}, 1]} ]}}, SizeSent : {$sum : "$SizeSent"}}}, {$group: {_id: "$_id.GroupNumber", Sends: {$push: {From: "$_id.From", To: "$_id.To", SizeSent: "$SizeSent"}}}}, {$project: {Group: "$_id", Sends: 1,  _id: 0}}, {$sort: {Group: 1}}],{allowDiskUse : true}, function(err, events) {
                if(err) throw err;
                if(events.length){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify(events));
                }
                else{
                    res.status(404).send('Page Not Found');
                }
            });
        });
    });




    // локация кому послал сколько
    app.get('/SizeSent/:traceId', function(req, res) {
        db.collection('PointOperations').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: {From: "$From", To: "$To"}, SizeSent : {$sum : "$Size"}}}, {$project: {From : "$_id.From", To: "$_id.To", SizeSent: 1,  _id: 0}}, {$sort: {From: 1}}],{allowDiskUse : true}, function(err, events) {
            if(err) throw err;
            if(events.length){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(events));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });





    // time matrix
    app.get('/time_matrix/:id', function(req, res) {
        db.collection('TraceIds').findOne({ TraceId: req.params.id, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('time_matrix', {trace: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });



    // время передачи сообщения
    app.get('/SentTime/:traceId', function(req, res) {
        db.collection('PointOperations').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: {From: "$From", To: "$To"}, SentTime : {$sum : { $subtract: [ "$TimeEnd", "$TimeBegin" ] } }}}, {$project: {From : "$_id.From", To: "$_id.To", SentTime: 1,  _id: 0}}, {$sort: {From: 1}}],{allowDiskUse : true}, function(err, events) {
            if(err) throw err;
            if(events.length){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(events));
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });



    // time matrix
    app.get('/one_tenth_comm_matrix/:id', function(req, res) {
        db.collection('TraceIds').findOne({ TraceId: req.params.id, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('one_tenth_comm_matrix', {trace: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });


    app.get('/patterns/:id', function(req, res) {
        db.collection('TraceIds').findOne({ TraceId: req.params.id, Status: "done" },function(err, item) {
            if(err) throw err;
            if(item){
                res.render('patterns', {trace: item});
            }
            else{
                res.status(404).send('Page Not Found');
            }
        });
    });



    // данные для определения паттернов
    app.get('/Patterns_data/:traceId', function(req, res) {
        db.collection('PointOperations').aggregate([{$match: {TraceId: req.params.traceId}},{$group: {_id: "MinMaxCount", Count: { $sum: 1 }, Min : {$min : "$TimeBegin"}, Max : {$max : "$TimeEnd"}}}], function(err, minMaxCount) {
            if(err) throw err;

            var delta = minMaxCount[0].Max - minMaxCount[0].Min + 2;

            var partsNumber = parseInt(req.query.pn) || minMaxCount[0].Count * minMaxCount[0].Count;

            db.collection('PointOperations').aggregate([{$match: {TraceId: req.params.traceId}},{$project: {From: 1, To: 1, Part: { $divide:[{ $subtract: [ "$TimeEnd", minMaxCount[0].Min ] }, delta]} , SizeSent: "$Size",  _id: 0 }}, {$group: {_id: {From: "$From", To: "$To", GroupNumber: {$subtract:[ {$multiply:['$Part',partsNumber]},  {$mod:[{$multiply:['$Part',partsNumber]}, 1]} ]}}, SizeSent : {$sum : "$SizeSent"}}}, {$group: {_id: {From: "$_id.From", To: "$_id.To"}, Count: {$sum: 1}}}, {$project: {From: "$_id.From", To: "$_id.To" , Count: 1,  _id: 0}} ],{allowDiskUse : true}, function(err, events) {
                if(err) throw err;
                if(events.length){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify(events));
                }
                else{
                    res.status(404).send('Page Not Found');
                }
            });
        });
    });



    app.get('*', function(req, res){
        res.status(404).send('Page Not Found');
    });

};

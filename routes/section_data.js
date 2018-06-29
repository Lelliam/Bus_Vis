
var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/traffic_data';
var d3 = require('./d3.min');

router.get('/section_route_data', function(req, res, next) {

    var section_id = req.query.section_id;
    var selectData = function(db, callback) {
        //连接到表
        var collection = db.collection('section_run_data');
        //查询数据
        collection.find({"section_id" : parseInt(section_id)},
            {
                "from_station_id":0,
                "id":0,
                "stay_time":0,
                "from_station_name":0,
                "_id":0
            })
            .toArray(function(err, result) {
            if(err)
            {
                console.log('Error:'+ err);
                return;
            }
            callback(result);
        });
    }

    MongoClient.connect(DB_CONN_STR, function(err, db) {
        selectData(db, function(result) {

            result.forEach(function (d) {
                if(d.speed >= 60)d.speed = 0;
                d.start_date_time = new Date(d.start_date_time);
                d.start_date_time.setMinutes(0,0);
                d.start_date_time.setSeconds(0,0);
            });

            var nest = d3.nest().key(function (d) {
                return d.start_date_time;
            });

            var data_line = nest.entries(result);

            data_line.forEach(function (d) {
                var sum =0;
                d.key = new Date(d.key);
                d.values.forEach(function (s) {
                    sum += s.speed;
                });
                d.values = sum/d.values.length;
                d.day = new Date(d.key).getDate();
                d.hour = new Date(d.key).getHours();
                d.speed = d.values;
            });

            data_line.sort(function (a,b) {
                return a.key - b.key;
            });


            var extent_hour = d3.extent(data_line,function(d){
                return d.hour;
            });

            data_line.forEach(function (d) {

                if(d.hour==extent_hour[0]);
                else{
                    if(d.hour+1 == extent_hour[1]){
                        data_line.push({day:d.day,hour:d.hour+1});
                    }
                    else
                    {
                        data_line.push({day:d.day,hour:d.hour-1});
                    }
                }
            });
            res.json(data_line);
            db.close();
        });
    });

});

router.get('/route_search', function(req, res, next) {

    var route_id = req.query.route_id;
    console.log(typeof (route_id),route_id);
    var selectData = function(db, callback) {
        //连接到表
        var collection = db.collection('all_routes');
        //查询数据
        var whereStr = {}
        collection.find({sub_route_id:{$regex:route_id}}).toArray(function(err, result) {
            if(err)
            {
                console.log('Error:'+ err);
                return;
            }
            callback(result);
        });
    }

    MongoClient.connect(DB_CONN_STR, function(err, db) {
        selectData(db, function(result) {
            res.json(result);
            db.close();
        });
    });

});

router.get('/section_heat', function(req, res, next) {
    var date_extent = req.query.date_extent;
    console.log(new Date(date_extent[0]));
    var selectData = function(db, callback) {
        //连接到表
        var collection = db.collection('section_run_data');
        //查询数据
        collection.find({"start_date_time" : {$gte:new Date(date_extent[0]),$lte:new Date(date_extent[1])}},
            {
                "from_station_id":0,
                "id":0,
                "stay_time":0,
                "from_station_name":0,
                "_id":0
            })
            .toArray(function(err, result) {
                if(err)
                {
                    console.log('Error:'+ err);
                    return;
                }
                callback(result);
            });
    }

    MongoClient.connect(DB_CONN_STR, function(err, db) {
        selectData(db, function(result) {
            res.json(result);
            db.close();
        });
    });

});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;

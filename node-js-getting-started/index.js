
const PORT = process.env.PORT || 5000

const express = require('express')
const app = express();
var bodyParser = require("body-parser");
const https = require('https');

app.use(bodyParser.json());

app.use(function (req, res, next) {
    console.log(req.body) // populated!
    next()
});

app.get('/', function (req, res) {
    console.log("Hello world");
    res.send("Hello world");
});

app.get('/info', function (req, res) {

    var promiseIntMinMax = new Promise(function (resolve, reject) {
        https.get('https://api.thingspeak.com/channels/489319/fields/1.json?api_key=E75SF9QJIJ77J7W6&days=1', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(JSON.parse(data));
                result = JSON.parse(data);
                if (result.feeds.length > 0) {
                    let maxField1 = result.feeds.reduce(function (a, b) {
                        return (a.field1 > b.field1) ? a : b;
                    });
                    console.log("MAX: ", maxField1);
                    let minField1 = result.feeds.reduce(function (a, b) {
                        return (a.field1 < b.field1) ? a : b;
                    });
                    resolve({ "max_int_temp": maxField1, "min_int_temp": minField1 });
                } else {
                    resolve({ "max_int_temp": "99", "min_int_temp": "99" });
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });
    });


    var promiseExtMinMax = new Promise(function (resolve, reject) {
        https.get('https://api.thingspeak.com/channels/489319/fields/2.json?api_key=E75SF9QJIJ77J7W6&days=1', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(JSON.parse(data));
                result = JSON.parse(data);
                if (result.feeds.length > 0) {
                    var maxField2 = result.feeds.reduce(function (a, b) {
                        // console.log(a.field2 + "  " + b.field2)
                        return (a.field1 > b.field1) ? a : b;
                    });
                    var minField2 = result.feeds.reduce(function (a, b) {
                        // console.log(a.field2 + "  " + b.field2)
                        return (a.field1 < b.field1) ? a : b;
                    });
                    console.log("maxF2: ", maxField2);
                    if (maxField2.field2 == null) {
                        maxField2.field2 = "99";
                        minField2.field2 = "99";
                    }
                    resolve({ "max_ext_temp": maxField2, "min_ext_temp": minField2 });
                } else {
                    resolve({ "max_ext_temp": "99", "min_ext_temp": "99" });
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });
    });

    var promiseExt = new Promise(function (resolve, reject) {
        https.get('https://api.thingspeak.com/channels/489319/fields/1/last.json?api_key=E75SF9QJIJ77J7W6&', (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(JSON.parse(data));
                resolve({ "ext_temp": JSON.parse(data) });
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });
    });

    var promiseWeather = new Promise(function (resolve, reject) {
        https.get('http://api.openweathermap.org/data/2.5/weather?q=Lyon&units=metric&APPID=59dec7514a208a87bdb1a6e130d48cb7', (resp) => {
            let data = '';
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(JSON.parse(data));

                resolve({ "weather": { "weather": data.weather.id, "sunset": formatSunRiseSet(data.sys.sunset), "sunrise": formatSunRiseSet(data.sys.sunrise) } });
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });
    });


    Promise.all([promiseIntMinMax, promiseExtMinMax, promiseExt, promiseWeather])
        .then(result => {
            console.log("RESULT :", result);
            res.json(result);
        })
        .catch(err => {
            console.err("ERRROR: ", err);
        });

});


function formatSunRiseSet(timestamp) {
    var date = new Date(unix_timestamp * 1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Will display time in 10:30:23 format
    return hours + ':' + minutes.substr(-2);
}

app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT + '!')
})

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

    var promiseMinMax = new Promise(function (resolve, reject) {
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
                let maxField1 = result.feeds.reduce(function (a, b) {
                    console.log(a.field1 + "  " + b.field1)
                    return (a.field1 > b.field1) ? a : b;
                });
                console.log("MAX: ", maxField1);
                let minField1 = result.feeds.reduce(function (a, b) {
                    console.log(a.field1 + "  " + b.field1)
                    return (a.field1 < b.field1) ? a : b;
                });
                resolve({ "max_int_temp": maxField1, "min_int_field1": minField1 });
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


    Promise.all([promiseMinMax, promiseExt])
        .then(result => {
            console.log("RESULT :", result);
            res.json(result);
        })
        .catch(err => {
            console.err("ERRROR: ", err);
        });

});

app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT + '!')
})
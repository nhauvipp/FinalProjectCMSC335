const http = require("http");
const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { render } = require("ejs");
const axios = require("axios");


var portNumber = 5000;

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const name = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

const databaseAndCollection = {db: name, collection: collection};

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/check", (request, response) => {
    const variable = {
        weatherLink: `http://localhost:${portNumber}/check`,
        app: `http://localhost:${portNumber}`
    }
    response.render("weatherInfo", variable);
});

app.get("/apply", (request, response) => {
    const variable = {
        appLink: `http://localhost:${portNumber}/apply`,
        app: `http://localhost:${portNumber}`
    }
    response.render("application", variable);
});

app.get("/displayStudents", (request, response) => {
    const variable = {
        reviewLink: `http://localhost:${portNumber}/displayStudents`,
        app: `http://localhost:${portNumber}`
    }
    response.render("review", variable);
});


app.get("/adminRemove", (request, response) => {
    const variable = {
        removeLink: `http://localhost:${portNumber}/adminRemove`,
        app: `http://localhost:${portNumber}`
    }
    response.render("removeAllData", variable);
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/check", (request, response) => {
    const {weather} = request.body;



    const options = {
        method: 'GET',
        url: `https://aerisweather1.p.rapidapi.com/observations/${weather}`,
        headers: {
          'X-RapidAPI-Key': 'acce050167mshd6cb8d67e767270p10444bjsne52d7a4b7f40',
          'X-RapidAPI-Host': 'aerisweather1.p.rapidapi.com'
        }
      };
      
    axios.request(options).then(function (result) {
        const variable = {
            info: result.data.response.ob.weather,
            tempFa: result.data.response.ob.tempF,
            tempCe: result.data.response.ob.tempC,
            wind: result.data.response.ob.windSpeedMPH,
            humidity: result.data.response.ob.humidity,
            display: `http://localhost:${portNumber}`
        }
        response.render("weatherDisplay", variable);
    }).catch(function (error) {
        const variable = {
            info: "Data Not Found",
            tempFa: "Data Not Found",
            tempCe: "Data Not Found",
            wind: "Data Not Found",
            humidity: "Data Not Found",
            display: `http://localhost:${portNumber}`
        }
        response.render("weatherDisplay", variable);
    });

});

app.post("/apply", (request, response) => {
    let {name, email, group, backgroundInformation} = request.body;
    const variable = {
        name: name,
        email: email,
        group: group,
        background: backgroundInformation,
        display: `http://localhost:${portNumber}`
    };
    const { MongoClient, ServerApiVersion } = require('mongodb');
    async function main() {
        const uri = `mongodb+srv://${userName}:${password}@cluster0.dsvsuzn.mongodb.net/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

        try {
            await client.connect();
            let data1 = {name: name, email: email, group: group, background: backgroundInformation};
            await insertMovie(client, databaseAndCollection, data1);

        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }

    async function insertMovie(client, databaseAndCollection, newMovie) {
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newMovie);
    }
    main().catch(console.error);
    response.render("displayData", variable);
});


app.post("/displayStudents", (request, response) => {
    const {group} = request.body;
    const { MongoClient, ServerApiVersion } = require('mongodb');
    async function main() {
        const uri = `mongodb+srv://${userName}:${password}@cluster0.dsvsuzn.mongodb.net/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
   
        try {
            await client.connect();
                    let data1 = group;
                    await lookUpMany(client, databaseAndCollection, data1);
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }

    async function lookUpMany(client, databaseAndCollection, gpa) {
        let filter = {group : { $eq: group}};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
    
        const result = await cursor.toArray();
        
        let table = "<table border = '1'>";
        table += "<tr><th>Name</th><th>Email</th></tr>";

        if (result.length != 0) {
            result.forEach(elem => {
                table += "<tr><td>" + elem.name + "</td><td>";
                table += elem.email + "</td></tr>";
            });
        }
        
        table += "</table>";
        const variable = {
            dataTable: table,
            display: `http://localhost:${portNumber}`
        };
        response.render("displayGPA", variable);
    }
    
    main().catch(console.error);
});

app.post("/adminRemove", (request, response) => {
    const { MongoClient, ServerApiVersion } = require('mongodb');
    async function main() {
        const uri = `mongodb+srv://${userName}:${password}@cluster0.dsvsuzn.mongodb.net/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

        try {
            await client.connect();
            const result = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .deleteMany({});
            const variable = {
                removed: result.deletedCount,
                display: `http://localhost:${portNumber}`
            };
            response.render("confirmRemove", variable);

        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }
    main().catch(console.error);
});

app.listen(portNumber);
console.log(`Web server is running at http://localhost:${portNumber}`);

process.stdin.setEncoding("utf8");

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
        console.log("Shutting down the server");
        process.exit(0);
    } else {
        console.log(`Invalid command: ${command}`);
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});
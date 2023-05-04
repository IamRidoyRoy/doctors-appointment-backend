const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

// middleWare 
app.use(cors());
app.use(express.json());


// Connect mongodb  
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piip8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Get data from mongoDb API 
async function run() {
    try {
        const appointmentCollection = client.db('doctors-appointment').collection('time-slots');
        app.get('/time-slots', async (req, res) => {
            const query = {};
            const options = await appointmentCollection.find(query).toArray();
            res.send(options);
        })
    } finally {

    }
}
run().catch(console.log);





// crteate a get api
app.get('/', async (req, res) => {
    res.send("The server is running!")
})

app.listen(port, () => console.log(`This is the server port ${port}`))
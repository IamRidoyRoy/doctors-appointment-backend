const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

const app = express();

// middleWare 
app.use(cors());
app.use(express.json());

// crteate a get api
app.get('/', async (req, res) => {
    res.send("The server is running!")
})

app.listen(port, () => console.log(`This is the server port ${port}`))
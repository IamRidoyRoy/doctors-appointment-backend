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
        const bookingsCollection = client.db('doctors-appointment').collection('bookings');

        // Use agregate to query mubtiple collection and merge data
        app.get('/time-slots', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentCollection.find(query).toArray();

            // get the booking of the provided date 
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            // Code Carefully! 
            options.forEach((option) => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);

                // give me slotd which is not in booked! 
                const remaingSlots = option.slots.filter((slot) => !bookedSlots.includes(slot))
                option.slots = remaingSlots;

            })
            res.send(options);
        })

        /*
        *** API naming conventions 
        * app.get('/bookings')
        * app.get('/bookings/:id')
        * app.post('/bookings')
        * app.patch('/bookings/:id')
        * app.delete('/bookings/:id')
        */

        // Post booking data 
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment,

            }
            console.log(query)
            const alreadyHaveAnAppointment = await bookingsCollection.find(query).toArray();
            if (alreadyHaveAnAppointment.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
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
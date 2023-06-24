const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

require("dotenv").config();
const app = express();

// middleWare
app.use(cors());
app.use(express.json());

// Connect mongodb
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piip8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verifyJWT
function verifyJWT(req, res, next) {
  console.log("Inside JWT", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized access!");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

// Get data from mongoDb API
async function run() {
  try {
    const appointmentCollection = client
      .db("doctors-appointment")
      .collection("time-slots");
    const bookingsCollection = client
      .db("doctors-appointment")
      .collection("bookings");
    const usersCollection = client
      .db("doctors-appointment")
      .collection("users");

    // Use agregate to query mubtiple collection and merge data
    app.get("/time-slots", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentCollection.find(query).toArray();

      // get the booking of the provided date
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      // Code Carefully!
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);

        // give me slotd which is not in booked!
        const remaingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remaingSlots;
      });
      res.send(options);
    });

    /*
     *** API naming conventions
     * app.get('/bookings')
     * app.get('/bookings/:id')
     * app.post('/bookings')
     * app.patch('/bookings/:id')
     * app.delete('/bookings/:id')
     */

    // API To get Bookings data
    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      // check jwt decoded
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // Post booking data
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment,
      };
      console.log(query);
      const alreadyHaveAnAppointment = await bookingsCollection
        .find(query)
        .toArray();
      if (alreadyHaveAnAppointment.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // Post user data
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // To get all users data
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // JWT
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      // if not find as a user
      res.status(403).send({ accessToken: "" });
    });
  } finally {
  }
}
run().catch(console.log);

// crteate a get api
app.get("/", async (req, res) => {
  res.send("The server is running!");
});

app.listen(port, () => console.log(`This is the server port ${port}`));

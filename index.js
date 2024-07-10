const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIP_SECRET_TOKEN);
const port = process.env.PORT || 5000;

//middlewars
app.use(cors());
app.use(express.json());

// Middlewar for verifying jwt token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.SECRETE_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hlokssy.mongodb.net/?retryWrites=true&w=majority`;
//  const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@main-shard-00-00-03xkr.mongodb.net:27017,main-shard-00-01-03xkr.mongodb.net:27017,main-shard-00-02-03xkr.mongodb.net:27017/main?ssl=true&replicaSet=Main-shard-0&authSource=admin&retryWrites=true`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //...//
    // JWT functionality handeling
    //...//
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRETE_ACCESS_TOKEN, {
        expiresIn: 604800,
      });
      res.send({ token });
    });

    // Different items collection in mongoDB...

    const menuCollection = client.db("bistroBoss").collection("menus");
    const reservationCollection = client
      .db("bistroBoss")
      .collection("reservations");
    const cartCollection = client.db("bistroBoss").collection("carts");
    const reviewCollection = client.db("bistroBoss").collection("reviews");
    const userCollection = client.db("bistroBoss").collection("users");
    const paymentCollection = client.db("bistroBoss").collection("payments");

    // Load all menu from database...

    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    // Add new  user to database...

    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //...//
    // User dashboard functionality handeling
    //...//

    //...//
    // Cart items functionality handeling
    //...//

    // Add any items to the cart...

    app.post("/cart", async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    app.post("/recommanded_item", async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    // Get menu items based on spacific user...

    app.get("/cart", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden access" });
      }

      const query = { userEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // Delete any menu from cart...

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // Add reservation of user...

    app.post("/reservation", async (req, res) => {
      const data = req.body;
      const result = await reservationCollection.insertOne(data);
      res.send(result);
    });

    // Find the specific reservation of user based on user email
    app.get("/reservation/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await reservationCollection.find(query).toArray();
      res.send(result);
    });

    // Delete any reservation
    app.delete("/reservation/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reservationCollection.deleteOne(query);
      res.send(result);
    });

    // Add Review in database
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    //...//
    // Admin dashboard functionality handeling
    //...//

    // Load all users from database...

    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // Add new item on database
    app.post("/menu", async (req, res) => {
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    });

    // Update item in Database
    app.patch("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upset: true };
      const updatedItem = req.body;
      const menu = {
        $set: {
          name: updatedItem.name,
          recipe: updatedItem.recipe,
          image: updatedItem.image,
          category: updatedItem.category,
          price: updatedItem.price,
        },
      };
      const result = await menuCollection.updateOne(filter, menu, options);
      res.send(result);
    });

    // Delete any menu from database
    app.delete("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });

    // Load logined user info from database
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // Set user role as Admin...

    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Stripe payment functionality...

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price*100;
      if (amount <= 0) {
        throw new Error('Invalid or missing price value');
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


    // Save Payment Info to the server
    app.post('/payment', async(req, res)=>{
      const payment = req.body;
      const insetResult = await paymentCollection.insertOne(payment);

      const query = {_id: { $in: payment.cartID.map(id => new ObjectId(id))}}
      const deleteResult = await cartCollection.deleteMany(query);

      res.send({insetResult, deleteResult});
    })

    // Get payment history based on specific user
    app.get('/payment/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email : email};
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Boss is Running");
});

app.listen(port, () => {
  console.log(`Boss is running on port ${port}`);
});

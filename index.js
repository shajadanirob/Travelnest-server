const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleWare
app.use(cors())
app.use(express.json())


console.log(process.env.DB_USER)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ul0jqdv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('travelnest').collection('services')
    const bookingsCollection = client.db('travelnest').collection('Bookings')

     // post services 
     app.post("/services", async (req, res) => {
        const services = req.body;
          console.log(services);
        const result = await servicesCollection.insertOne(services);
        console.log(result);
        res.send(result);
      });

    // services get
    app.get('/services',async (req,res) =>{
        const cursor = servicesCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })
// single service get
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
          _id: new ObjectId(id),
      };
      const result = await  servicesCollection.findOne(query);
      console.log(result);
      res.send(result);
  });

 






  // update service get
  app.get("/update/:id", async (req, res) => {
    const id = req.params.id;
    const query = {
        _id: new ObjectId(id),
    };
    const result = await servicesCollection.findOne(query);
    console.log(result);
    res.send(result);
});
// put updated
app.put("/update/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log("id", id, data);
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedProduct = req.body;
  const product = {
      $set: {
          userName: updatedProduct.userName,
          userEmail: updatedProduct.userEmail,
          ServiceName: updatedProduct.ServiceName,
          price: updatedProduct.price,
          servicesArea: updatedProduct.servicesArea,
          serviceDescription: updatedProduct.serviceDescription,
          image: updatedProduct.image
      },
  };

const result = await  servicesCollection.updateOne(
      filter,
      product,
      options
  );
  res.send(result);
});


// get delete service
app.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = {
      _id: new ObjectId(id),
  };
  const result = await servicesCollection.findOne(query);
  console.log(result);
  res.send(result);
});

// services delete
app.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;
  console.log('please delete', id)
  const query = { _id:new ObjectId (id) };
  const result = await servicesCollection.deleteOne(query);
  res.send(result)
})

// get bookings
app.get('/bookings', async (req, res) => {
  console.log(req.query.email);
  let query = {};
  if (req.query?.email) {
      query = { userEmail: req.query.email }
  }
  const result = await bookingsCollection.find(query).toArray();
  res.send(result);
})


// Post bookings
app.post('/bookings', async (req, res) => {
  const booking = req.body;
  console.log(booking);
  const result = await bookingsCollection.insertOne(booking);
  res.send(result);
});








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("TravelNest server is running");
});
app.listen(port, () => {
    console.log(`TravelNest server is running port ${port}`);
});

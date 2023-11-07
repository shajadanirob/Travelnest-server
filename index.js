const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleWare
app.use(cors({
 origin: ['http://localhost:5173'],
 credentials: true
}))
app.use(express.json())
app.use(cookieParser())


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

const logger = async(req,res,next) =>{
  console.log('called :',req.method, req.url)
  next()
}
const verifyToken = async(req,res,next) =>{
  const token = req.cookies?.token
  // console.log('value of token in middleware',token)
  if(!token){
    return res.status(401).send({message :'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
    // error
   
    if(err){
      // console.log(err)
    return res.status(401).send({message :'unauthorized'})

    }

    // if token is valid then it would be decoded
    console.log('value is the token',decode)
    req.user = decode
    next()
  })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const servicesCollection = client.db('travelnest').collection('services')
    const bookingsCollection = client.db('travelnest').collection('Bookings')
    const pendingsCollection = client.db('travelnest').collection('pendings')
    // auth api
    app.post('/jwt',async(req,res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1hr'})
      res
      .cookie('token', token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        
    })
      .send({success:true})
    })

    app.post('/logout',async(req,res) =>{
      const loggedUser = req.body;
      console.log('logged out',loggedUser)
      res.clearCookie('token',{maxAge:0}).send({success:true})
      
    })



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


app.get('/service/:userEmail', async (req, res) => {
  const userEmail = req.params.userEmail;
  const query = { userEmail: userEmail }
  const result = await servicesCollection.find(query).toArray();
  res.send(result)
})
 






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
app.get('/bookings',logger,verifyToken, async (req, res) => {
  // console.log(req.query.email);
  // console.log('tok tok token' , req.cookies.token)
  if(req.query.email !== req.user.email){
    return res.status(403).send({message :'forbidden access'})
  }
  
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


// get pendingWork
app.get('/pendings', async (req, res) => {
  // console.log(req.query.email);
  let query = {};
  if (req.query?.email) {
      query = { ServicesEmail: req.query.email }
  }
  const result = await pendingsCollection.find(query).toArray();
  res.send(result);
})

// app.get("/pendings/:id", async (req, res) => {
//   const id = req.params.id;
//   const query = {
//       _id: new ObjectId(id),
//   };
//   const result = await pendingsCollection.findOne(query);
//   console.log(result);
//   res.send(result);
// });



// pending fatch
app.patch('/pendings/:id', async(req,res) =>{
  const id = req.params.id
   const filter = {_id : new ObjectId(id)}
   const updatedBooking = req.body
   console.log(updatedBooking)
   const updateDoc = {
     $set: {
       status: updatedBooking.status
     },
   };
 const result = await pendingsCollection.updateOne(filter,updateDoc)
 res.send(result)
 })



// Post pendingWork
app.post('/pendings', async (req, res) => {
  const booking = req.body;
  console.log(booking);
  const result = await pendingsCollection.insertOne(booking);
  res.send(result);
});








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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

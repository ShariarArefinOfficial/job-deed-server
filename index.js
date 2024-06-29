const express = require('express');
const cors = require('cors');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;


const user=process.env.USER
const password=process.env.PASSWORD
const TOCKEN=process.env.ACCESS_TOKEN_SECRET

const corsOptions={
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    'https://job-project-61af0.web.app',
    "https://job-project-61af0.firebaseapp.com"
   
  ],
  credentials: true,
  optionSuccessStatus:200
}

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//Verify Jwt MiddleWare
const verifyTocken=async(req,res,next)=>{
  //console.log('middleman')
  const token=req.cookies?.Token;
  if(!token) return res.status(401).send({massage:"unauthorized"})
  if(token){
   jwt.verify(token,TOCKEN,(err,decoded)=>{
 
     if(err){
      return  res.status(401).send({massage:"unauthorized"})
     }
     console.log(decoded)
     req.user=decoded;
     next();
   })
  }
  
}





//console.log(process.env.NODE_ENV)


const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = `mongodb+srv://${user}:${password}@cluster0.uctmuu5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    //await client.connect();
    // Send a ping to confirm a successful connection
    const jobCollection=client.db('jobDb').collection('job');
    const applyJobCollection=client.db('jobDb').collection('applyJob');



//jwt Tocken
app.post('/jwt',async(req,res)=>{
  const user=req.body;
  const token=jwt.sign(user,TOCKEN,{
    expiresIn:'1d',
  })
  res.cookie('Token',token,{
    httpOnly: true,
    secure : process.env.NODE_ENV==='production' ,
    sameSite: process.env.NODE_ENV==='production'?'none':'strict'

  }).send({success:true})
})

//Clear token
app.get('/logOut',async(req,res)=>{
  res.clearCookie('Token',{
    httpOnly: true,
    secure : process.env.NODE_ENV==='production' ,
    sameSite: process.env.NODE_ENV==='production'?'none':'strict',
    maxAge:0,

  }).send({success:true})
})

















//Apply Job
app.get('/application/:email',verifyTocken,async(req,res)=>{

  const email = req.params.email;
  //console.log(email);
  const query = {BuyerEmail:email  }
    const result = await applyJobCollection.find(query).toArray();
    res.send(result);
})
app.get('/applyJob/:email/:category',verifyTocken,async(req,res)=>{

  const email = req.params.email;
  const category=req.params.category;

  //console.log(email,category);
  const query = {
                 category:category  }
    const result = await applyJobCollection.find(query).toArray();
    res.send(result);
})

app.get('/applyJob/:email',verifyTocken,async(req,res)=>{

  const email = req.params.email;
  //console.log(email);
  const query = {applicantEmail:email  }
    const result = await applyJobCollection.find(query).toArray();
    res.send(result);
})

app.patch('/applyJob/:id',async (req, res) => {
  const id=req.params.id;
  console.log(id)
  const status=req.body;
  const query = { _id: new ObjectId(id) }
  const updateDoc={
    $set:status,
  }
  const result=await applyJobCollection.updateOne(query,updateDoc);
  res.send(result)

}) 


app.get('/applyJob',async (req, res) => {
  const cursor = applyJobCollection.find();
  const result=await cursor.toArray();
  res.send(result);
}) 

app.post('/applyJob',async(req,res)=>{
  const newJob=req.body;
  //console.log(newJob);
  const result = await applyJobCollection.insertOne(newJob);
  res.send(result);
})
//=======End Job
    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      //console.log(id)
      const query = { _id: new ObjectId(id) }
      console.log(query)
      const result = await jobCollection.deleteOne(query);
      res.send(result);
  })
  app.put('/job/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const options = { upsert: true };
    const updatedJob = req.body;

    const craft = {
        $set: {
            // name: updatedCoffee.name,
            // category: updatedCoffee.quantity,
            // supplier: updatedCoffee.supplier,
            // taste: updatedCoffee.taste,
            // category: updatedCoffee.category,
            // details: updatedCoffee.details,
            // photo: updatedCoffee.photo
            name:updatedJob.name,
            category:updatedJob.category,
            subCategory:updatedJob.subCategory,
            salary:updatedJob.salary,
            applicant:updatedJob.applicant,
            postingDate:updatedJob.postingDate,
            closingDate:updatedJob.closingDate,
            type:updatedJob.type,
            username:updatedJob.username,
            email:updatedJob.email,
            description:updatedJob.description,
           
        }
    }

    const result = await jobCollection.updateOne(filter, craft, options);
    res.send(result);
})

app.get('/myJob/:email',verifyTocken,async(req,res)=>{
 const tockenEmail=req.user.userEmail
 //console.log(tockenEmail)
// console.log(token)
  const email = req.params.email;

  if(tockenEmail !== email){
    return res.status(403).send({massage:"Forbidden Access"}) 
  }
  //console.log(email);
  const query = {email:email  }
    const result = await jobCollection.find(query).toArray();
    res.send(result);
})

  app.get('/job/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await jobCollection.findOne(query);
    res.send(result);
})
app.get('/jobs-count',async (req, res) => {
  const cursor =await jobCollection.countDocuments();
 
  res.send({cursor});
})
app.get('/all-jobs',async (req, res) => {
  const page=parseInt(req.query.page)-1
  const size=parseInt(req.query.size)
  //const search=req.query.search
  // let query={
  //   name:{$regex:search,option:'i'},
  // }
  //if
  //console.log(page,size)
  const cursor = jobCollection.find();
  const result=await cursor.skip(page*size).limit(limit).toArray();
  res.send(result);
}) 
app.get('/jobs-str/:search',async(req,res)=>{

  const search = req.params.search;
  //console.log(search);
  const query = {name:{$regex:search,$options:'i'}  }
    const result = await jobCollection.find(query).toArray();
    res.send(result);
})
//app.get('/jobs/:search',)

    app.get('/jobs',async (req, res) => {
      const cursor = jobCollection.find();
      const result=await cursor.toArray();
      res.send(result);
    }) 

  app.post('/jobs',async(req,res)=>{
      const newJob=req.body;
     // console.log(newJob);
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
  })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Job Portal  server is running')
})

app.listen(port, () => {
    console.log(`Job Portal Server is running on port: ${port}`)
})
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;
const env = require('dotenv').config();

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello World!');
});


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.he28ix7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production" ? true : false,
};

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db("ProductHub").collection("users");
        const queryCollection = client.db("ProductHub").collection("queries");
        const recommendationCollection = client.db("ProductHub").collection("recommendations");


        // ---------------------- Authentication API -----------------------------

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.JWT_SECRET_TOKEN, { expiresIn: '1h' });
            res.cookie('token', token, cookieOptions).send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out:', user)
            res.clearCookie('token', { maxAge: 0, httpOnly: true, sameSite: "none", secure: true }).send({ success: true })
        });


        //---------------------- Users API -----------------------------

        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await userCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.json(result);
        });

        // ---------------------- Queries API -----------------------------

        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.findOne(query);
            res.send(result);
        });

        app.get('/queries', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await queryCollection.find(query).toArray();
            res.send(result);
        });

        app.put('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedQuery = req.body;

            const updateQuery = {
                $set: {
                    name: updatedQuery.name,
                    productName: updatedQuery.productName,
                    productBrand: updatedQuery.productBrand,
                    productPhoto: updatedQuery.productPhoto,
                    queryTitle: updatedQuery.queryTitle,
                    boycottReason: updatedQuery.boycottReason,
                },
            };

            const result = await queryCollection.updateOne(query, updateQuery, options);
            res.json(result);
        });

        app.post('/queries', async (req, res) => {
            const query = req.body;
            const result = await queryCollection.insertOne(query);
            res.json(result);
        });

        app.delete('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.deleteOne(query);
            res.json(result);
        });

        // ---------------------- Recommendations API -----------------------------

        app.get('/recommendations/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendationCollection.findOne(query);
            res.send(result);
        });

        app.get('/recommendations', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await recommendationCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/recommendations', async (req, res) => {
            const recommendation = req.body;
            const result = await recommendationCollection.insertOne(recommendation);
            res.json(result);
        });

        app.delete('/recommendations/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendationCollection.deleteOne(query);
            res.json(result);
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

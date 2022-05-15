const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.user}:${process.env.password}@nth.s4qce.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const subjectsCollection = client.db('NTH').collection('Subjects');
        const studentsCollection = client.db('NTH').collection('Students');
        const subWAccCollection = client.db('NTH').collection('SubWAcc');
        const noticeCollection = client.db('NTH').collection('Notice');

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        app.get('/subjects', verifyJWT, async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            console.log(className, batch, group);
            const query = { className: className, batch: batch, group: group };
            const cursor = subjectsCollection.find(query);
            const subjects = await cursor.toArray();
            res.send(subjects);
        })

        app.get('/subWAcc', verifyJWT, async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const subject = req.query.subject;
            console.log(className, batch, group);
            const query = {
                className: className, batch: batch, group: group, subjectCode: subject
            };
            const cursor = subWAccCollection.find(query);
            const subjectVids = await cursor.toArray();
            res.send(subjectVids);
        })

        app.get('/students', verifyJWT, async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const email = req.query.email;
            console.log(className, batch, group, email);
            if (email === undefined || email === '') {
                const query = {
                    className: className, batch: batch, group: group
                };
                const cursor = studentsCollection.find(query);
                const students = await cursor.toArray();
                res.send(students);
            }
            else {
                const query = {
                    email: email
                };
                const cursor = studentsCollection.find(query);
                const students = await cursor.toArray();
                res.send(students);
            }
        })

        app.get('/notice', verifyJWT, async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            console.log(className, batch, group);
            const query = { className: className, batch: batch, group: group };
            const cursor = noticeCollection.find(query);
            const subjects = await cursor.toArray();
            res.send(subjects);
        })

        app.get('/notice/admin', verifyJWT, async (req, res) => {
            const cursor = noticeCollection.find();
            const notice = await cursor.toArray();
            res.send(notice);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await studentsCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        // app.put('/students/:id', async(req, res) =>{
        //     const id = req.params.id;
        //     const updatedUser = req.body;
        //     const filter = {_id: ObjectId(id)};
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             name: updatedUser.name,
        //             father: updatedUser.father,
        //             mother: updatedUser.mother,
        //             className: updatedUser.className,
        //             batch: updatedUser.batch,
        //             group: updatedUser.group,
        //         }
        //     };
        //     const result = await studentsCollection.updateOne(filter, updatedDoc, options);
        //     res.send(result);

        // })

        app.put('/students/:email', async (req, res) => {
            const email = req.params.email;
            const updatedUser = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updatedUser.name,
                    father: updatedUser.father,
                    mother: updatedUser.mother,
                    className: updatedUser.className,
                    batch: updatedUser.batch,
                    group: updatedUser.group,
                }
            };
            const result = await studentsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        app.put('/students/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await studentsCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await studentsCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        })

        app.post('/students', async (req, res) => {
            const student = req.body;
            const query = { name: student.name, father: student.father, mother: student.mother, className: student.className, id: student.id, batch: student.batch, group: student.group };
            const exists = await studentsCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, student: exists })
            }
            const result = await studentsCollection.insertOne(student);
            res.send({ success: true, result });
        })

        app.post('/subWAcc', async (req, res) => {
            const item = req.body;
            const query = { videoUrl: item.videoUrl };
            const exists = await subWAccCollection.findOne(query);
            if (exists) {
                // return res.send({ success: false, item: exists })
            }
            const result = await subWAccCollection.insertOne(item);
            res.send({ success: true, result });
        })

        app.post('/notice', async (req, res) => {
            const notice = req.body;
            const result = await noticeCollection.insertOne(notice);
            res.send(result);
        })

        app.delete('/notice', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            console.log(className, batch, group);
            const query = { className: className, batch: batch, group: group };
            const result = await noticeCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/students', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const name = req.query.name;
            const father = req.query.father;
            const mother = req.query.mother;
            const email = req.query.email
            console.log(className, batch, group, name, father, mother, email);
            const query = { className: className, batch: batch, group: group, name: name, father: father, mother: mother, email: email };
            const result = await studentsCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server connected')
})

app.listen(port, () => {
    console.log(`Listening from ${process.env.user}`)
})
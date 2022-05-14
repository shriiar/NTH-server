const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.user}:${process.env.password}@nth.s4qce.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const subjectsCollection = client.db('NTH').collection('Subjects');
        const studentsCollection = client.db('NTH').collection('Students');
        const subWAccCollection = client.db('NTH').collection('SubWAcc');

        app.get('/subjects', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            console.log(className, batch, group);
            const query = { className: className, batch: batch, group: group };
            const cursor = subjectsCollection.find(query);
            const subjects = await cursor.toArray();
            res.send(subjects);
        })

        app.get('/subWAcc', async (req, res) => {
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

        app.get('/students', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            console.log(className, batch, group);
            const query = {
                className: className, batch: batch, group: group
            };
            const cursor = studentsCollection.find(query);
            const students = await cursor.toArray();
            res.send(students);
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

            // const newCar = req.body;
            // const result = await carsCollection.insertOne(newCar);
            // res.send(result);
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

            // const newCar = req.body;
            // const result = await carsCollection.insertOne(newCar);
            // res.send(result);
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
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const examsCollection = client.db('NTH').collection('Exams');
        const resultsCollection = client.db('NTH').collection('Results');

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
            // console.log(className, batch, group);
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
            console.log(className, batch, group, subject);
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
            const date = req.query.date;
            // console.log(className, batch, group, date);
            const query = { className: className, batch: batch, group: group, date: date };
            const cursor = noticeCollection.find(query);
            const subjects = await cursor.toArray();
            res.send(subjects);
        })

        app.get('/exams', verifyJWT, async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const date = req.query.date;
            // console.log(className, batch, group, date);
            const query = { className: className, batch: batch, group: group, date: date };
            const cursor = examsCollection.find(query);
            const exam = await cursor.toArray();
            res.send(exam);
        })

        app.get('/results', verifyJWT, async (req, res) => {
            const subject = req.query.subject;
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const email = req.query.email;
            // console.log(className, batch, group, email, subject);
            const query = { className: className, batch: batch, group: group, email: email, subjectCode: subject };
            const cursor = resultsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/notice/admin', verifyJWT, async (req, res) => {
            const cursor = noticeCollection.find();
            const notice = await cursor.toArray();
            res.send(notice);
        })

        app.get('/students/admin', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log(email);
            const query = { email: email }
            const cursor = studentsCollection.find(query);
            const student = await cursor.toArray();
            res.send(student);
        })

        app.get('/exams/admin', verifyJWT, async (req, res) => {
            const cursor = examsCollection.find();
            const exams = await cursor.toArray();
            res.send(exams);
        })

        app.get('/results/admin', verifyJWT, async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const subject = req.query.subject;
            // console.log(className, batch, group, subject);
            const query = { className: className, batch: batch, group: group, subjectCode: subject };
            const cursor = resultsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await studentsCollection.findOne({ email: email });
            const isAdmin = user?.role === 'admin';
            res.send({ admin: isAdmin })
        })

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
                    img: updatedUser.img,
                    paid: updatedUser.paid,
                    lastPaid: updatedUser.lastPaid,
                    due: updatedUser.due,
                    payMonth: updatedUser.payMonth,
                    payYear: updatedUser.payYear
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
            const query = { name: student.name, father: student.father, mother: student.mother, className: student.className, id: student.id, batch: student.batch, group: student.group, paid: student.paid, lastPaid: student.lastPaid };
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

        app.post('/results', async (req, res) => {
            const result = req.body;
            const resultSend = await resultsCollection.insertOne(result);
            res.send(resultSend);
        })

        app.post('/exams', async (req, res) => {
            const exams = req.body;
            const result = await examsCollection.insertOne(exams);
            res.send(result);
        })

        app.delete('/notice', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            // console.log(className, batch, group);
            const query = { className: className, batch: batch, group: group };
            const result = await noticeCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/exams', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const name = req.query.name;
            const topic = req.query.topic;
            // console.log(className, batch, group, name, topic);
            const query = { className: className, batch: batch, group: group, name: name, topic: topic };
            const result = await examsCollection.deleteOne(query);
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
            // console.log(className, batch, group, name, father, mother, email);
            const query = { className: className, batch: batch, group: group, name: name, father: father, mother: mother, email: email };
            const result = await studentsCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/results', async (req, res) => {
            const className = req.query.className;
            const batch = req.query.batch;
            const group = req.query.group;
            const subject = req.query.subject;
            const topic = req.query.topic;
            const id = req.query.id
            // console.log(className, batch, group, subject, topic, id);
            const query = { className: className, batch: batch, group: group, subject: subject, topic: topic };
            const result = await resultsCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/subWAcc', async (req, res) => {
            const _id = req.query.id;
            const result = await subWAccCollection.deleteOne({ "_id": ObjectId(_id) });
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
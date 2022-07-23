const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// SSL
const SSLCommerzPayment = require("sslcommerz-lts");
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/ssl-request', async (req, res) => {

	/** 
	* Create ssl session request 
	*/

	const data = {
		total_amount: 100,
		currency: 'BDT',
		tran_id: 'REF123',
		success_url: `${process.env.ROOT}/ssl-payment-success`,
		fail_url: `${process.env.ROOT}/ssl-payment-fail`,
		cancel_url: `${process.env.ROOT}/ssl-payment-cancel`,
		ipn_url: `${process.env.ROOT}/ssl-payment-notification`,
		shipping_method: 'No',
		product_name: 'Computer.',
		product_category: 'Electronic',
		product_profile: 'general',
		cus_name: 'Customer Name',
		cus_email: 'cust@yahoo.com',
		cus_add1: 'Dhaka',
		cus_add2: 'Dhaka',
		cus_city: 'Dhaka',
		cus_state: 'Dhaka',
		cus_postcode: '1000',
		cus_country: 'Bangladesh',
		cus_phone: '01711111111',
		cus_fax: '01711111111',
		multi_card_name: 'mastercard',
		value_a: 'ref001_A',
		value_b: 'ref002_B',
		value_c: 'ref003_C',
		value_d: 'ref004_D',
	};

	const sslcommerz = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD, false)
	sslcommerz.init(data).then(data => {

		//process the response that got from sslcommerz 
		//https://developer.sslcommerz.com/doc/v4/#returned-parameters

		if (data?.GatewayPageURL) {
			return res.status(200).redirect(data?.GatewayPageURL);
		}
		else {
			return res.status(400).json({
				message: "Session was not successful"
			});
		}
	});

});

app.post("/ssl-payment-notification", async (req, res) => {

	/** 
	* If payment notification
	*/

	return res.status(200).json(
		{
			data: req.body,
			message: 'Payment notification'
		}
	);
})

app.post("/ssl-payment-success", async (req, res) => {

	/** 
	* If payment successful 
	*/

	return res.status(200).json(
		{
			data: req.body,
			message: 'Payment success'
		}
	);
})

app.post("/ssl-payment-fail", async (req, res) => {

	/** 
	* If payment failed 
	*/

	return res.status(200).json(
		{
			data: req.body,
			message: 'Payment failed'
		}
	);
})

app.post("/ssl-payment-cancel", async (req, res) => {

	/** 
	* If payment cancelled 
	*/

	return res.status(200).json(
		{
			data: req.body,
			message: 'Payment cancelled'
		}
	);
})


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
		// console.log('decoded', decoded);
		req.decoded = decoded;
		next();
	})
}

async function run() {
	try {
		await client.connect();
		const subjectsCollection = client.db('NTH').collection('Subjects');
		const studentsCollection = client.db('NTH').collection('Students');
		const studentIDCollection = client.db('NTH').collection('StudentID');
		const subWAccCollection = client.db('NTH').collection('SubWAcc');
		const noticeCollection = client.db('NTH').collection('Notice');
		const examsCollection = client.db('NTH').collection('Exams');
		const resultsCollection = client.db('NTH').collection('Results');
		const ImgCollection = client.db('NTH').collection('SubImg');
		const HomeImgCollection = client.db('NTH').collection('HomeImg');
		const PinnedPostsCollection = client.db('NTH').collection('PinnedPost');

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
			// console.log(className, batch, group, subject);
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
			// console.log(className, batch, group);
			const query = { className: className, batch: batch, group: group };
			const cursor = noticeCollection.find(query);
			const subjects = await cursor.toArray();
			res.send(subjects);
		})

		app.get('/myNotice', verifyJWT, async (req, res) => {
			const _id = req.query._id;
			console.log(_id);
			const cursor = noticeCollection.find({ "_id": ObjectId(_id) });
			const notice = await cursor.toArray();
			res.send(notice);
		})

		app.get('/exams', verifyJWT, async (req, res) => {
			const className = req.query.className;
			const batch = req.query.batch;
			const group = req.query.group;
			const date = req.query.date;
			console.log(className, batch, group, date);
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

		app.get('/resultsOfAll', verifyJWT, async (req, res) => {
			const email = req.query.email;
			// console.log(className, batch, group, email, subject);
			const query = { email: email };
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

		app.get('/admin/:email', verifyJWT, async (req, res) => {
			const email = req.params.email;
			const user = await studentsCollection.findOne({ email: email });
			const isAdmin = user?.role === 'admin';
			res.send({ admin: isAdmin })
		})

		app.get('/subimg', verifyJWT, async (req, res) => {
			const query = {};
			const cursor = ImgCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		})

		app.get('/updateResult/:_id', verifyJWT, async (req, res) => {
			const _id = req.params._id;
			// console.log("_id", _id);
			const cursor = resultsCollection.find({ "_id": ObjectId(_id) });
			const result = await cursor.toArray();
			res.send(result);
		})

		app.get('/studentID', verifyJWT, async (req, res) => {
			const cursor = studentIDCollection.find({});
			const result = await cursor.toArray();
			res.send(result);
		})

		app.get('/images', async (req, res) => {
			const cursor = HomeImgCollection.find({});
			const result = await cursor.toArray();
			res.send(result);
		})

		app.get('/pinnedPosts', async (req, res) => {
			const cursor = PinnedPostsCollection.find({});
			const result = await cursor.toArray();
			res.send(result);
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

		app.put('/updateResult/:_id', async (req, res) => {
			const _id = req.params._id;
			console.log("_id", _id);
			const updatedResult = req.body;
			const filter = { _id: ObjectId(_id) };
			console.log(filter);
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					name: updatedResult.name,
					mark: updatedResult.mark,
					batch: updatedResult.batch,
					className: updatedResult.className,
					date: updatedResult.date,
					email: updatedResult.email,
					fmark: updatedResult.fmark,
					group: updatedResult.group,
					highest: updatedResult.highest,
					subject: updatedResult.subject,
					subjectCode: updatedResult.subjectCode,
					topic: updatedResult.topic,
					attendance: updatedResult.attendance
				}
			};
			const result = await resultsCollection.updateOne(filter, updateDoc, options);
			res.send(result);
		})

		app.put('/updateHighest', async (req, res) => {
			const className = req.query.className;
			const batch = req.query.batch;
			const group = req.query.group;
			const subjectCode = req.query.subjectCode;
			const date = req.query.date;
			const updatedHighest = req.body;
			const filter = { className: className, batch: batch, group: group, subjectCode: subjectCode, date: date };
			console.log(filter);
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					highest: updatedHighest.highest,
				}
			};
			const result = await resultsCollection.updateMany(filter, updateDoc, options);
			res.send(result);
		})

		app.put('/studentID', async (req, res) => {
			const nameID = req.body;
			const query = { nameID: nameID.nameID };
			const exists = await studentIDCollection.findOne(query);
			console.log(nameID, exists);
			if (exists) {
				return res.send({ success: false, nameID: exists })
			}
			const result = await studentIDCollection.insertOne(nameID);
			res.send({ success: true, result });
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

		app.post('/images', async (req, res) => {
			const img = req.body;
			const result = await HomeImgCollection.insertOne(img);
			res.send(result);
		})

		app.post('/exams', async (req, res) => {
			const exams = req.body;
			const result = await examsCollection.insertOne(exams);
			res.send(result);
		})

		app.post('/pinnedPosts', async (req, res) => {
			const post = req.body;
			const result = await PinnedPostsCollection.insertOne(post);
			res.send(result);
		})

		app.delete('/notice', async (req, res) => {
			const _id = req.query.id;
			const result = await noticeCollection.deleteOne({ "_id": ObjectId(_id) });
			res.send(result);
		})

		app.delete('/exams', async (req, res) => {
			const _id = req.query.id;
			const result = await examsCollection.deleteOne({ "_id": ObjectId(_id) });
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
			const _id = req.query.id;
			console.log(_id);
			const result = await resultsCollection.deleteOne({ "_id": ObjectId(_id) });
			res.send(result);
		})

		app.delete('/subWAcc', async (req, res) => {
			const _id = req.query.id;
			const result = await subWAccCollection.deleteOne({ "_id": ObjectId(_id) });
			res.send(result);
		})

		app.delete('/studentID', async (req, res) => {
			const _id = req.query.id;
			console.log(_id);
			const result = await studentIDCollection.deleteOne({ "_id": ObjectId(_id) });
			res.send(result);
		})

		app.delete('/images', async (req, res) => {
			const _id = req.query.id;
			console.log(_id);
			const result = await HomeImgCollection.deleteOne({ "_id": ObjectId(_id) });
			res.send(result);
		})

		app.delete('/pinnedPosts', async (req, res) => {
			const _id = req.query.id;
			console.log(_id);
			const result = await PinnedPostsCollection.deleteOne({ "_id": ObjectId(_id) });
			res.send(result);
		})

		// SSL Payment

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

// app.listen(process.env.PORT, () => {
// 	console.log(`Listening from SSL`)
// })
const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const ejsMate = require('ejs-mate');
const mysql = require('mysql2');
const { faker, vi } = require('@faker-js/faker');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Poorvikagj21',
    database: 'project'
});

// // USER TABLE DATA INSERTION

// let getRandomuser = () => {
//     return {
//         userId: faker.string.uuid(),
//         username: faker.internet.username(), // before version 9.1.0, use userName()
//         email: faker.internet.email(),
//         password: faker.internet.password(),
//         avatar: faker.image.avatar(),
//     }
// }

// let data=[];
// for(let i=0;i<50;i++){
//     let user=getRandomuser();
//     data.push([user.userId,user.username,user.email,user.password,user.avatar]);
// }

// let q="INSERT INTO USER VALUES ?";

// connection.query(q, [data], (err, result) => {
//     if (err) {
//         console.log("Error inserting data:", err);
//     } else {
//         console.log("Data inserted successfully!");
//         console.log(result);
//     }
//     connection.end();
// });


// TEACHER DATA INSERTION
// courses = [
//     "Data Science",
//     "Machine Learning",
//     "Artificial Intelligence",
//     "Web Development",
//     "Blockchain",
//     "Cybersecurity",
//     "Cloud Computing",
//     "DevOps",
//     "Mobile App Development",
//     "Database Systems",
//     "UI/UX Design",
//     "Software Engineering",
//     "Big Data",
//     "NLP (Natural Language Processing)",
//     "Game Development",
//     "Computer Vision",
//     "Internet of Things (IoT)",
//     "Robotics",
//     "Quantum Computing",
//     "Augmented & Virtual Reality",
// ];
// bios = [
//     "Passionate about turning complex data into meaningful insights using Python, pandas, and SQL. Loves teaching real-world data applications.",
//     "Experienced ML developer focused on building predictive models and intelligent systems using scikit-learn and TensorFlow.",
//     "AI educator specializing in neural networks, natural language processing, and ethical AI development.",
//     "Full-stack web developer teaching MERN stack, RESTful APIs, and frontend frameworks like React and Vue.",
//     "Blockchain developer passionate about smart contracts, Ethereum, and decentralized applications.",
//     "Security analyst skilled in ethical hacking and system hardening. Trains students in protecting digital assets.",
//     "Cloud architect with deep knowledge of AWS and GCP. Loves teaching cloud infrastructure and DevOps practices.",
//     "DevOps engineer focused on automation, CI/CD pipelines, Docker, and Kubernetes.",
//     "App developer skilled in Flutter and Android development. Helps students launch their first mobile app.",
//     "Database expert experienced with MySQL, PostgreSQL, and MongoDB. Enjoys teaching relational and NoSQL design.",
//     "Creative UI/UX designer helping students build intuitive and accessible digital products using Figma and user research.",
//     "Software engineer with a focus on system design, OOP, and agile development methodologies.",
//     "Big data specialist working with Hadoop, Spark, and large-scale distributed systems.",
//     "NLP researcher focused on chatbots, sentiment analysis, and large language models.",
//     "Game developer with expertise in Unity and C#. Teaches game physics, mechanics, and design principles.",
//     "Computer vision engineer working on facial recognition and object detection with OpenCV and PyTorch.",
//     "IoT innovator building smart devices and teaching embedded systems and MQTT protocols.",
//     "Robotics engineer passionate about automation, sensors, and microcontrollers like Arduino and Raspberry Pi.",
//     "Quantum computing researcher exploring Qiskit and quantum algorithms. Loves making tough concepts simple.",
//     "AR/VR creator focused on immersive environments using Unity and Unreal Engine. Guides students in creating 3D experiences."
// ];

// let getRandomTeacher = (num) => {
//     return [
//         faker.string.uuid(),
//         faker.internet.username(), // before version 9.1.0, use userName()
//         faker.internet.email(),
//         bios[num],
//         faker.internet.password(),
//         courses[num],
//     ];
// };
// let data = [];
// for (let i = 0; i < 20; i++) {
//     data.push(getRandomTeacher(i));
// }
// let q = "INSERT INTO TEACHER(TID, TNAME, EMAIL,BIO,PASS,SPECIAL) values ?";

// try {
//     connection.query(q, [data], (err, result) => {
//         if (err) throw err;
//     });
// } catch (err) {
//     res.send("Some error occoured");
// }

// DATA FOR COURSE TABLE

// const courses = [
//     {
//         title: "Introduction to Data Science",
//         descrip: "Learn how to analyze data, visualize patterns, and make predictions using Python and Pandas.",
//         video: 12,
//         imgLink: "https://www.fsm.ac.in/blog/wp-content/uploads/2022/07/FUqHEVVUsAAbZB0-1024x580.jpg",
//         vidLink: "https://youtu.be/ua-CiDNNj30?si=ikcNkHx4jgX2lNtr"
//     },
//     {
//         title: "Machine Learning A-Z",
//         descrip: "From linear regression to deep learning, get hands-on with real machine learning projects.",
//         video: 25,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWBYtT0HRhb5qKGRzNSL5Bxzt0BEuEBlNYUw&s",
//         vidLink: "https://youtu.be/_8QQsloyheY?si=ocsPyH-CSkCCQESy"
//     },
//     {
//         title: "Web Development with MERN",
//         descrip: "Build full-stack web apps using MongoDB, Express, React, and Node.js.",
//         video: 30,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOAtzhPhuuHGBFDyiKn4HoT48XHvtgEUK4Lg&s",
//         vidLink: "https://youtu.be/Vi9bxu-M-ag?si=kFRnHqXUFu-2y41R"
//     },
//     {
//         title: "Fundamentals of Blockchain",
//         descrip: "Understand how blockchain works, Ethereum, smart contracts, and DApps.",
//         video: 15,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg3w-9y6xj2yRK1uGxiDQc2nVNaX8hk55R0g&s",
//         vidLink: "https://www.youtube.com/live/3fUZENyWpB0?si=QzvNvQl3_4t2OInN"
//     },
//     {
//         title: "Cybersecurity Essentials",
//         descrip: "Protect digital systems and learn ethical hacking, firewalls, and threat analysis.",
//         video: 20,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX9GCZv2yTguUOpseXmjD3Ap-gD3iZcaYXnQ&s",
//         vidLink: "https://www.youtube.com/live/1EVjVXLD5eM?si=ktPa4fB7OZVQQol0"
//     },
//     {
//         title: "Cloud Computing with AWS",
//         descrip: "Master AWS services like EC2, S3, Lambda, and deploy scalable applications.",
//         video: 18,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR12nPY60wXMYF9CwroNFdR7NyWvlXeBYFZMA&s",
//         vidLink: "https://www.youtube.com/live/yAPckJzaG7Y?si=xWomcgaY4eZ2JpbJ"
//     },
//     {
//         title: "DevOps for Beginners",
//         descrip: "Get started with CI/CD pipelines, Docker, Kubernetes, and infrastructure as code.",
//         video: 22,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpV4jTz04zYYmoYct0Y9sYoiPP9_U52RSk0w&s",
//         vidLink: "https://youtu.be/hQcFE0RD0cQ?si=jvaS3e7uhzhQuWnq"
//     },
//     {
//         title: "Mobile App Development with Flutter",
//         descrip: "Create beautiful cross-platform apps using Flutter and Dart.",
//         video: 16,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLXxnxUe7IfBCS8FVMQLCGk3S2LtwaXjVblQ&s",
//         vidLink: "https://youtu.be/8sAyPDLorek?si=LukLN7Db00tuevGf"
//     },
//     {
//         title: "Database Design & Management",
//         descrip: "Learn to model, design, and manage SQL and NoSQL databases effectively.",
//         video: 14,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyfqUpnNf_dvnLsshajIVmUwGjU5WZYPScZg&s",
//         vidLink: "https://youtu.be/6V4miYuD4lA?si=08b9H8Yfu1VVtKhr"
//     },
//     {
//         title: "UI/UX Design Principles",
//         descrip: "Design user-centric interfaces using Figma, wireframes, and usability testing.",
//         video: 10,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtf-WvRhy6SDyOYGkh7EFXMqwhrKLPjGyfHg&s",
//         vidLink: "https://youtu.be/9UpJTsMQ68Y?si=SyG1tfNUqTfw34g0"
//     },
//     {
//         title: "Software Engineering Fundamentals",
//         descrip: "Understand software life cycles, OOP, testing, and agile development.",
//         video: 20,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfe_rBZ-p6URS5Qa2_5wACIGuK969kzBDJ5Q&s",
//         vidLink: "https://youtu.be/sB2iQSvrcG0?si=CutQ-n3hhv2ApfeI"
//     },
//     {
//         title: "Big Data Analytics",
//         descrip: "Work with Hadoop, Spark, and real-time analytics pipelines.",
//         video: 17,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw4B68CtfKGtFwbxNDHtJFexCRQyu_I1fkIw&s",
//         vidLink: "https://www.youtube.com/live/yTq2qc_eaTk?si=Up6RuhNWG3a-eQOj"
//     },
//     {
//         title: "Natural Language Processing",
//         descrip: "Explore sentiment analysis, chatbots, and text classification using NLP techniques.",
//         video: 13,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQon17tf5OsgYvFOwytREJ58wc-h0xvTmlT3A&s",
//         vidLink: "https://youtu.be/ENLEjGozrio?si=-IyqIXzafhsDKLB6"
//     },
//     {
//         title: "Game Development with Unity",
//         descrip: "Build engaging 2D and 3D games with Unity and C# scripting.",
//         video: 21,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNBBeum3Dj1JrnEgXAXFBLg583MVIqyX5WSg&s",
//         vidLink: "https://youtu.be/gB1F9G0JXOo?si=hCSdmN6iXLkXzVzA"
//     },
//     {
//         title: "Computer Vision Basics",
//         descrip: "Learn object detection, image processing, and OpenCV tools.",
//         video: 19,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD0-3ngS5YxzOvqsQR49sUy8_iEvFvlM-J1g&s",
//         vidLink: "https://youtu.be/qT28sMnX2F4?si=cqByqhtFA7hiryZ_"
//     },
//     {
//         title: "IoT and Embedded Systems",
//         descrip: "Build smart devices and learn how IoT works using sensors and microcontrollers.",
//         video: 11,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUcWx3POUIbi7JciXRSiu7FHG1NVauOWpMwA&s",
//         vidLink: "https://www.youtube.com/live/mKOzmwAD5mQ?si=B8YvGlXI7tbteY8J"
//     },
//     {
//         title: "Robotics with Arduino",
//         descrip: "Control motors, sensors, and build robots using Arduino boards.",
//         video: 13,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7D5Ii8AgDUjO2rTrhCl6gZr8RmmZfr_op2w&s",
//         vidLink: "https://youtu.be/BjzaKMvR8s0?si=F3zxttj9fHeneE7O"
//     },
//     {
//         title: "Quantum Computing Basics",
//         descrip: "Dive into Qiskit, quantum gates, and fundamental quantum algorithms.",
//         video: 9,
//         imgLink: "https://cdn.publish0x.com/prod/fs/images/3c623ecf13c7e64f53b56ff1bafdf115e9453842b952fec9d42507e19260309e.png",
//         vidLink: "https://example.com/videos/quantum"
//     },
//     {
//         title: "Augmented Reality Development",
//         descrip: "Create immersive AR experiences with Unity and ARCore/ARKit.",
//         video: 14,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAJOirgW3JElCmvdDprRMRz86d1dPZJ_woLw&s",
//         vidLink: "https://youtu.be/WzfDo2Wpxks?si=H0eUcSEn_krJXCqF"
//     },
//     {
//         title: "Full Stack JavaScript Bootcamp",
//         descrip: "Become a full stack developer with JavaScript, Node.js, and frontend frameworks.",
//         video: 28,
//         imgLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQj04F5QC-2S6nLmbf32H6eIg3lWIqm4IuMWA&s",
//         vidLink: "https://youtu.be/zJSY8tbf_ys?si=4jFHKHojQn3baTy1"
//     }];
// connection.query("SELECT TID FROM TEACHER", (err, results) => {
//     if (err) throw err;

//     const tids = results.map(row => row.TID);
//     if (tids.length === 0) {
//         return res.status(400).send("No teacher IDs found. Insert teachers first.");
//     }

//     const courseValues = courses.map(course => [
//         faker.string.uuid(),           // CID
//         course.title,
//         course.descrip,
//         course.video,
//         faker.helpers.arrayElement(tids),  // Random TID from database
//         course.imgLink,
//         course.vidLink
//     ]);

//     const query = `
//             INSERT INTO COURSE (CID, TITLE, DESCRIP, VIDEO, TID, IMGLINK, VIDLINK)
//             VALUES ?
//         `;

//     connection.query(query, [courseValues], (err, result) => {
//         if (err) throw err;
//         console.log("Courses inserted!");
//         // res.send("Courses inserted successfully.");
//     });
// });

// // DATA FOR ENROLLMENT TABLE

// connection.query("SELECT CID, USERID FROM COURSE, USER", (err, results) => {
//     if (err) throw err;

//     const cids = results.map(row => row.CID);
//     const uids = results.map(row => row.USERID);

//     if (cids.length === 0) {
//         return res.status(400).send("No Course IDs found. Insert courses first.");
//     }
//     if (uids.length === 0) {
//         return res.status(400).send("No User IDs found. Insert users first.");
//     }

//     const enrollments = [];
//     for (let i = 0; i < 100; i++) {
//         enrollments.push([
//             faker.string.uuid(),
//             faker.helpers.arrayElement(uids),
//             faker.helpers.arrayElement(cids),
//         ]);
//     }

//     const query = `
//             INSERT INTO ENROLLMENT (EID, USERID, CID)
//             VALUES ?
//         `;

//     connection.query(query, [enrollments], (err, result) => {
//         if (err) throw err;
//         console.log("100 enrollments inserted!");
//     });
// });



app.listen(port, () => {
    console.log(`Server is listening to port : ${port}`);
})
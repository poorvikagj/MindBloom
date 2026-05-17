const pool = require('../config/database');

const teacherSeed = [
    ['teacher-frontend', 'Ava Patel', 'ava@mindbloom.test', 'Front-end engineer focused on practical UI systems and responsive design.', 'teacher123', 'Web Development'],
    ['teacher-data', 'Noah Chen', 'noah@mindbloom.test', 'Data analyst who teaches SQL, dashboards, and applied analytics.', 'teacher123', 'Data Science'],
    ['teacher-cloud', 'Mia Johnson', 'mia@mindbloom.test', 'Cloud architect helping students learn infrastructure, deployment, and DevOps.', 'teacher123', 'Cloud Computing'],
    ['teacher-ai', 'Ethan Brooks', 'ethan@mindbloom.test', 'AI educator covering machine learning, NLP, and model evaluation.', 'teacher123', 'Artificial Intelligence']
];

const courseSeed = [
    ['course-react', 'Modern React Essentials', 'Build fast, component-driven interfaces with React, hooks, and reusable patterns.', 24, 'teacher-frontend', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=Ke90Tje7VS0'],
    ['course-sql', 'SQL for Analytics', 'Learn to query, filter, aggregate, and model data for real reporting scenarios.', 18, 'teacher-data', 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=7S_tz1z_5bA'],
    ['course-cloud', 'Cloud Deployment Basics', 'Understand containerized deployment, service configuration, and production readiness.', 20, 'teacher-cloud', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=3hLmDS179YE'],
    ['course-ml', 'Machine Learning Foundations', 'Start with core ML concepts, training workflows, and evaluation methods.', 22, 'teacher-ai', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=GwIo3gDZCVQ']
];

const userSeed = [
    ['user-student', 'Daniel Kim', 'daniel@mindbloom.test', 'student123', 'https://i.pravatar.cc/300?img=12']
];

const adminSeed = [
    [1, 'admin', 'admin123']
];

const enrollmentSeed = [
    ['enroll-1', 'user-student', 'course-react']
];

async function runSeed() {
    const conn = pool.promise();

    await conn.query(
        'INSERT IGNORE INTO TEACHER (TID, TNAME, EMAIL, BIO, PASS, SPECIAL) VALUES ?',[teacherSeed]
    );
    await conn.query(
        'INSERT IGNORE INTO COURSE (CID, TITLE, DESCRIP, VIDEO, TID, IMGLINK, VIDLINK) VALUES ?',[courseSeed]
    );
    await conn.query(
        'INSERT IGNORE INTO `USER` (USERID, UNAME, EMAIL, PSWD, IMG) VALUES ?',[userSeed]
    );
    await conn.query(
        'INSERT IGNORE INTO ADMINS (id, username, password) VALUES ?',[adminSeed]
    );
    await conn.query(
        'INSERT IGNORE INTO ENROLLMENT (EID, USERID, CID) VALUES ?',[enrollmentSeed]
    );
}

runSeed()
    .then(() => {
        console.log('Seed data inserted successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    });

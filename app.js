const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const path = require("path");
const fs = require('fs/promises');
const { createWriteStream } = require('fs');
const http = require('http');
const https = require('https');
const { pipeline } = require('stream/promises');
const ejsMate = require('ejs-mate');
const { randomUUID } = require('crypto');
const methodOverride = require("method-override");
const session = require('express-session');
const flash = require('connect-flash');
const wrapAsync = require('./utils/wrapAsync.js');
const cookieParser = require('cookie-parser');
const connection = require('./config/database.js');

// ============ APP CONFIGURATION ============
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

const cookieSecret = process.env.COOKIE_SECRET || "this is DBMS Project";
const sessionSecret = process.env.SESSION_SECRET || "yourSecretKey";

// Cookie parser MUST come before session
app.use(cookieParser(cookieSecret));

// Session configuration - MUST come before flash
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax'
    }
}));

// Flash messages middleware - MUST come after session
app.use(flash());

// Global middleware for flash messages and session data
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.isLoggedIn = req.session.isLoggedIn || false;
    res.locals.currentUser = req.session.user || null;
    res.locals.currentAdmin = req.session.admin || null;
    res.locals.isAdmin = (req.session.admin && req.session.admin.isAdmin) || false;
    next();
});



// ============ MIDDLEWARE FUNCTIONS ============

function checkAdmin(req, res, next) {
    console.log('checkAdmin called, session exists:', !!req.session);

    const { username, password } = req.body;
    const qa = "SELECT * FROM admins WHERE username = ?";

    connection.query(qa, [username], (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Error checking admin status.");
        }

        if (results.length > 0 && password === results[0].password) {
            console.log('Admin login successful, setting session...');

            // Store admin session data
            req.session.admin = {
                id: results[0].id,
                username: results[0].username,
                isAdmin: true
            };
            req.session.user_id = results[0].id;
            req.session.isLoggedIn = true;

            console.log('Session set, about to use flash...');
            res.cookie('admin', results[0].id, { httpOnly: true });

            // Direct flash usage - no async operations
            req.flash('success', 'Login successful as admin!');
            return res.redirect('/mindbloom');
        }

        // If not admin, proceed to user login
        return next();
    });
}
// Require login middleware
function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn || !req.session.user_id) {
        req.flash('error', 'Please login to access this page.');
        return res.redirect('/mindbloom/login');
    }
    next();
}

// Require admin middleware
function requireAdmin(req, res, next) {
    if (!req.session.admin || !req.session.admin.isAdmin) {
        req.flash('error', 'Admin access required.');
        return res.redirect('/mindbloom/login');
    }
    next();
}

function buildTeacherEmail(tname) {
    const localPart = String(tname || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');

    return `${localPart || 'teacher'}@mindbloom.local`;
}

function getImageExtension(contentType) {
    const normalizedType = String(contentType || '').toLowerCase();

    if (normalizedType.includes('jpeg') || normalizedType.includes('jpg')) return '.jpg';
    if (normalizedType.includes('png')) return '.png';
    if (normalizedType.includes('webp')) return '.webp';
    if (normalizedType.includes('gif')) return '.gif';
    if (normalizedType.includes('svg')) return '.svg';

    return '.jpg';
}

async function persistCourseImage(imageUrl, courseId) {
    const trimmedUrl = String(imageUrl || '').trim();

    if (!trimmedUrl) {
        return '';
    }

    try {
        const parsedUrl = new URL(trimmedUrl);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return trimmedUrl;
        }
    } catch (error) {
        return trimmedUrl;
    }

    try {
        const downloadResult = await new Promise((resolve, reject) => {
            const parsedUrl = new URL(trimmedUrl);
            const client = parsedUrl.protocol === 'http:' ? http : https;

            const request = client.get(parsedUrl, (response) => {
                if (response.statusCode !== 200) {
                    response.resume();
                    reject(new Error(`Image request failed with status ${response.statusCode}`));
                    return;
                }

                const contentType = response.headers['content-type'] || '';

                if (!contentType.toLowerCase().startsWith('image/')) {
                    response.resume();
                    reject(new Error(`Unsupported content type: ${contentType}`));
                    return;
                }

                resolve({ response, contentType });
            });

            request.on('error', reject);
        });

        const uploadsDir = path.join(__dirname, 'public', 'uploads', 'courses');
        const fileName = `${courseId}${getImageExtension(downloadResult.contentType)}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.mkdir(uploadsDir, { recursive: true });
        await pipeline(downloadResult.response, createWriteStream(filePath));

        return `/uploads/courses/${fileName}`;
    } catch (error) {
        console.log('Course image fallback:', trimmedUrl, error.message);
        return trimmedUrl;
    }
}

function createCourseWithImage(coursePayload, callback) {
    const { courseId, title, description, video, teacherId, imgLink, vidLink } = coursePayload;
    const insertQuery = `INSERT INTO courses (CID, TITLE, DESCRIP, VIDEO, TID, IMGLINK, VIDLINK) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    persistCourseImage(imgLink, courseId)
        .then((storedImagePath) => {
            callback(null, [courseId, title, description, video, teacherId, storedImagePath, vidLink]);
        })
        .catch((imageErr) => {
            callback(imageErr);
        });
}

function findOrCreateTeacherId(tname, callback) {
    const teacherName = String(tname || '').trim();

    if (!teacherName) {
        return callback(new Error('Teacher username is required.'));
    }

    const lookupQuery = `SELECT TID FROM teachers WHERE TNAME = ?`;

    connection.query(lookupQuery, [teacherName], (lookupErr, teacherResult) => {
        if (lookupErr) {
            return callback(lookupErr);
        }

        if (teacherResult.length > 0) {
            return callback(null, teacherResult[0].TID, false);
        }

        const teacherId = randomUUID();
        const insertTeacherQuery = `INSERT INTO teachers (TID, TNAME, EMAIL, BIO, PASS, SPECIAL) VALUES (?, ?, ?, ?, ?, ?)`;
        const teacherEmail = buildTeacherEmail(teacherName);

        connection.query(
            insertTeacherQuery,
            [teacherId, teacherName, teacherEmail, 'The instructor teaches this course', '', 'General'],
            (insertErr) => {
                if (insertErr) {
                    return callback(insertErr);
                }

                return callback(null, teacherId, true);
            }
        );
    });
}

async function ensureTextColumns() {
    const migrations = [
        'ALTER TABLE teachers ALTER COLUMN BIO TYPE TEXT USING BIO::TEXT',
        'ALTER TABLE courses ALTER COLUMN DESCRIP TYPE TEXT USING DESCRIP::TEXT'
    ];

    for (const statement of migrations) {
        try {
            await connection.pool.query(statement);
        } catch (error) {
            if (error.code === '42P01' || error.code === '42703') {
                continue;
            }

            throw error;
        }
    }
}

// ============ AUTHENTICATION ROUTES ============

// Registration form
app.get('/mindbloom/signup', (req, res) => {
    // If already logged in, redirect to home
    if (req.session.isLoggedIn) {
        return res.redirect('/mindbloom');
    }
    res.render('listings/signup.ejs');
});

// Handle registration
app.post('/mindbloom/signup', wrapAsync(async (req, res) => {
    const { username, email, password } = req.body;
    const uuid = randomUUID();
    const q = 'INSERT INTO users (USERID, UNAME, EMAIL, PSWD) VALUES (?, ?, ?, ?)';

    connection.query(q, [uuid, username, email, password], (err) => {
        if (err) {
            console.log(err);
            return res.send("Registration error.");
        }
        // Auto-login: create session and redirect to home
        req.session.user = {
            id: uuid,
            username: username,
            email: email,
            isAdmin: false
        };
        req.session.user_id = uuid;
        req.session.isLoggedIn = true;
        res.cookie('user_id', uuid, { httpOnly: true });
        req.flash('success', 'Registration successful - you are now logged in.');
        // Save the session and redirect to home so the next request shows logged-in UI
        req.session.save((saveErr) => {
            if (saveErr) console.log('Session save error after signup:', saveErr);
            return res.redirect('/mindbloom');
        });
    });
}));

// Login form
app.get('/mindbloom/login', (req, res) => {
    // If already logged in, redirect to home
    if (req.session.isLoggedIn) {
        return res.redirect('/mindbloom');
    }
    res.render('listings/login.ejs');
});

// Handle login (checks admin first, then user)
app.post('/mindbloom/login', checkAdmin, (req, res) => {
    const { username, password } = req.body;
    const q = 'SELECT * FROM users WHERE UNAME = ?';

    connection.query(q, [username], async (err, results) => {
        if (err || results.length === 0) {
            req.flash("error", "Invalid username or password.");
            return res.redirect('/mindbloom/login');
        }

        const user = results[0];
        if (password === user.PSWD) {
            // Store user session data
            req.session.user = {
                id: user.USERID,
                username: user.UNAME,
                email: user.EMAIL,
                isAdmin: false
            };
            req.session.user_id = user.USERID;
            req.session.isLoggedIn = true;

            res.cookie('user_id', user.USERID, { httpOnly: true });
            req.flash('success', 'Login successful!');
            res.redirect('/mindbloom');
        } else {
            req.flash("error", "Invalid username or password.");
            res.redirect('/mindbloom/login');
        }
    });
});

// Logout
app.get('/mindbloom/logout', (req, res) => {
    // Clear cookies
    res.clearCookie('user_id');
    res.clearCookie('admin');

    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.redirect('/mindbloom');
        }
        res.redirect('/mindbloom');
    });
});

// ============ MAIN APPLICATION ROUTES ============

// Home page - Show all courses
app.get("/mindbloom", (req, res) => {
    let q = 'SELECT * FROM courses';
    connection.query(q, (err, result) => {
        if (err) throw err;
        res.render("listings/home.ejs", { result });
    });
});

// Search courses
app.get("/mindbloom/search", (req, res) => {
    const searchTerm = (req.query.q || "").trim();

    if (!searchTerm) {
        return res.redirect('/mindbloom');
    }

    const like = `%${searchTerm}%`;
    const q = `
        SELECT *
        FROM courses
        JOIN teachers ON courses.TID = teachers.TID
        WHERE courses.TITLE LIKE ?
           OR courses.DESCRIP LIKE ?
           OR teachers.TNAME LIKE ?
    `;

    connection.query(q, [like, like, like], (err, result) => {
        if (err) throw err;
        res.render("listings/home.ejs", { result });
    });
});

// Show courses by teacher
app.get("/mindbloom/teachers/:tid", (req, res) => {
    let { tid } = req.params;
    let q = `SELECT * FROM courses JOIN teachers ON courses.TID = teachers.TID WHERE teachers.TID = ?`;

    connection.query(q, [tid], (err, result) => {
        if (err) throw err;
        res.render("listings/teachershow.ejs", { result });
    });
});

// Show course details
app.get("/mindbloom/course/:id", (req, res) => {
    let { id } = req.params;
    let ad = req.session.admin;
    let userId = req.session.user ? req.session.user.id : null;
    let q = `SELECT * FROM courses JOIN teachers ON courses.TID = teachers.TID WHERE CID = ?`;

    connection.query(q, [id], (err, result) => {
        if (err) throw err;

        if (!userId) {
            return res.render("listings/show.ejs", {
                result,
                userId,
                ad,
                isEnrolled: false
            });
        }

        const enrollmentQuery = `SELECT 1 FROM enrollments WHERE USERID = ? AND CID = ? LIMIT 1`;

        connection.query(enrollmentQuery, [userId, id], (enrollmentErr, enrollmentResult) => {
            if (enrollmentErr) throw enrollmentErr;

            res.render("listings/show.ejs", {
                result,
                userId,
                ad,
                isEnrolled: enrollmentResult.length > 0
            });
        });
    });
});

// ============ enrollments ROUTES ============

// Enroll in course
app.post('/mindbloom/course/:id/enroll', requireLogin, async (req, res) => {
    const userId = req.session.user_id;
    const courseId = req.params.id;
    const eid = randomUUID();


    try {
        // Check if user is already enrolled
        const checkQuery = "SELECT * FROM enrollments WHERE USERID = ? AND CID = ?";

        const checkEnrollment = new Promise((resolve, reject) => {
            connection.query(checkQuery, [userId, courseId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        const existingEnrollment = await checkEnrollment;

        if (existingEnrollment.length > 0) {
            req.flash('error', 'You are already enrolled in this course.');
            return res.redirect(`/mindbloom/course/${courseId}`);
        }

        // Insert new enrollment
        const insertQuery = "INSERT INTO enrollments (EID, USERID, CID) VALUES (?, ?, ?)";

        const insertEnrollment = new Promise((resolve, reject) => {
            connection.query(insertQuery, [eid, userId, courseId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        await insertEnrollment;

        req.flash('success', 'Enrolled successfully!');
        res.redirect(`/mindbloom/course/${courseId}`);

    } catch (error) {
        console.error('Enrollment error:', error);
        req.flash('error', 'Error processing enrollment request.');
        res.redirect(`/mindbloom/course/${courseId}`);
    }
});

//View the profile
app.get('/mindbloom/profile', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    
    const userQuery = 'SELECT USERID, UNAME, EMAIL, IMG FROM users WHERE USERID = ?';
    
    // Fixed query to get enrolled courses with course details
    const enrolledCoursesQuery = `
        SELECT 
            c.CID,
            c.TITLE,
            c.DESCRIP,
            c.VIDEO,
            c.IMGLINK,
            c.VIDLINK,
            t.TNAME,
            t.EMAIL as teachers_EMAIL
        FROM enrollments e
        JOIN courses c ON e.CID = c.CID
        JOIN teachers t ON c.TID = t.TID
        WHERE e.USERID = ?
    `;
    
    // Execute user query first
    connection.query(userQuery, [userId], (err, userResult) => {
        if (err) {
            console.log('Error fetching user:', err);
            req.flash('error', 'Error loading profile.');
            return res.redirect('/mindbloom');
        }
        
        if (userResult.length === 0) {
            req.flash('error', 'User not found.');
            return res.redirect('/mindbloom');
        }
        
        const user = userResult[0];
        
        // Execute enrolled courses query
        connection.query(enrolledCoursesQuery, [userId], (err, coursesResult) => {
            if (err) {
                console.log('Error fetching enrolled courses:', err);
                req.flash('error', 'Error loading enrolled courses.');
                return res.redirect('/mindbloom');
            }
            
            // Debug logging
            console.log('User data:', user);
            console.log('Enrolled courses:', coursesResult);
            
            res.render('listings/profile.ejs', {
                user: user,
                enrolledCourses: coursesResult,
                currentUser: req.session.user
            });
        });
    });
});
// ============ courses CRUD ROUTES (ADMIN ONLY) ============

// Add new course form
app.get('/mindbloom/courses/new', requireAdmin, (req, res) => {
    const teachersQuery = `SELECT * FROM teachers`;

    connection.query(teachersQuery, (err, teachers) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Error fetching teachers.');
            return res.redirect('/mindbloom');
        }

        res.render('listings/newcourse.ejs', { teachers });
    });
});

//Posting new course
app.post('/mindbloom/courses', requireAdmin, (req, res) => {
    const { title, description, video, tname, imgLink, vidLink } = req.body;

    findOrCreateTeacherId(tname, (teacherErr, teacherId, teacherCreated) => {
        if (teacherErr) {
            console.log(teacherErr);
            req.flash('error', 'Error preparing teacher account.');
            return res.redirect('/mindbloom/courses/new');
        }

        const courseId = randomUUID();

        createCourseWithImage(
            { courseId, title, description, video, teacherId, imgLink, vidLink },
            (imageErr, values) => {
                if (imageErr) {
                    console.log(imageErr);
                    req.flash('error', 'Error preparing course image.');
                    return res.redirect('/mindbloom/courses/new');
                }

                const insertQuery = `INSERT INTO courses (CID, TITLE, DESCRIP, VIDEO, TID, IMGLINK, VIDLINK) VALUES (?, ?, ?, ?, ?, ?, ?)`;

                connection.query(insertQuery, values, (err, result) => {
                    if (err) {
                        console.log(err);
                        req.flash('error', 'Error creating course.');
                        return res.redirect('/mindbloom/courses/new');
                    }

                    req.flash('success', teacherCreated ? 'Teacher account created and course added successfully!' : 'Course created successfully!');
                    res.redirect(`/mindbloom/course/${courseId}`);
                });
            }
        );
    });
});

// Get edit form for course
app.get('/mindbloom/course/:id/edit', requireAdmin, (req, res) => {
    const courseId = req.params.id;
    const courseQuery = `SELECT * FROM courses WHERE CID = ?`;
    const teachersQuery = `SELECT * FROM teachers,courses WHERE teachers.TID=courses.TID`;

    connection.query(courseQuery, [courseId], (err, courseResult) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Error fetching course details.');
            return res.redirect('/mindbloom');
        }

        if (courseResult.length === 0) {
            req.flash('error', 'Course not found.');
            return res.redirect('/mindbloom');
        }

        connection.query(teachersQuery, (err, teachersResult) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Error fetching teachers.');
                return res.redirect('/mindbloom');
            }

            res.render('listings/editcourse.ejs', {
                course: courseResult[0],
                teachers: teachersResult[0]
            });
        });
    });
});

// Update course
app.put('/mindbloom/course/:id', requireAdmin, (req, res) => {
    const courseId = req.params.id;
    const { title, description, video, tname, imglink, vidLink } = req.body;

    findOrCreateTeacherId(tname, (teacherErr, teacherId, teacherCreated) => {
        if (teacherErr) {
            console.log(teacherErr);
            req.flash('error', 'Error preparing teacher account.');
            return res.redirect('/mindbloom/courses/new');
        }

        persistCourseImage(imglink, courseId)
            .then((storedImagePath) => {
                const updateQuery = `UPDATE courses SET TITLE = ?, DESCRIP = ?, VIDEO = ?, TID = ?, IMGLINK = ?, VIDLINK = ? WHERE CID = ?`;

                connection.query(updateQuery, [title, description, video, teacherId, storedImagePath, vidLink, courseId], (err, result) => {
                    if (err) {
                        console.log(err);
                        req.flash('error', 'Error updating course.');
                        return res.redirect('/mindbloom/courses/new');
                    }

                    req.flash('success', teacherCreated ? 'Teacher account created and course updated successfully!' : 'Course updated successfully!');
                    res.redirect(`/mindbloom/course/${courseId}`);
                });
            })
            .catch((imageErr) => {
                console.log(imageErr);
                req.flash('error', 'Error preparing course image.');
                return res.redirect('/mindbloom/courses/new');
            });
    });
});

// Delete course
app.delete('/mindbloom/course/:id', requireAdmin, (req, res) => {
    const courseId = req.params.id;
    const q = 'DELETE FROM courses WHERE CID = ?';

    connection.query(q, [courseId], (err, result) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Error deleting course.');
            return res.redirect('/mindbloom');
        }

        req.flash('success', 'Course deleted successfully!');
        res.redirect('/mindbloom');
    });
});

// ============ SERVER STARTUP ============
if (require.main === module && !process.env.VERCEL) {
    ensureTextColumns()
        .then(() => {
            app.listen(port, () => {
                console.log(`Backend server running on port ${port}`);
            });
        })
        .catch((error) => {
            console.error('Failed to prepare database schema:', error);
            process.exit(1);
        });
}

module.exports = app;


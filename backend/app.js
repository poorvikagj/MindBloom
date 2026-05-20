const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const path = require("path");
const ejsMate = require('ejs-mate');
const { randomUUID } = require('crypto');
const methodOverride = require("method-override");
const session = require('express-session');
const flash = require('connect-flash');
const wrapAsync = require('./utils/wrapAsync.js');
const cookieParser = require('cookie-parser');
const connection = require('./config/database.js');
const cors = require('cors');

// ============ CORS CONFIGURATION ============
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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
    const qa = "SELECT * FROM ADMINS WHERE username = ?";

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
    const q = "INSERT INTO `USER` (USERID, UNAME, EMAIL, PSWD) VALUES (?, ?, ?, ?)";

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
        req.flash('success', 'Registration successful — you are now logged in.');
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
    const q = "SELECT * FROM USER WHERE UNAME = ?";

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
    let q = "SELECT * FROM COURSE";
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
        FROM COURSE
        JOIN TEACHER ON COURSE.TID = TEACHER.TID
        WHERE COURSE.TITLE LIKE ?
           OR COURSE.DESCRIP LIKE ?
           OR TEACHER.TNAME LIKE ?
    `;

    connection.query(q, [like, like, like], (err, result) => {
        if (err) throw err;
        res.render("listings/home.ejs", { result });
    });
});

// Show courses by teacher
app.get("/mindbloom/teachers/:tid", (req, res) => {
    let { tid } = req.params;
    let q = `SELECT * FROM COURSE JOIN TEACHER ON COURSE.TID = TEACHER.TID WHERE TEACHER.TID = ?`;

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
    let q = `SELECT * FROM COURSE JOIN TEACHER ON COURSE.TID = TEACHER.TID WHERE CID = ?`;

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

        const enrollmentQuery = `SELECT 1 FROM ENROLLMENT WHERE USERID = ? AND CID = ? LIMIT 1`;

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

// ============ ENROLLMENT ROUTES ============

// Enroll in course
app.post('/mindbloom/course/:id/enroll', requireLogin, async (req, res) => {
    const userId = req.session.user_id;
    const courseId = req.params.id;
    const eid = randomUUID();


    try {
        // Check if user is already enrolled
        const checkQuery = "SELECT * FROM ENROLLMENT WHERE USERID = ? AND CID = ?";

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
        const insertQuery = "INSERT INTO ENROLLMENT (EID, USERID, CID) VALUES (?, ?, ?)";

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
    
    const userQuery = `SELECT USERID, UNAME, EMAIL, IMG FROM USER WHERE USERID = ?`;
    
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
            t.EMAIL as TEACHER_EMAIL
        FROM ENROLLMENT e
        JOIN COURSE c ON e.CID = c.CID
        JOIN TEACHER t ON c.TID = t.TID
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
// ============ COURSE CRUD ROUTES (ADMIN ONLY) ============

// Add new course form
app.get('/mindbloom/courses/new', requireAdmin, (req, res) => {
    const teachersQuery = `SELECT * FROM TEACHER`;

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

    // First, validate that the teacher username exists
    const teacherValidationQuery = `SELECT TID FROM TEACHER WHERE TNAME = ?`;

    connection.query(teacherValidationQuery, [tname], (err, teacherResult) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Database error while validating teacher.');
            return res.redirect('/mindbloom/courses/new');
        }

        // Check if teacher was found
        if (teacherResult.length === 0) {
            req.flash('error', 'Teacher username not found. Please select a valid teacher.');
            return res.redirect('/mindbloom/courses/new');
        }

        // Teacher exists, get the TID and proceed with course creation
        const teacherId = teacherResult[0].TID;
        const courseId = randomUUID();

        const insertQuery = `INSERT INTO COURSE (CID, TITLE, DESCRIP, VIDEO, TID, IMGLINK, VIDLINK) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        connection.query(insertQuery, [courseId, title, description, video, teacherId, imgLink, vidLink], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Error creating course.');
                return res.redirect('/mindbloom/courses/new');
            }

            req.flash('success', 'Course created successfully!');
            res.redirect(`/mindbloom/course/${courseId}`);
        });
    });
});

// Get edit form for course
app.get('/mindbloom/course/:id/edit', requireAdmin, (req, res) => {
    const courseId = req.params.id;
    const courseQuery = `SELECT * FROM COURSE WHERE CID = ?`;
    const teachersQuery = `SELECT * FROM TEACHER,COURSE WHERE TEACHER.TID=COURSE.TID`;

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
    const teacherValidationQuery = `SELECT TID FROM TEACHER WHERE TNAME = ?`;

    connection.query(teacherValidationQuery, [tname], (err, teacherResult) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Database error while validating teacher.');
            return res.redirect('/mindbloom/courses/new');
        }

        if (teacherResult.length === 0) {
            req.flash('error', 'Teacher username not found. Please select a valid teacher.');
            return res.redirect('/mindbloom/courses/new');
        }

        const teacherId = teacherResult[0].TID;

        const updateQuery = `UPDATE COURSE SET TITLE = ?, DESCRIP = ?, VIDEO = ?, TID = ?, IMGLINK = ?, VIDLINK = ? WHERE CID = ?`;

        connection.query(updateQuery, [title, description, video, teacherId, imglink, vidLink, courseId], (err, result) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Error updating course.');
                return res.redirect('/mindbloom/courses/new');
            }

            req.flash('success', 'Course updated successfully!');
            res.redirect(`/mindbloom/course/${courseId}`);
        });
    });
});

// Delete course
app.delete('/mindbloom/course/:id', requireAdmin, (req, res) => {
    const courseId = req.params.id;
    const q = `DELETE FROM COURSE WHERE CID = ?`;

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
app.listen(port, () => {
    console.log(`✅ Backend server running on port ${port}`);
    console.log(`📍 Frontend expected on: http://localhost:3000`);
});

module.exports = app;

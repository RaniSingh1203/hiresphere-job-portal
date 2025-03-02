const express = require('express');
const ejs = require('ejs');
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require('path');
const app = express();
const PORT = 9002;

const Applicant = require('./models/Applicants');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.set('view engine', 'ejs')
    // Secret key for JWT
const jwtsk = 'pehli_baar_hai_errors_aayenge_hi_tum_koshish_karte_rehna';

app.get('/', (req, res) => {
    res.render('home');
});
app.get('/signup', async(req, res) => {
    res.render('signup');

});
app.get('/login', (req, res) => {
    const token = req.cookies.token;

    if (token) {
        // If the user already has a token, verify it and redirect based on their role
        jwt.verify(token, jwtsk, async(error, decodedToken) => {
            if (error) {
                if (error.name === "TokenExpiredError") {
                    // If the token has expired, clear the cookie and prompt for re-login
                    res.clearCookie('token');
                    return res.redirect('/login');
                } else {
                    return res.status(403).send("Token not valid");
                }
            }

            // Find the user based on the token's email
            const user = await User.findOne({ email: decodedToken.email });

            if (!user) {
                return res.status(404).send("User not found");
            }

            // Redirect to the appropriate dashboard based on the user's role
            if (user.role === 'recruiter') {
                return res.redirect('/recruiterdash');
            } else {
                return res.redirect('/dashboard');
            }
        });
    } else {
        // If no token is present, render the login page
        res.render('login');
    }
});
app.get('/recruiterdash', async(req, res) => {
    const token = req.cookies.token;

    if (!token) {
        // Redirect to login if no token is found
        return res.redirect('/login');
    }

    jwt.verify(token, jwtsk, async(error, decodedToken) => {
        if (error) {
            // Handle token verification errors
            console.error("Token verification failed:", error);
            return res.redirect('/login'); // Redirect to login on token error
        }

        try {
            const email = decodedToken.email;
            console.log("Decoded email from token:", email);

            const user = await User.findOne({ email: email });

            if (!user) {
                // Handle case where user is not found
                console.error("User not found for email:", email);
                return res.status(404).send('User not found');
            }

            if (user.role !== 'recruiter') {
                // If user is not a recruiter, redirect to the appropriate page
                return res.redirect('/dashboard');
            }

            // Render the recruiter dashboard with the user's information
            res.render('recruiterdash', { username: user.name });
        } catch (err) {
            // Handle any errors that occur while fetching the user
            console.error("Error fetching user:", err);
            res.status(500).send('Failed to load recruiter dashboard');
        }
    });
});


app.post('/recruiterdash', async(req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, jwtsk, async(error, decodedToken) => {
        if (error) {
            console.error("Token verification failed:", error);
            return res.redirect('/login'); // Redirect to login on token error
        }

        try {
            const email = decodedToken.email;
            const user = await User.findOne({ email: email });

            if (!user) {
                return res.status(404).send('User not found');
            }

            if (user.role !== 'recruiter') {
                return res.redirect('/dashboard'); // Redirect to dashboard if not a recruiter
            }

            // Process any data sent in the POST request here
            // For example, handle form data or other inputs

            // Redirect to the recruiter dashboard after processing
            res.redirect('/recruiterdash');
        } catch (err) {
            console.error("Error fetching user:", err);
            res.status(500).send('Failed to process request');
        }
    });
});




app.get('/dashboard', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, jwtsk, async(error, decodedToken) => {
        if (error) {
            if (error.name === "TokenExpiredError") {
                return res.redirect('/login'); // Redirect to login if token has expired
            }
            return res.status(403).send("Token not valid");
        }

        const user = await User.findOne({ email: decodedToken.email });
        const userDetails = await Details.findOne({ email: decodedToken.email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (user.role === 'recruiter') {
            return res.redirect('/recruiterdash');
        } else {
            return res.render("dashboard", { username: user.name, details: userDetails });
        }
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect('/login')
});


const mongoURI = 'mongodb://localhost:27017/jobPo';

// Connect to MongoDB
mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['recruiter', 'seeker'], default: 'seeker' }, // Added role field
    appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: [] }] // Added appliedJobs field
});


const User = mongoose.model('user', userSchema);


app.post('/signup', async(req, res) => {
    const { name, email, password, role } = req.body;

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.send('Email already in use. Please use a different email.');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user with hashed password
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();
    res.redirect('/choose-role?email=' + encodeURIComponent(email));
    // Redirect to the role selection page
    //res.redirect('/choose-role');
});

app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.send('Invalid email or password');
    }

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        const token = jwt.sign({ email: email }, jwtsk, {
            expiresIn: "1h",
        });
        res.cookie('token', token, { httpOnly: true });

        // Redirect based on role
        if (user.role === 'recruiter') {
            res.redirect('/recruiterdash');
        } else {
            res.redirect('/dashboard');
        }
    } else {
        res.send('Invalid email or password');
    }
});

app.get('/details', (req, res) => {
    res.render('details');
});
const Schema = mongoose.Schema;

// Create a schema and model for job seekers' details
const detailsSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    location: String,
    education: {
        school: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        activities: String,
        achievements: String
    },
    experience: String,
    skills: String,
});


// Handle form submission
const Details = mongoose.model('Details', detailsSchema);
app.post('/details', async(req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            location,
            school,
            degree,
            fieldOfStudy,
            startDate,
            endDate,
            activities,
            achievements,
            experience,
            skills
        } = req.body;

        // Create a new details document
        const newDetails = new Details({
            fullName,
            email,
            phone,
            location,
            education: {
                school,
                degree,
                fieldOfStudy,
                startDate,
                endDate,
                activities,
                achievements
            },
            experience,
            skills
        });

        await newDetails.save();

        // Find the user to pass the data to the dashboard
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Redirect to the dashboard with user and details
        res.render('dashboard', {
            username: user.name,
            details: newDetails
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to submit details');
    }
});

const jobSchema = new mongoose.Schema({
    title: String,
    description: String,
    company: String,
    location: String,
    salary: Number,
    skillsRequired: String,
    lastDate: { type: Date, default: Date.now },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Reference to User model
    postedBy: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
     }
});



// Post a new job
app.get('/post-job', (req, res) => {
    res.render('postjob');
});

// Post a new job
// Post a new job
const Job = require('./models/jobs');
// app.post('/jobs', async(req, res) => {
//     try {
//         const { title, description, company, location, salary, skills, deadline } = req.body;
//         const newJob = new Job({
//             title,
//             description,
//             company,
//             location,
//             salary,
//             skills,
//             deadline,
            
//         });
//         await newJob.save();
//         // alert("Job Posted Successfully")
//         res.status(201).redirect('/view-jobs');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Failed to post job');
//     }
// });

app.post('/jobs', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(400).send("Token not found");
    }

    jwt.verify(token, jwtsk, async (error, decodedToken) => {
        if (error) {
            return res.status(403).send("Failed to authenticate token.");
        }

        try {
            const user = await User.findOne({ email: decodedToken.email });

            if (!user || user.role !== 'recruiter') {
                return res.status(403).send("Access denied");
            }

            const { title, description, company, location, salary, skills, deadline } = req.body;
            const newJob = new Job({
                title,
                description,
                company,
                location,
                salary,
                skills,
                deadline,
                postedBy: user._id // Save the recruiter ID
            });

            await newJob.save();
            res.status(201).redirect('/view-jobs');
        } catch (err) {
            console.error(err);
            res.status(500).send('Failed to post job');
        }
    });
});

// View all jobs
app.get('/jobs', async(req, res) => {
    try {
        const jobs = await Job.find();
        res.status(200).json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch jobs');
    }
});



app.get('/view-jobs', async(req, res) => {
    try {
        const jobs = await Job.find();
        res.render('viewjobs', { jobs });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch jobs');
    }
});

app.get('/choose-role', (req, res) => {
    const { email } = req.query;
    res.render('chooserole', { email });
});
app.post('/choose-role', async(req, res) => {
    const { email, role } = req.body;
    console.log('Received email:', email);
    console.log('Received role:', role);


    if (!email || !role) {
        return res.status(400).send('Email and role are required');
    }

    try {
        // Validate role value
        if (!['recruiter', 'seeker'].includes(role)) {
            return res.status(400).send('Invalid role selected');
        }

        // Find the user by email and update their role
        const user = await User.findOneAndUpdate({ email }, { role }, { new: true });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Redirect based on the role
        if (role === 'recruiter') {
            res.redirect('/recruiterdash');
        } else if (role === 'seeker') {
            res.redirect('/details');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


/*app.post('/choose-role', (req, res) => {
    const { role } = req.body;

    if (role === 'recruiter') {
        res.redirect('/recruiterdash');
    } else {
        res.redirect('/details');
    }
});*/


// for my applied jobs
// Route to view applied jobs
// server.js (Add route for viewing applied jobs)
app.get('/applied-jobs', async(req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(400).send("Token not found");
    }

    jwt.verify(token, jwtsk, async(error, decodedToken) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).send("Token has expired. Please log in again.");
            }
            return res.status(403).send("Failed to authenticate token.");
        }
        const email = decodedToken.email;
        const user = await User.findOne({ email: email }).populate('appliedJobs');
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render('myappliedjobs', { appliedJobs: user.appliedJobs });
    });
});

// server.js (Add route for applying to a job)
app.post('/apply-jobs/:jobId', async(req, res) => {
    const token = req.cookies.token;
    console.log(token);
    if (!token) {
        return res.status(400).send("Token not found");
    }

    jwt.verify(token, jwtsk, async(error, decodedToken) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).send("Token has expired. Please log in again.");
            }
            return res.status(403).send("Failed to authenticate token.");
        }

        const email = decodedToken.email;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).send("User not found");
        }

        const jobId = req.params.jobId;
        console.log("Job ID:", jobId);
        if (!user.appliedJobs.includes(jobId)) {
            user.appliedJobs.push(jobId);
            await user.save();
        }

        res.redirect('/applied-jobs'); // Redirect to view jobs or wherever suitable
    });
});





//recruiter job posted
app.get('/recruiter-jobs', async(req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, jwtsk, async(error, decodedToken) => {
        if (error) {
            return res.redirect('/login');
        }

        try {
            const email = decodedToken.email;
            const user = await User.findOne({ email: email });

            if (!user || user.role !== 'recruiter') {
                return res.status(403).send("Access denied");
            }

            const jobs = await Job.find({ postedBy: user._id });

            // Pass the username along with the jobs
            res.render('recruiterjobs', { jobs, username: user.name });
        } catch (err) {
            console.error("Error fetching jobs:", err);
            res.status(500).send('Failed to load jobs');
        }
    });
});


// Route to view applicants for a specific job
/*app.get('/jobs/:jobId/applicants', async(req, res) => {
    const jobId = req.params.jobId;
    console.log(jobId)
    try {
        const job = await Job.findById(jobId); // Ensure jobId is passed correctly
        if (!job) {
            return res.status(404).send('Job not found');
        }
        // Fetch applicants or related data here
        res.status(200).json(job.applicants); // Adjust according to your schema
    } catch (error) {
        console.error('Error retrieving applicants:', error);
        res.status(500).send('Error retrieving applicants');
    }
});*/


// app.get('/jobs/:jobId', async (req, res) => {
//     const token = req.cookies.token;

//     if (!token) {
//         return res.status(400).send("Token not found");
//     }

//     jwt.verify(token, jwtsk, async (error, decodedToken) => {
//         if (error) {
//             if (error.name === 'TokenExpiredError') {
//                 return res.status(401).send("Token has expired. Please log in again.");
//             }
//             return res.status(403).send("Failed to authenticate token.");
//         }

//         try {
//             const email = decodedToken.email;
//             const user = await User.findOne({ email: email });

//             if (!user || user.role !== 'recruiter') {
//                 return res.status(403).send("Access denied");
//             }

//             const jobId = req.params.jobId;
//             const job = await Job.findById(jobId).populate('applicants');

//             if (!job) {
//                 return res.status(404).send("Job not found");
//             }

//             if (!job.postedBy.equals(user._id)) {
//                 return res.status(403).send("You can only view applicants for jobs you have posted");
//             }

//             res.render('viewapplicants', { job, applicants: job.applicants });
//         } catch (err) {
//             console.log(err);
//             res.status(500).send('Failed to fetch applicants');
//         }
//     });
// });

app.get('/jobs/:jobId/applicants', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, jwtsk, async (error, decodedToken) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.redirect('/login');
            }
            return res.status(403).send("Failed to authenticate token.");
        }

        try {
            const email = decodedToken.email;
            const user = await User.findOne({ email: email });

            if (!user || user.role !== 'recruiter') {
                return res.status(403).send("Access denied");
            }

            const jobId = req.params.jobId;
            const job = await Job.findById(jobId).populate('applicants');

            if (!job || !job.postedBy.equals(user._id)) {
                return res.status(403).send("You can only view applicants for jobs you have posted");
            }

            res.render('viewapplicants', { job, applicants: job.applicants });
        } catch (err) {
            console.log("Error retrieving applicants:", err);
            res.status(500).send('Error retrieving applicants');
        }
    });
});


app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`)
});
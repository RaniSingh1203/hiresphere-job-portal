HireSphere – Job Portal 🚀
A modern job portal that connects job seekers with recruiters. Built using Node.js, MongoDB, and EJS, it allows users to apply for jobs, post job listings, and manage job applications seamlessly.

🌟 Features
✅ User Authentication – Signup/Login with unique email and password
✅ Role Selection – Choose between "Job Seeker" and "Recruiter" after signup
✅ Job Posting – Recruiters can post job listings with requirements and deadlines
✅ Job Applications – Job seekers can apply for jobs after logging in
✅ Dashboard – Different dashboards for job seekers and recruiters
✅ Job Listings – Recruiters can view and manage posted jobs

🛠️ Technologies Used
Frontend: HTML, CSS, JavaScript, EJS
Backend: Node.js, Express.js
Database: MongoDB
Authentication: JWT (JSON Web Tokens)
Templating Engine: EJS
🚀 How to Run Locally
1️⃣ Clone the Repository

git clone https://github.com/RaniSingh1203/hiresphere-job-portal
cd hiresphere
2️⃣ Install Dependencies
npm install
3️⃣ Set Up Environment Variables
Create a .env file and add your MongoDB connection string:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
4️⃣ Start the Server
npm start
The project will be running at http://localhost:3000/

📂 Folder Structure
📦 HireSphere
├── 📁 public        # Static files (CSS, JS)
├── 📁 views         # EJS templates
├── 📁 routes        # Route handlers
├── 📁 models        # MongoDB schemas
├── 📁 controllers   # Business logic
├── 📄 .env          # Environment variables
├── 📄 server.js     # Main server file
├── 📄 package.json  # Project metadata
└── 📄 README.md     # Documentation
🎯 User Roles
🔹 Job Seeker: Can browse jobs and apply
🔹 Recruiter: Can post jobs and view applicants









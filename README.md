# Task Manager API

A production-ready REST API built with **Node.js**, **Express**, **SQLite**, and **JWT authentication**.  
Manage users and tasks with full CRUD operations, protected routes, and query filtering.

## ✨ Features

- **User authentication** (register, login, JWT token)
- **Task management** (create, read, update, delete, mark complete)
- **Filter tasks** by status (`?status=pending` or `?status=completed`)
- **SQLite database** with relational tables (`users`, `tasks`)
- **Protected endpoints** using JWT middleware
- **Error handling** and validation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **Version control**: Git & GitHub

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Git

### Installation

```bash
git clone https://github.com/martinilham-byte/task-manager-api.git
cd task-manager-api
npm install
Environment Variables
Create a .env file (optional – you can edit SECRET_KEY directly in server.js for testing).

Run the Server
bash
node server.js
Server will run at http://localhost:3000

📖 API Documentation
Authentication
Method	Endpoint	Description	Body
POST	/register	Register new user	{"nama", "email", "password"}
POST	/login	Login & get token	{"email", "password"}
Tasks (all require JWT token in Authorization header)
Method	Endpoint	Description	Body/Query
POST	/tasks	Create a task	{"title", "description" (optional)}
GET	/tasks	Get all tasks (user's own)	Query: ?status=pending or ?status=completed
PUT	/tasks/:id	Update a task	{"title", "description", "completed"}
PATCH	/tasks/:id/complete	Mark task as completed	–
DELETE	/tasks/:id	Delete a task	–
Users (public endpoints, for demonstration)
Method	Endpoint	Description
GET	/users	List all users
GET	/users/:id	Get user by ID
PUT	/users/:id	Update user
DELETE	/users/:id	Delete user
Protected Profile
Method	Endpoint	Description
GET	/profile-saya	Get own profile (requires token)
🧪 Example Usage (curl)
Register
bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"John Doe","email":"john@example.com","password":"secret"}'
Login
bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret"}'
Copy the returned token.

Create a task
bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -d '{"title":"Learn backend","description":"Finish task manager"}'
Get all tasks (pending)
bash
curl "http://localhost:3000/tasks?status=pending" \
  -H "Authorization: YOUR_TOKEN_HERE"
Update task
bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -d '{"title":"Updated title","completed":1}'
Mark complete
bash
curl -X PATCH http://localhost:3000/tasks/1/complete \
  -H "Authorization: YOUR_TOKEN_HERE"
Delete task
bash
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "Authorization: YOUR_TOKEN_HERE"
📂 Project Structure
text
backend-learning/
├── server.js          # Main application
├── database.js        # SQLite setup & tables
├── package.json       # Dependencies
├── .gitignore         # Ignore node_modules & data.db
└── README.md          # This file
📄 License
MIT

🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first.

📬 Contact
Martin Ilham – GitHub
# Smart Finance Manager - Backend API

A powerful backend API for managing personal finances, investments, budgets, and financial goals.

## 🚀 Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **ODM:** Mongoose
- **API Integration:** Yahoo Finance 2
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcryptjs for password hashing

## 📁 Project Structure

backend/
├── models/ # Mongoose schemas
│ ├── Budget.js
│ ├── Goals.js
│ ├── Investment.js
│ ├── Transaction.js
│ └── User.js
├── routes/ # API route handlers (modular)
│ ├── auth.js
│ ├── budgets.js
│ ├── export.js
│ ├── investments.js
│ └── transactions.js
├── server.js # Main application entry point
├── app.py # Python/Flask backup implementation
├── package.json # Node.js dependencies
└── .env # Environment variables (not in repo)


## 🔧 Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Blitzkrieg69/smart-finance-manager.git
   cd smart-finance-manager/backend

🏦 Banking System - Full Stack Application
A complete, production-ready banking system built with React.js, Node.js, Express, and MySQL. Features include user authentication, account management, deposits, withdrawals, transfers, external bank transfers, transaction history, interest calculator, admin dashboard, multi-language support, dark mode, notifications, and more.

📋 Table of Contents
Features

Tech Stack

Project Structure

Installation

API Documentation

Database Schema

Environment Variables

Screenshots

Contributing

License

✨ Features
👤 User Features
Feature	Description
🔐 Authentication	Secure registration and login with JWT
👤 Profile Management	View and update profile with photo upload
🔑 Password Management	Change password securely
💰 Deposit	Add money to your account
💳 Withdraw	Withdraw money from your account
💸 Transfer	Send money to other accounts
🏦 External Transfer	Transfer to other banks (CBE, Awash, Dashen, etc.)
📈 Interest Calculator	Calculate monthly and yearly interest (5% annual)
📊 Transaction History	View all your transactions with filters
🌍 Multi-language	English, Amharic, Oromoo, Tigrigna, Somali
🌙 Dark Mode	Toggle between light and dark themes
🔔 Notifications	Real-time in-app notifications
📱 Responsive	Works on all devices
👑 Admin Features
Feature	Description
📊 Admin Dashboard	View system statistics
👥 User Management	View, activate/deactivate users
📋 Account Management	View all accounts
📝 Transaction Monitoring	View all transactions
⚙️ System Settings	Configure interest rate, currency, maintenance mode
📊 Reports	Generate account statements and reports
🔍 Search	Search users, accounts, and transactions
🔒 Security Features
✅ JWT Authentication

✅ Password Hashing (bcrypt)

✅ Role-based Access Control (Admin/Customer)

✅ Input Validation

✅ Helmet for Security Headers

✅ CORS Configuration

✅ Rate Limiting

✅ Audit Logs

🛠️ Tech Stack
Frontend
Technology	Version	Purpose
React.js	18.2.0	UI Framework
React Router	v6.15.0	Navigation
Axios	1.5.0	HTTP Client
React Toastify	9.1.3	Notifications
CSS3	-	Styling
Backend
Technology	Version	Purpose
Node.js	18+	Runtime Environment
Express.js	4.18.2	Web Framework
MySQL	8.0	Database
JWT	9.0.2	Authentication
Bcryptjs	2.4.3	Password Hashing
Nodemon	3.0.1	Development
Database
MySQL (MAMP)

7 Tables: users, accounts, transactions, transfers, audit_logs, notifications, settings


## 🚀 Features

### User Features

- 🔐 User Registration & Login with JWT
- 👤 Profile Management
- 🔑 Change Password
- 💰 Deposit Money
- 💳 Withdraw Money
- 💸 Transfer Money
- 📊 Transaction History
- 📈 Dashboard with Balance Overview

### Admin Features

- 👥 View All Users
- 📋 View All Accounts
- 📝 View All Transactions
- 📊 Admin Dashboard with Statistics
- 👑 Manage User Roles

### Security Features

- 🔒 Password Hashing with Bcrypt
- 🛡️ JWT Authentication
- 🚦 Input Validation
- 🛡️ Helmet for Security Headers
- 🌐 CORS Configuration

## 🛠️ Tech Stack

### Frontend

- React.js
- React Router v6
- Axios
- React Toastify
- CSS3

### Backend

- Node.js
- Express.js
- MySQL
- JWT
- Bcrypt
- Nodemon

### Database

- MySQL (MAMP)

## 📋 API Documentation

### Auth Endpoints

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login user        |
| GET    | `/api/auth/me`       | Get current user  |

### Account Endpoints

| Method | Endpoint            | Description       |
| ------ | ------------------- | ----------------- |
| GET    | `/api/accounts/me`  | Get user account  |
| GET    | `/api/accounts/:id` | Get account by ID |

### Transaction Endpoints

| Method | Endpoint                                | Description             |
| ------ | --------------------------------------- | ----------------------- |
| POST   | `/api/transactions/deposit`             | Deposit money           |
| POST   | `/api/transactions/withdraw`            | Withdraw money          |
| POST   | `/api/transactions/transfer`            | Transfer money          |
| GET    | `/api/transactions/history/:account_id` | Get transaction history |

### User Endpoints

| Method | Endpoint                     | Description      |
| ------ | ---------------------------- | ---------------- |
| GET    | `/api/users/profile`         | Get user profile |
| PUT    | `/api/users/profile`         | Update profile   |
| PUT    | `/api/users/change-password` | Change password  |

### Admin Endpoints

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/admin/stats`        | Dashboard stats      |
| GET    | `/api/admin/users`        | Get all users        |
| GET    | `/api/admin/accounts`     | Get all accounts     |
| GET    | `/api/admin/transactions` | Get all transactions |

## 📸 Screenshots

### Login Page

![Login](screenshots/login.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Admin Dashboard

![Admin Dashboard](screenshots/admin.png)

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: youremail@gmail.com

## 📄 License

ISC


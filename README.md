# 🏦 Banking System - Complete Documentation

The Banking System is a full-stack web application developed to automate and manage core banking operations within a financial institution. The system helps administrators efficiently handle customer accounts, transactions, fund transfers, interest calculations, and user management.

The application ensures secure authentication using JWT tokens, role-based access control (Admin/Customer), and provides a seamless user experience for managing deposits, withdrawals, transfers, and account information. Customers can view their transaction history, calculate interest on savings accounts, and transfer funds to both internal and external bank accounts.

---

## ✨ Features

### 👤 Customer Features
- **Secure Login Authentication** with JWT
- **User Registration** with account creation
- **Profile Management** (View and Update)
- **Password Change** functionality
- **Deposit** money to account
- **Withdraw** money from account
- **Transfer** funds to other accounts
- **External Transfer** to other banks
- **Transaction History** with filters
- **Interest Calculator** for savings accounts (5% annual)
- **Multi-language Support** (English, Amharic, Oromoo, Tigrigna, Somali)

### 👑 Administrator Features
- **Secure Login Authentication** with JWT
- **Dashboard** with System Statistics
- **User Management** (View all users)
- **Account Management** (View all accounts)
- **Transaction Monitoring** (View all transactions)
- **Role Management** (Customer/Admin)
- **Interest Rate Configuration** (5% default)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js** | UI Framework |
| **React Router v6** | Navigation and Routing |
| **Axios** | HTTP Client for API Calls |
| **React Toastify** | Notifications and Alerts |
| **CSS3** | Custom Styling |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime Environment |
| **Express.js** | Web Framework |
| **JWT** | Authentication and Authorization |
| **bcryptjs** | Password Hashing |
| **MySQL2** | Database Driver |
| **Nodemon** | Development Auto-restart |

### Database
| Technology | Purpose |
|------------|---------|
| **MySQL** | Relational Database |
| **MAMP** | Local Development Server |

---

## 📊 System Modules

| Module | Description |
|--------|-------------|
| **Authentication Module** | User registration, login, JWT token generation, and role-based access control |
| **Account Management Module** | Create and manage customer accounts with unique account numbers |
| **Transaction Module** | Handle deposits, withdrawals, transfers, and transaction history |
| **Interest Module** | Calculate monthly and yearly interest on savings accounts |
| **External Transfer Module** | Transfer funds to other banks (CBE, Awash, Dashen, etc.) |
| **Admin Dashboard Module** | View system statistics and manage users, accounts, and transactions |
| **User Profile Module** | Manage user profiles and change passwords |
| **Multi-language Module** | Support for multiple languages (English, Amharic, Oromoo, Tigrigna, Somali) |
| **Reporting Module** | Transaction summaries and account statements |

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| **users** | Stores user information (name, email, password_hash, role) |
| **accounts** | Stores account details (account_number, balance, type, status) |
| **transactions** | Stores all transaction records (type, amount, description, status) |
| **transfers** | Stores transfer records (from_account, to_account, fee) |
| **audit_logs** | Tracks system activities and user actions |

### Account Types
| Type | Description |
|------|-------------|
| **Savings** | Interest-earning accounts (5% annual) |
| **Checking** | Daily transaction accounts |
| **Fixed** | Fixed deposit accounts |

### Transaction Types
| Type | Description |
|------|-------------|
| **Deposit** | Adding money to account |
| **Withdraw** | Removing money from account |
| **Transfer** | Sending money to another account |
| **Payment** | Making payments |

---

## 🌍 Supported Banks (External Transfer)

| Code | Bank Name |
|------|-----------|
| **CBE** | Commercial Bank of Ethiopia |
| **AWASH** | Awash Bank |
| **DASHEN** | Dashen Bank |
| **WEGAGEN** | Wegagen Bank |
| **UNITED** | United Bank |
| **NIB** | Nib International Bank |
| **ZEMEN** | Zemen Bank |
| **OROMIA** | Oromia Bank |
| **BUNA** | Buna Bank |
| **ABAY** | Abay Bank |
| **ADDIS** | Addis International Bank |
| **SHABELLE** | Shabelle Bank |

---

## 🚀 Installation Guide

### Prerequisites
- Node.js (v16 or higher)
- MySQL (MAMP)
- npm or yarn


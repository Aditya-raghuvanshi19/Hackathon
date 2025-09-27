# Electronics Repair Service API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
All protected routes require a JWT token in the Authorization header:
`Authorization: Bearer <token>`

## API Endpoints

### 1. Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

Request Body:
{
    "email": string,
    "password": string
}

Response: 201 Created
{
    "message": "User created successfully"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

Request Body:
{
    "email": string,
    "password": string
}

Response: 200 OK
{
    "token": string,
    "user": {
        "_id": string,
        "email": string,
        "isAdmin": boolean
    }
}
```

### 2. Services

#### Get All Services
```
GET /services

Response: 200 OK
[
    {
        "_id": string,
        "name": string,
        "description": string,
        "price": number,
        "duration": number,
        "active": boolean
    }
]
```

#### Create Service (Admin only)
```
POST /services
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "name": string,
    "description": string,
    "price": number,
    "duration": number
}

Response: 201 Created
{
    "_id": string,
    "name": string,
    "description": string,
    "price": number,
    "duration": number,
    "active": boolean
}
```

#### Delete Service (Admin only)
```
DELETE /services/:id
Authorization: Bearer <token>

Response: 200 OK
{
    "message": "Service deleted successfully"
}
```

### 3. Repair Requests

#### Create Repair Request
```
POST /repairs
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "serviceId": string,
    "description": string,
    "estimatedCost": number
}

Response: 201 Created
{
    "_id": string,
    "userId": string,
    "serviceId": string,
    "status": string,
    "description": string,
    "estimatedCost": number,
    "createdAt": string
}
```

#### Get Specific Repair
```
GET /repairs/:id
Authorization: Bearer <token>

Response: 200 OK
{
    "_id": string,
    "userId": {
        "_id": string,
        "email": string
    },
    "serviceId": {
        "_id": string,
        "name": string,
        "description": string,
        "price": number
    },
    "status": string,
    "description": string,
    "estimatedCost": number,
    "createdAt": string
}
```

#### Update Repair Status (Admin only)
```
PUT /repairs/:id/status
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "status": string // "pending" | "in-progress" | "completed" | "cancelled"
}

Response: 200 OK
{
    "_id": string,
    "status": string,
    // ... other repair details
}
```

### 4. Payments

#### Process Payment
```
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "repairId": string,
    "amount": number,
    "paymentMethod": string
}

Response: 201 Created
{
    "_id": string,
    "repairId": string,
    "userId": string,
    "amount": number,
    "status": string,
    "paymentMethod": string,
    "transactionId": string,
    "createdAt": string
}
```

#### Get Payment Details
```
GET /payments/:id
Authorization: Bearer <token>

Response: 200 OK
{
    "_id": string,
    "repairId": {
        "_id": string,
        // ... repair details
    },
    "userId": {
        "_id": string,
        "email": string
    },
    "amount": number,
    "status": string,
    "paymentMethod": string,
    "transactionId": string,
    "createdAt": string
}
```

### 5. Reviews

#### Submit Review
```
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "serviceId": string,
    "rating": number (1-5),
    "comment": string
}

Response: 201 Created
{
    "_id": string,
    "userId": string,
    "serviceId": string,
    "rating": number,
    "comment": string,
    "createdAt": string
}
```

#### Get Service Reviews
```
GET /reviews/:serviceId

Response: 200 OK
[
    {
        "_id": string,
        "userId": {
            "_id": string,
            "email": string
        },
        "serviceId": string,
        "rating": number,
        "comment": string,
        "createdAt": string
    }
]
```

### 6. Appointments

#### Create Appointment
```
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "repairRequestId": string,
    "scheduledDateTime": string (ISO date),
    "notes": string
}

Response: 201 Created
{
    "_id": string,
    "repairRequestId": string,
    "userId": string,
    "scheduledDateTime": string,
    "status": string,
    "notes": string
}
```

#### Get User Appointments
```
GET /appointments
Authorization: Bearer <token>

Response: 200 OK
[
    {
        "_id": string,
        "repairRequestId": {
            "_id": string,
            // ... repair details
        },
        "userId": {
            "_id": string,
            "email": string
        },
        "scheduledDateTime": string,
        "status": string,
        "notes": string
    }
]
```

#### Update Appointment
```
PUT /appointments/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "scheduledDateTime": string,
    "status": string,
    "notes": string
}

Response: 200 OK
{
    // Updated appointment details
}
```

#### Cancel Appointment
```
DELETE /appointments/:id
Authorization: Bearer <token>

Response: 200 OK
{
    "message": "Appointment canceled successfully"
}
```

## Key Features Required in Frontend

1. **Authentication System**
   - User registration and login forms
   - JWT token management
   - Protected route handling

2. **User Dashboard**
   - Overview of user's repairs
   - Appointment management
   - Payment history

3. **Service Management**
   - Service listing page
   - Service details view
   - Admin panel for service management

4. **Repair Request System**
   - Repair request form
   - Status tracking
   - History view

5. **Appointment System**
   - Appointment booking interface
   - Calendar/datetime selection
   - Appointment management

6. **Payment System**
   - Payment processing interface
   - Payment confirmation
   - Payment history

7. **Review System**
   - Review submission form
   - Rating system
   - Review display for services

## Required Features for Frontend Routes

1. `/` - Home page with service overview
2. `/login` - User login
3. `/register` - User registration
4. `/dashboard` - User dashboard
5. `/services` - Service listing
6. `/services/:id` - Service details
7. `/repairs/new` - Create repair request
8. `/repairs/:id` - Repair details
9. `/appointments` - Appointment management
10. `/admin` - Admin dashboard (protected)

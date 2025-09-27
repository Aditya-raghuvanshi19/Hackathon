




export const baseUrl = "https://electronic-repair-server.vercel.app/api";

export const categories = [
  {
    id: "authentication",
    title: "Authentication",
    description: "API endpoints for user registration and authentication.",
  },
  {
    id: "services",
    title: "Services",
    description: "API endpoints to manage repair services offered.",
  },
  {
    id: "repairs",
    title: "Repair Requests",
    description: "API endpoints for creating and managing repair requests.",
  },
  {
    id: "payments",
    title: "Payments",
    description: "API endpoints for processing and managing payments.",
  },
  {
    id: "reviews",
    title: "Reviews",
    description: "API endpoints for managing customer reviews.",
  },
  {
    id: "appointments",
    title: "Appointments",
    description: "API endpoints for scheduling and managing appointments.",
  },
];

export const endpoints = [
  {
    id: "register",
    category: "authentication",
    title: "Register User",
    method: "POST",
    path: "/auth/register",
    description: "Create a new user account.",
    authentication: false,
    requestBody: {
      email: { type: "string", required: true, description: "User's email address" },
      password: { type: "string", required: true, description: "User's password" },
    },
    responseBody: "201 Created",
    responseExample: `{
  "message": "User created successfully"
}`,
  },
  {
    id: "login",
    category: "authentication",
    title: "Login",
    method: "POST",
    path: "/auth/login",
    description: "Authenticate a user and get a JWT token.",
    authentication: false,
    requestBody: {
      email: { type: "string", required: true, description: "User's email address" },
      password: { type: "string", required: true, description: "User's password" },
    },
    responseBody: "200 OK",
    responseExample: `{
  "token": "string",
  "user": {
    "_id": "string",
    "email": "string",
    "isAdmin": "boolean"
  }
}`,
  },
  {
    id: "get-services",
    category: "services",
    title: "Get All Services",
    method: "GET",
    path: "/services",
    description: "Retrieve a list of all available repair services.",
    authentication: false,
    responseBody: "200 OK",
    responseExample: `[
  {
    "_id": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "duration": "number",
    "active": "boolean"
  }
]`,
  },
  {
    id: "create-service",
    category: "services",
    title: "Create Service",
    method: "POST",
    path: "/services",
    description: "Create a new repair service (Admin only).",
    authentication: true,
    requestBody: {
      name: { type: "string", required: true, description: "Service name" },
      description: { type: "string", required: true, description: "Service description" },
      price: { type: "number", required: true, description: "Service price" },
      duration: { type: "number", required: true, description: "Service duration in minutes" },
    },
    responseBody: "201 Created",
    responseExample: `{
  "_id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "duration": "number",
  "active": "boolean"
}`,
  },
  {
    id: "delete-service",
    category: "services",
    title: "Delete Service",
    method: "DELETE",
    path: "/services/:id",
    description: "Delete a repair service by ID (Admin only).",
    authentication: true,
    responseBody: "200 OK",
    responseExample: `{
  "message": "Service deleted successfully"
}`,
  },
  {
    id: "create-repair",
    category: "repairs",
    title: "Create Repair Request",
    method: "POST",
    path: "/repairs",
    description: "Create a new repair request.",
    authentication: true,
    requestBody: {
      serviceId: { type: "string", required: true, description: "ID of the service requested" },
      description: { type: "string", required: true, description: "Description of the repair needed" },
      estimatedCost: { type: "number", required: true, description: "Estimated cost of the repair" },
    },
    responseBody: "201 Created",
    responseExample: `{
  "_id": "string",
  "userId": "string",
  "serviceId": "string",
  "status": "string",
  "description": "string",
  "estimatedCost": "number",
  "createdAt": "string"
}`,
  },
  {
    id: "get-repair",
    category: "repairs",
    title: "Get Specific Repair",
    method: "GET",
    path: "/repairs/:id",
    description: "Get details of a specific repair request.",
    authentication: true,
    responseBody: "200 OK",
    responseExample: `{
  "_id": "string",
  "userId": {
    "_id": "string",
    "email": "string"
  },
  "serviceId": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "price": "number"
  },
  "status": "string",
  "description": "string",
  "estimatedCost": "number",
  "createdAt": "string"
}`,
  },
  {
    id: "update-repair-status",
    category: "repairs",
    title: "Update Repair Status",
    method: "PUT",
    path: "/repairs/:id/status",
    description: "Update the status of a repair request (Admin only).",
    authentication: true,
    requestBody: {
      status: { type: "string", required: true, description: "'pending' | 'in-progress' | 'completed' | 'cancelled'" },
    },
    responseBody: "200 OK",
    responseExample: `{
  "_id": "string",
  "status": "string",
  "// ...": "other repair details"
}`,
  },
  {
    id: "process-payment",
    category: "payments",
    title: "Process Payment",
    method: "POST",
    path: "/payments",
    description: "Process a payment for a repair request.",
    authentication: true,
    requestBody: {
      repairId: { type: "string", required: true, description: "ID of the repair being paid for" },
      amount: { type: "number", required: true, description: "Payment amount" },
      paymentMethod: { type: "string", required: true, description: "Method of payment" },
    },
    responseBody: "201 Created",
    responseExample: `{
  "_id": "string",
  "repairId": "string",
  "userId": "string",
  "amount": "number",
  "status": "string",
  "paymentMethod": "string",
  "transactionId": "string",
  "createdAt": "string"
}`,
  },
  {
    id: "get-payment",
    category: "payments",
    title: "Get Payment Details",
    method: "GET",
    path: "/payments/:id",
    description: "Get details of a specific payment.",
    authentication: true,
    responseBody: "200 OK",
    responseExample: `{
  "_id": "string",
  "repairId": {
    "_id": "string",
    "// ...": "repair details"
  },
  "userId": {
    "_id": "string",
    "email": "string"
  },
  "amount": "number",
  "status": "string",
  "paymentMethod": "string",
  "transactionId": "string",
  "createdAt": "string"
}`,
  },
  {
    id: "submit-review",
    category: "reviews",
    title: "Submit Review",
    method: "POST",
    path: "/reviews",
    description: "Submit a review for a repair service.",
    authentication: true,
    requestBody: {
      serviceId: { type: "string", required: true, description: "ID of the service being reviewed" },
      rating: { type: "number", required: true, description: "Rating from 1-5" },
      comment: { type: "string", required: true, description: "Review comment" },
    },
    responseBody: "201 Created",
    responseExample: `{
  "_id": "string",
  "userId": "string",
  "serviceId": "string",
  "rating": "number",
  "comment": "string",
  "createdAt": "string"
}`,
  },
  {
    id: "get-reviews",
    category: "reviews",
    title: "Get Service Reviews",
    method: "GET",
    path: "/reviews/:serviceId",
    description: "Get all reviews for a specific service.",
    authentication: false,
    responseBody: "200 OK",
    responseExample: `[
  {
    "_id": "string",
    "userId": {
      "_id": "string",
      "email": "string"
    },
    "serviceId": "string",
    "rating": "number",
    "comment": "string",
    "createdAt": "string"
  }
]`,
  },
  {
    id: "create-appointment",
    category: "appointments",
    title: "Create Appointment",
    method: "POST",
    path: "/appointments",
    description: "Create a new appointment for a repair request.",
    authentication: true,
    requestBody: {
      repairRequestId: { type: "string", required: true, description: "ID of the repair request" },
      scheduledDateTime: { type: "string", required: true, description: "ISO date string" },
      notes: { type: "string", required: false, description: "Additional notes" },
    },
    responseBody: "201 Created",
    responseExample: `{
  "_id": "string",
  "repairRequestId": "string",
  "userId": "string",
  "scheduledDateTime": "string",
  "status": "string",
  "notes": "string"
}`,
  },
  {
    id: "get-appointments",
    category: "appointments",
    title: "Get User Appointments",
    method: "GET",
    path: "/appointments",
    description: "Get all appointments for the authenticated user.",
    authentication: true,
    responseBody: "200 OK",
    responseExample: `[
  {
    "_id": "string",
    "repairRequestId": {
      "_id": "string",
      "// ...": "repair details"
    },
    "userId": {
      "_id": "string",
      "email": "string"
    },
    "scheduledDateTime": "string",
    "status": "string",
    "notes": "string"
  }
]`,
  },
  {
    id: "update-appointment",
    category: "appointments",
    title: "Update Appointment",
    method: "PUT",
    path: "/appointments/:id",
    description: "Update an existing appointment.",
    authentication: true,
    requestBody: {
      scheduledDateTime: { type: "string", required: false, description: "ISO date string" },
      status: { type: "string", required: false, description: "Appointment status" },
      notes: { type: "string", required: false, description: "Additional notes" },
    },
    responseBody: "200 OK",
    responseExample: `{
  "// ...": "Updated appointment details"
}`,
  },
  {
    id: "cancel-appointment",
    category: "appointments",
    title: "Cancel Appointment",
    method: "DELETE",
    path: "/appointments/:id",
    description: "Cancel an existing appointment.",
    authentication: true,
    responseBody: "200 OK",
    responseExample: `{
  "message": "Appointment canceled successfully"
}`,
  },
];

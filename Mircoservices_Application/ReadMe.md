# Microservices Inventory & Order Management System

A full-stack microservices application built with FastAPI, Redis, Docker, and React. Features an event-driven architecture using Redis Streams for asynchronous order processing and automatic inventory management.

---

## Architecture

```
┌─────────────────┐        ┌─────────────────┐
│   React Frontend │        │   React Frontend │
│   localhost:3000 │        │   localhost:3000 │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐        ┌─────────────────┐
│ Inventory Service│        │ Payment Service  │
│  FastAPI :8003   │◄──────►│  FastAPI :8004   │
│    Redis db=0    │        │    Redis db=1    │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         └──────────┬────────────────┘
                    ▼
          ┌──────────────────┐
          │   Redis Instance  │
          │    Port: 6379     │
          │  db=0 (inventory) │
          │  db=1 (payment)   │
          └──────────────────┘
```

## Event-Driven Flow

```
POST /orders
     │
     ▼
Fetch product from Inventory Service
     │
     ▼
Create Order (status: pending)
     │
     ▼
Background Task waits 5 seconds
     │
     ▼
Publish to Redis Stream: order_completed
     │
     ├──► Inventory Consumer: reduce product quantity
     │         │
     │         └──► Product deleted? → publish to refund_order stream
     │
     └──► Payment Consumer: set order status = refunded
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Database | Redis + Redis OM |
| Messaging | Redis Streams |
| Containerization | Docker + Docker Compose |
| Frontend | React |
| HTTP Client | httpx |

---

## Project Structure

```
project/
├── compose.yaml
├── inventory/
│   ├── main.py
│   ├── consumer.py
│   ├── Dockerfile
│   └── requirements.txt
├── payment/
│   ├── main.py
│   ├── consumer.py
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   └── App.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js (for frontend)

### Run the backend services

```bash
docker compose up --build
```

This starts:
- Inventory service at `http://localhost:8003`
- Payment service at `http://localhost:8004`
- Redis at `localhost:6379`

### Run the consumers

In two separate terminals:

```bash
# Terminal 1 - Inventory consumer
cd inventory
python consumer.py

# Terminal 2 - Payment consumer
cd payment
python consumer.py
```

### Run the frontend

```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000`

---

## API Endpoints

### Inventory Service (port 8003)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all products |
| POST | `/products` | Create a product |
| GET | `/products/{id}` | Get a product |
| DELETE | `/products/{id}` | Delete a product |

### Payment Service (port 8004)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders` | List all orders |
| POST | `/orders` | Create an order |
| GET | `/orders/{id}` | Get an order |

---

## Example Requests

### Create a product
```bash
curl -X POST http://localhost:8003/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Apple", "price": 1.99, "quantity": 100}'
```

### Place an order
```bash
curl -X POST http://localhost:8004/orders \
  -H "Content-Type: application/json" \
  -d '{"id": "<product_id>", "quantity": 5}'
```

---

## Key Features

- **Microservices architecture** — independently deployable services
- **Event-driven order processing** — Redis Streams for async communication
- **Automatic refund flow** — orders refunded if product is deleted during processing
- **Live reload** — volume mounts + uvicorn `--reload` for fast development
- **Separate Redis databases** — inventory on `db=0`, payment on `db=1`
- **React frontend** — full CRUD for products and order management

---

## Environment

All services run in Docker containers and communicate via Docker's internal network. Services reference each other by service name (e.g. `http://inventory:8003`) rather than localhost.
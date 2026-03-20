from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from redis_om import HashModel, get_redis_connection
from fastapi.background import BackgroundTasks
import httpx, time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:8004', 'http://localhost:3000'],  # ✅ clean
    allow_methods=['*'],
    allow_headers=['*'],
)

redis = get_redis_connection(
    host="redis",
    port=6379,
    db=1,
    decode_responses=True
)

class Order(HashModel, index=True):
    product_id: str
    price: float
    fee: float
    total: float
    quantity: int
    status: str

    class Meta:
        database = redis

@app.get('/orders')
def get_orders():
    pks = Order.all_pks()
    return [Order.get(pk) for pk in pks]

@app.get('/orders/{id}')
def get(id: str):
    return Order.get(id)

@app.post("/orders")
async def create(request: Request, background_task: BackgroundTasks):
    body = await request.json()
    req = httpx.get('http://inventory:8003/products/%s' % body['id'])
    product = req.json()
    order = Order(
        product_id=body['id'],
        price=product['price'],
        fee=0.2*product['price'],
        total=1.2*product['price'],
        quantity=body['quantity'],
        status='pending'
    )
    order.save()
    background_task.add_task(order_completed, order)
    return order

def order_completed(order: Order):
    time.sleep(5)
    order.status = "completed"
    order.save()
    redis.xadd('order_completed', order.model_dump(), '*')
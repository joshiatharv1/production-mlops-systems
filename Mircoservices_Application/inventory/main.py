from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis_om import HashModel, get_redis_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:8003', 'http://localhost:3000'],
    allow_methods=['*'],
    allow_headers=['*'],
)

redis = get_redis_connection(
    host="redis",
    port=6379,
    db=0,
    decode_responses=True
)

class Product(HashModel, index=True):
    name: str
    price: float
    quantity: int

    class Meta:
        database = redis

def get_product_detail(pk: str):
    product = Product.get(pk)
    return {
        'id': product.pk,
        'name': product.name,
        'price': product.price,
        'quantity': product.quantity
    }

@app.get("/")
def read_user():
    return {"Data": "Hello World"}

@app.get("/products")
async def get_products():
    return [get_product_detail(pk) for pk in Product.all_pks()]

@app.post('/products')
def create_product(product: Product):
    product.save()
    return product   # ✅ fixed

@app.get('/products/{id}')
def get_product_id(id: str):
    return Product.get(id)

@app.delete('/products/{id}')
def remove_product_id(id: str):
    return Product.delete(id)
import time
import redis as redis_lib
from inventory.main import Product

r = redis_lib.Redis(
    host="localhost",
    port=6379,
    db=1,
    decode_responses=True
)

key = 'order_completed'
group = "inventory_group"

try:
    r.xgroup_create(key, group, '$', mkstream=True)
except:
    print('Group Exists Already!')

while True:
    try:
        results = r.xreadgroup(group, key, {key: '>'}, None)
        if results:
            for stream, messages in results:          
                for message_id, obj in messages:      
                    try:
                        product = Product.get(obj['product_id'])
                        product.quantity = product.quantity - int(obj['quantity'])
                        product.save()
                        print(f"Updated product quantity: {product}")
                    except:
                        r.xadd('refund_order', obj, '*')  
    except Exception as e:
        print(str(e))
    time.sleep(1)
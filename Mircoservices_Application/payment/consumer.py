import time
import redis as redis_lib
from payment.main import Order

r = redis_lib.Redis(
    host="localhost",
    port=6379,
    db=1,
    decode_responses=True
)

key = 'refund_order'       # 👈 fixed to match inventory consumer
group = "payment_group"

try:
    r.xgroup_create(key, group, '$', mkstream=True)
except:
    print('Group Exists Already!')

while True:
    try:
        results = r.xreadgroup(group, key, {key: '>'}, None)
        if results:
            for stream, messages in results:          # 👈 correct parsing
                for message_id, obj in messages:      # 👈 correct parsing
                    order = Order.get(obj['pk'])       # 👈 fixed key
                    order.status = 'refunded'
                    order.save()
                    print(f"Order refunded: {order}")
    except Exception as e:
        print(str(e))
    time.sleep(1)

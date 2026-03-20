import { useState, useEffect, useCallback } from "react";

const INV = "http://localhost:8003";
const PAY = "http://localhost:8004";

const api = {
  getProducts: () => fetch(`${INV}/products`).then(r => r.json()),
  createProduct: body => fetch(`${INV}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteProduct: id => fetch(`${INV}/products/${id}`, { method: "DELETE" }).then(r => r.json()),
  getOrders: () => fetch(`${PAY}/orders`).then(r => r.json()),
  getOrder: id => fetch(`${PAY}/orders/${id}`).then(r => r.json()),
  createOrder: body => fetch(`${PAY}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
};

const statusColor = s => ({ pending: "#b47d00", completed: "#1a7a4a", refunded: "#a32d2d" }[s] || "#555");
const statusBg = s => ({ pending: "#faeeda", completed: "#eaf3de", refunded: "#fcebeb" }[s] || "#eee");

export default function App() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [newProduct, setNewProduct] = useState({ name: "", price: "", quantity: "" });
  const [newOrder, setNewOrder] = useState({ id: "", quantity: "" });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      // backend already returns full objects, just use them directly!
      setProducts(data);
    } catch { showToast("Could not connect to inventory service", "error"); }
    setLoading(false);
}, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data);  // 👈 just use directly, no second fetch needed
    } catch { showToast("Could not connect to payment service", "error"); }
    setLoading(false);
}, []);

  useEffect(() => { tab === "products" ? loadProducts() : loadOrders(); }, [tab]);

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) return showToast("Fill all fields", "error");
    try {
      await api.createProduct({ name: newProduct.name, price: parseFloat(newProduct.price), quantity: parseInt(newProduct.quantity) });
      setNewProduct({ name: "", price: "", quantity: "" });
      showToast("Product created!");
      loadProducts();
    } catch { showToast("Failed to create product", "error"); }
  };

  const handleDeleteProduct = async (pk) => {
    try {
      await api.deleteProduct(pk);
      showToast("Product deleted");
      loadProducts();
    } catch { showToast("Failed to delete product", "error"); }
  };

  const handlePlaceOrder = async () => {
    if (!newOrder.quantity) return showToast("Enter quantity", "error");
    try {
      await api.createOrder({ id: selectedProduct.id, quantity: parseInt(newOrder.quantity) });
      setShowOrderModal(false);
      setNewOrder({ id: "", quantity: "" });
      showToast("Order placed! Status: pending");
      setTab("orders");
    } catch { showToast("Failed to place order", "error"); }
  };

  const inp = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
  const btn = (color = "#1a1a1a") => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 500 });

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: toast.type === "error" ? "#fcebeb" : "#eaf3de", color: toast.type === "error" ? "#a32d2d" : "#1a7a4a", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 999, border: `1px solid ${toast.type === "error" ? "#f09595" : "#97c459"}` }}>
          {toast.msg}
        </div>
      )}

      <h2 style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 22 }}>Inventory & Orders</h2>
      <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>Manage products and track orders</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["products", "orders"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t ? "#1a1a1a" : "#f0f0f0"), color: tab === t ? "#fff" : "#333", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
        <button onClick={() => tab === "products" ? loadProducts() : loadOrders()} style={{ ...btn("#f0f0f0"), color: "#333", marginLeft: "auto" }}>
          Refresh
        </button>
      </div>

      {tab === "products" && (
        <>
          <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 500, fontSize: 14 }}>Add new product</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Name</label>
                <input style={inp} placeholder="Apple" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Price ($)</label>
                <input style={inp} type="number" placeholder="1.99" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Quantity</label>
                <input style={inp} type="number" placeholder="100" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} />
              </div>
              <button style={btn()} onClick={handleCreateProduct}>Add</button>
            </div>
          </div>

          {loading ? <p style={{ color: "#888", fontSize: 14 }}>Loading products...</p> : (
            <div style={{ display: "grid", gap: 10 }}>
              {products.length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No products yet. Add one above!</p>}
              {products.map(p => (
                <div key={p.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>{p.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>ID: {p.id?.slice(0, 16)}...</p>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>${parseFloat(p.price).toFixed(2)}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>price</p>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: p.quantity < 10 ? "#a32d2d" : "#1a1a1a" }}>{p.quantity}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>in stock</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setSelectedProduct(p); setShowOrderModal(true); }} style={btn("#1a7a4a")}>Order</button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={btn("#a32d2d")}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "orders" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total orders", value: orders.length },
              { label: "Completed", value: orders.filter(o => o.status === "completed").length },
              { label: "Pending", value: orders.filter(o => o.status === "pending").length },
            ].map(s => (
              <div key={s.label} style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {loading ? <p style={{ color: "#888", fontSize: 14 }}>Loading orders...</p> : (
            <div style={{ display: "grid", gap: 10 }}>
              {orders.length === 0 && <p style={{ color: "#aaa", fontSize: 14 }}>No orders yet. Go to Products and place an order!</p>}
              {orders.map(o => (
                <div key={o.pk} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>Order #{o.pk?.slice(0, 10)}...</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Product: {o.product_id?.slice(0, 16)}...</p>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>x{o.quantity}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>qty</p>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 70 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>${parseFloat(o.total || 0).toFixed(2)}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>total</p>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 70 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>fee</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#888" }}>${parseFloat(o.fee || 0).toFixed(2)}</p>
                  </div>
                  <span style={{ background: statusBg(o.status), color: statusColor(o.status), padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showOrderModal && selectedProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600 }}>Place Order</h3>
            <p style={{ margin: "0 0 20px", color: "#888", fontSize: 13 }}>Ordering: {selectedProduct.name}</p>
            <div style={{ background: "#fafafa", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#888" }}>Price</span><span>${parseFloat(selectedProduct.price).toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#888" }}>Fee (20%)</span><span>${(0.2 * selectedProduct.price).toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, borderTop: "1px solid #eee", paddingTop: 8, marginTop: 4 }}><span>Total</span><span>${(1.2 * selectedProduct.price).toFixed(2)}</span></div>
            </div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Quantity</label>
            <input style={{ ...inp, marginBottom: 16 }} type="number" min="1" placeholder="1" value={newOrder.quantity} onChange={e => setNewOrder({ ...newOrder, quantity: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btn("#f0f0f0"), color: "#333", flex: 1 }} onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button style={{ ...btn(), flex: 1 }} onClick={handlePlaceOrder}>Confirm Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
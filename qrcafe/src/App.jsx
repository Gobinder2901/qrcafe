import { useEffect, useState, useRef } from "react";
import "./App.css";

function ItemSheet({ itemId, onClose, onAddToCart, themeColor }) {
    const [detail, setDetail] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState({});
    const [loading, setLoading] = useState(true);
    const prevItemId = useRef(null);

    useEffect(() => {
        if (prevItemId.current === itemId) return;
        prevItemId.current = itemId;
        let cancelled = false;
        fetch(`http://localhost:5021/api/item/${itemId}`)
            .then(res => res.json())
            .then(data => {
                if (!cancelled) {
                    setDetail(data);
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [itemId]);

    const toggleAddon = (group, option) => {
        setSelectedAddons(prev => {
            const current = prev[group.id] || [];
            const already = current.find(o => o.id === option.id);
            if (group.selection_type === "single") {
                return { ...prev, [group.id]: already ? [] : [option] };
            } else {
                if (already) return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
                if (current.length >= group.max_select) return prev;
                return { ...prev, [group.id]: [...current, option] };
            }
        });
    };

    const isSelected = (groupId, optionId) =>
        (selectedAddons[groupId] || []).some(o => o.id === optionId);

    const addonsTotal = Object.values(selectedAddons).flat()
        .reduce((sum, o) => sum + Number(o.extra_price), 0);

    const handleAdd = () => {
        if (!detail) return;
        onAddToCart(detail.item, Object.values(selectedAddons).flat(), addonsTotal);
        onClose();
    };

    const isVeg = detail?.item?.is_veg;
    const vegColor = isVeg ? "#4CAF50" : "#e53935";

    return (
        <div className="sheet-backdrop" onClick={onClose}>
            <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle" />
                {loading ? (
                    <div className="sheet-loading">Loading...</div>
                ) : detail ? (
                    <>
                        <div className="sheet-img-wrap">
                            {detail.item.image
                                ? <img src={detail.item.image} alt={detail.item.name} className="sheet-img" />
                                : <div className="sheet-img-placeholder" />}
                        </div>
                        <div className="sheet-scroll">
                            <div className="sheet-body">
                                <div className="sheet-top-row">
                                    <div className="sheet-name">{detail.item.name}</div>
                                    <div className="sheet-price" style={{ color: themeColor }}>
                                        ₹ {Number(detail.item.price) + addonsTotal}
                                    </div>
                                </div>
                                <div className="veg-indicator-row">
                                    <div className="veg-box" style={{ borderColor: vegColor }}>
                                        {isVeg
                                            ? <div className="veg-circle" style={{ background: vegColor }} />
                                            : <div className="nonveg-triangle" style={{ borderBottomColor: vegColor }} />}
                                    </div>
                                    <span className="veg-text" style={{ color: vegColor }}>
                                        {isVeg ? "Vegetarian" : "Non-vegetarian"}
                                    </span>
                                </div>
                                {detail.item.description && (
                                    <p className="sheet-desc">{detail.item.description}</p>
                                )}
                                {detail.addons && detail.addons.length > 0 && (
                                    <div className="addons-wrap">
                                        {detail.addons.map(group => (
                                            <div key={group.id} className="addon-group">
                                                <div className="addon-group-name" style={{ color: themeColor }}>
                                                    {group.name}
                                                </div>
                                                {group.description && (
                                                    <div className="addon-group-desc">{group.description}</div>
                                                )}
                                                <div className="addon-pills">
                                                    {group.options.map(opt => {
                                                        const sel = isSelected(group.id, opt.id);
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                className="addon-pill"
                                                                style={sel ? {
                                                                    borderColor: vegColor,
                                                                    color: vegColor,
                                                                    background: isVeg
                                                                        ? "rgba(76,175,80,0.1)"
                                                                        : "rgba(229,57,53,0.1)"
                                                                } : {}}
                                                                onClick={() => toggleAddon(group, opt)}
                                                            >
                                                                {opt.name}
                                                                {Number(opt.extra_price) > 0 && (
                                                                    <span className="pill-extra"> +₹{opt.extra_price}</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="sheet-footer">
                            <div className="sheet-btn-row">
                                <button className="sheet-btn-back"
                                    style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                                    onClick={onClose}>← Back</button>
                                <button className="sheet-btn-add"
                                    style={{ borderColor: vegColor, color: vegColor }}
                                    onClick={handleAdd}>Add to order →</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="sheet-loading">Item not found</div>
                )}
            </div>
        </div>
    );
}

function InvalidToken() {
    return (
        <div className="invalid-screen">
            <div className="invalid-icon">⚠</div>
            <h2>Invalid QR Code</h2>
            <p>This QR code is not recognised or has expired.<br />Please scan the QR code on your table again.</p>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="invalid-screen">
            <p style={{ color: "#555" }}>Loading menu...</p>
        </div>
    );
}

function App() {
    const [tableInfo, setTableInfo] = useState(null);
    const [tokenStatus, setTokenStatus] = useState("loading");
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [openItemId, setOpenItemId] = useState(null);

    // Step 1: resolve token → table info
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        // read token synchronously — no setState needed before the fetch
        if (!token) {
            // defer to next tick to avoid synchronous setState in effect body
            const t = setTimeout(() => setTokenStatus("invalid"), 0);
            return () => clearTimeout(t);
        }

        let cancelled = false;
        fetch(`http://localhost:5021/api/table?token=${token}`)
            .then(res => {
                if (!res.ok) throw new Error("not found");
                return res.json();
            })
            .then(data => {
                if (cancelled) return;
                setTableInfo(data);
                setTokenStatus("valid");
                document.documentElement.style.setProperty("--theme", data.theme_color || "#D4AF37");
            })
            .catch(() => { if (!cancelled) setTokenStatus("invalid"); });

        return () => { cancelled = true; };
    }, []);

    // Step 2: once table info is known, load menu
    useEffect(() => {
        if (!tableInfo) return;
        let cancelled = false;
        fetch(`http://localhost:5021/api/menu?branch_id=${tableInfo.branch_id}`)
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                setMenu(data);
                if (data.length > 0) setActiveCategory(data[0].category);
            });
        return () => { cancelled = true; };
    }, [tableInfo]);

    const addToCart = (item, addons, addonsTotal) => {
        const key = item.id + "_" + addons.map(a => a.id).join("_");
        const existing = cart.find(c => c.key === key);
        if (existing) {
            setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, {
                key, id: item.id, name: item.name,
                basePrice: Number(item.price),
                addonsTotal, price: Number(item.price) + addonsTotal,
                addons, qty: 1
            }]);
        }
    };

    const removeFromCart = (key) =>
        setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));

    const getQty = (id) => cart.filter(c => c.id === id).reduce((s, c) => s + c.qty, 0);
    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

    const placeOrder = async () => {
        if (!tableInfo) return;
        const orderData = {
            restaurant_id: tableInfo.restaurant_id,
            branch_id: tableInfo.branch_id,
            table_id: tableInfo.table_id,
            total_amount: total,
            items: cart.map(c => ({ item_id: c.id, quantity: c.qty, price: c.price }))
        };
        try {
            const res = await fetch("http://localhost:5021/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            alert("Order placed! Order #" + data.order_no);
            setCart([]);
        } catch (err) {
            alert("Error placing order");
            console.error(err);
        }
    };

    const scrollToCategory = (category) => {
        setActiveCategory(category);
        const el = document.getElementById("cat-" + category);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (tokenStatus === "loading") return <LoadingScreen />;
    if (tokenStatus === "invalid") return <InvalidToken />;

    const themeColor = tableInfo?.theme_color || "#D4AF37";

    return (
        <div className="app">
            <div className="hero">
                <div className="hero-bg" style={{
                    backgroundImage: `url('${tableInfo.hero_image_url || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80"}')`
                }} />
                <div className="hero-overlay" />
                <div className="hero-content">
                    <span className="restaurant-tag" style={{ color: themeColor }}>
                        {tableInfo.restaurant_name}
                    </span>
                    <h1 className="hero-title">{tableInfo.branch_subtitle || tableInfo.branch_name}</h1>
                    <p className="hero-sub">{tableInfo.tagline}</p>
                    <div className="table-badge" style={{
                        background: `${themeColor}18`,
                        borderColor: `${themeColor}55`
                    }}>
                        <span className="table-dot" style={{ background: themeColor }} />
                        <span style={{ color: themeColor }}>
                            {tableInfo.table_number} &nbsp;·&nbsp; Dine in
                        </span>
                    </div>
                </div>
            </div>

            <div className="cat-bar">
                {menu.map((cat, i) => (
                    <button
                        key={i}
                        className={"cat-pill" + (activeCategory === cat.category ? " active" : "")}
                        style={activeCategory === cat.category
                            ? { background: themeColor, borderColor: themeColor, color: "#0a0a0a" }
                            : {}}
                        onClick={() => scrollToCategory(cat.category)}
                    >
                        {cat.category}
                    </button>
                ))}
            </div>

            <div className="menu-body">
                {menu.map((cat, i) => (
                    <div key={i} id={"cat-" + cat.category} className="cat-section">
                        <div className="cat-heading">
                            <span className="cat-label" style={{ color: themeColor }}>{cat.category}</span>
                            <span className="cat-count">{cat.items.length} dishes</span>
                        </div>
                        <div className="items-grid">
                            {cat.items.map(item => {
                                const qty = getQty(item.id);
                                const vegColor = item.is_veg ? "#4CAF50" : "#e53935";
                                return (
                                    <div className="item-card" key={item.id}
                                        onClick={() => setOpenItemId(item.id)}>
                                        <div className="item-img-wrap">
                                            {item.image
                                                ? <img src={item.image} alt={item.name} className="item-img" />
                                                : <div className="item-img-placeholder" />}
                                        </div>
                                        <div className="item-body">
                                            <div className="item-name-row">
                                                <div className="veg-box-sm" style={{ borderColor: vegColor }}>
                                                    {item.is_veg
                                                        ? <div className="veg-circle-sm" style={{ background: vegColor }} />
                                                        : <div className="nonveg-tri-sm" style={{ borderBottomColor: vegColor }} />}
                                                </div>
                                                <span className="item-name">{item.name}</span>
                                            </div>
                                            <span className="item-desc">Tap to view &amp; customise</span>
                                            <div className="item-footer">
                                                <span className="item-price" style={{ color: themeColor }}>
                                                    ₹ {item.price}
                                                </span>
                                                <div className="item-action" onClick={e => e.stopPropagation()}>
                                                    {qty === 0 ? (
                                                        <button className="add-btn"
                                                            style={{ background: themeColor }}
                                                            onClick={() => setOpenItemId(item.id)}>+</button>
                                                    ) : (
                                                        <div className="qty-ctrl">
                                                            <button style={{ color: themeColor }} onClick={() => {
                                                                const last = [...cart].reverse().find(c => c.id === item.id);
                                                                if (last) removeFromCart(last.key);
                                                            }}>−</button>
                                                            <span>{qty}</span>
                                                            <button style={{ color: themeColor }}
                                                                onClick={() => setOpenItemId(item.id)}>+</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {cart.length > 0 && <div className="sticky-spacer" />}

            {cart.length > 0 && (
                <div className="sticky-bar">
                    <div className="sticky-inner">
                        <div className="sticky-info">
                            <span className="sticky-count">
                                {totalItems} {totalItems === 1 ? "item" : "items"}
                            </span>
                            <span className="sticky-total">₹ {total}</span>
                        </div>
                        <button className="place-order-btn"
                            style={{ background: themeColor }}
                            onClick={placeOrder}>
                            Place order →
                        </button>
                    </div>
                </div>
            )}

            {openItemId && (
                <ItemSheet
                    itemId={openItemId}
                    onClose={() => setOpenItemId(null)}
                    onAddToCart={addToCart}
                    themeColor={themeColor}
                />
            )}
        </div>
    );
}

export default App;
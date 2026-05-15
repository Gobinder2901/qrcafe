import { useEffect, useState, useRef } from "react";
import "./App.css";
import React from "react";

const API_BASE = "https://scannermenu-api.onrender.com";

// ============================================================
// TOAST (in-UI popup — replaces browser alerts)
// ============================================================
function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={"toast" + (t.kind === "error" ? " toast-error" : "")}
                    onClick={() => onDismiss(t.id)}>
                    <div className="toast-icon">{t.icon || "✓"}</div>
                    <div className="toast-body">
                        <div className="toast-title">{t.title}</div>
                        {t.message && <div className="toast-message">{t.message}</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// HERO IMAGE CAROUSEL (auto-rotates every 4s; text stays static)
// ============================================================
function HeroCarousel({ images, current }) {
    if (!images || images.length === 0) return null;
    return (
        <>
            {images.map((url, i) => (
                <div key={i}
                    className={"hero-bg" + (i === current ? " hero-bg-active" : "")}
                    style={{ backgroundImage: `url('${url}')` }} />
            ))}
        </>
    );
}

// ============================================================
// ORDER TRACKER — persistent bottom bar
// ============================================================


function OrderTrackerMini({ orders, themeColor, onClick, bottomOffset }) {
    if (!orders || orders.length === 0) return null;
    const latest = orders[orders.length - 1];
    const stageLabels = {
        awaiting: "Under review", confirmed: "Confirmed",
        cooking: "Cooking", served: "Served"
    };
    const label = stageLabels[latest.status] || latest.status;
    const count = orders.length;

    return (
        <div className="tracker-mini" style={{ bottom: bottomOffset || 0 }} onClick={onClick}>
            <div className="tracker-pulse-wrap">
                <span className="tracker-pulse" style={{ background: themeColor }} />
                <span className="tracker-pulse-ring" style={{ borderColor: themeColor }} />
            </div>
            <div className="tracker-text">
                <div className="tracker-title">
                    {count === 1 ? "1 active order" : `${count} active orders`}
                </div>
                <div className="tracker-sub">
                    {latest.order_no ? `#${latest.order_no} · ` : ""}{label}
                </div>
            </div>
            <span className="tracker-arrow" style={{ color: themeColor }}>→</span>
        </div>
    );
}

// ============================================================
// ORDER TRACKER SHEET — full progress with 4 stages
// ============================================================

const STAGES = [
    { id: "awaiting", label: "Placed" },
    { id: "confirmed", label: "Confirmed" },
    { id: "cooking", label: "Cooking" },
    { id: "served", label: "Served" }
];

function OrderTrackerSheet({ orders, themeColor, onClose }) {

    const [selectedOrder, setSelectedOrder] = React.useState(null);

    

    return (
        <div className="sheet-backdrop" onClick={onClose}>
            <div className="bottom-sheet tracker-sheet" onClick={e => e.stopPropagation()}>
                <div className="sheet-handle" />

                <div className="sheet-scroll">
                    <div className="sheet-body">
                        <h2 className="tracker-sheet-title">Your orders</h2>
                        <p className="tracker-sheet-sub">Live status from the kitchen</p>

                        {orders.map(order => {
                            const stageIdx = Math.max(0, STAGES.findIndex(s => s.id === order.status));
                            const isPaid = order.payment_status === "paid";

                            return (
                                <div key={order.order_id} className="tracker-order-card">

                                    {/* HEADER */}
                                    <div className="tracker-order-header">
                                        <div className="tracker-order-left">
                                            <span className="tracker-order-no" style={{ color: themeColor }}>
                                                {order.order_no ? `Order #${order.order_no}` : "Order under review : "}
                                            </span>

                                            <span className="tracker-order-status">
                                                {order.status}
                                            </span>
                                        </div>

                                        <span className="tracker-order-amount">
                                            ₹ {Number(order.total_amount).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* STAGES */}
                                    <div className="tracker-stages">
                                        {STAGES.map((s, i) => (
                                            <React.Fragment key={s.id}>

                                                <div className="tracker-stage">
                                                    <div
                                                        className={"tracker-stage-circle" + (i <= stageIdx ? " active" : "")}
                                                        style={
                                                            i <= stageIdx
                                                                ? {
                                                                    background: themeColor,
                                                                    borderColor: themeColor,
                                                                    color: "#0a0a0a"
                                                                }
                                                                : {}
                                                        }
                                                    >
                                                        {i < stageIdx ? "✓" : i + 1}
                                                    </div>
                                                </div>

                                                {i < STAGES.length - 1 && (
                                                    <div
                                                        className={"tracker-stage-line" + (i < stageIdx ? " active" : "")}
                                                        style={i < stageIdx ? { background: themeColor } : {}}
                                                    />
                                                )}

                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* LABELS */}
                                    <div className="tracker-steps-text">
                                        <span>Placed</span>
                                        <span>Confirmed</span>
                                        <span>Cooking</span>
                                        <span>Served</span>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="tracker-order-footer">
                                        <span className={"tracker-paid-tag" + (isPaid ? " paid" : "")}>
                                            {isPaid ? "✓ Paid" : "Payment pending"}
                                        </span>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FOOTER BUTTON */}
                <div className="sheet-footer">
                    <button
                        className="confirm-btn"
                        style={{ background: themeColor, width: "100%" }}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                {/* ORDER POPUP */}
                {selectedOrder && (
                    <div className="order-detail-modal" onClick={() => setSelectedOrder(null)}>
                        <div className="order-detail-box" onClick={e => e.stopPropagation()}>

                            <h3>Order Details</h3>

                            <p><b>Order:</b> #{selectedOrder.order_no || "Pending"}</p>
                            <p><b>Status:</b> {selectedOrder.status}</p>
                            <p><b>Total:</b> ₹ {Number(selectedOrder.total_amount).toFixed(2)}</p>

                            <button
                                className="confirm-btn"
                                style={{ marginTop: "10px", width: "100%" }}
                                onClick={() => setSelectedOrder(null)}
                            >
                                Close
                            </button>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// ============================================================
// ITEM DETAIL BOTTOM SHEET — buttons stay green for non-veg too
// ============================================================
function ItemSheet({ itemId, onClose, onAddToCart, themeColor }) {
    const [detail, setDetail] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState({});
    const [loading, setLoading] = useState(true);
    const prevItemId = useRef(null);

    useEffect(() => {
        if (prevItemId.current === itemId) return;
        prevItemId.current = itemId;
        let cancelled = false;
        fetch(`${API_BASE}/api/item/${itemId}`)
            .then(res => res.json())
            .then(data => {
                if (!cancelled) { setDetail(data); setLoading(false); }
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
    const buttonColor = "#4CAF50";                          // always green for buttons
    const indicatorColor = isVeg ? "#4CAF50" : "#e53935";   // red ONLY for non-veg indicator

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
                                    <div className="veg-box" style={{ borderColor: indicatorColor }}>
                                        {isVeg
                                            ? <div className="veg-circle" style={{ background: indicatorColor }} />
                                            : <div className="nonveg-triangle" style={{ borderBottomColor: indicatorColor }} />}
                                    </div>
                                    <span className="veg-text" style={{ color: indicatorColor }}>
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
                                                            <button key={opt.id} className="addon-pill"
                                                                style={sel ? {
                                                                    borderColor: buttonColor,
                                                                    color: buttonColor,
                                                                    background: "rgba(76,175,80,0.1)"
                                                                } : {}}
                                                                onClick={() => toggleAddon(group, opt)}>
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
                                    style={{ borderColor: buttonColor, color: buttonColor }}
                                    onClick={onClose}>← Back</button>
                                <button className="sheet-btn-add"
                                    style={{ borderColor: buttonColor, color: buttonColor }}
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

// ============================================================
// ORDER SUMMARY — redesigned cart line items, 0.5% digital fee
// ============================================================
function OrderSummary({ cart, tableInfo, themeColor, onBack, onUpdateQty, onConfirm, placingOrder, specialInstructions, setSpecialInstructions }) {
    const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    const cgst = +(subtotal * 0.025).toFixed(2);
    const sgst = +(subtotal * 0.025).toFixed(2);
    const platformFee = +(subtotal * 0.005).toFixed(2);                // 0.5% digital platform fee
    const grandTotal = +(subtotal + cgst + sgst + platformFee).toFixed(2);
    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
    const [showFeeInfo, setShowFeeInfo] = useState(false);

    if (cart.length === 0) {
        return (
            <div className="summary-page">
                <div className="order-success">
                    <div className="success-icon" style={{ color: "#555", borderColor: "#333" }}>○</div>
                    <h1 className="success-title">Your cart is empty</h1>
                    <p className="success-sub">Add a few dishes from the menu to continue</p>
                    <button className="confirm-btn" style={{ background: themeColor }} onClick={onBack}>
                        ← Back to menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="summary-page">
            <div className="summary-header">
                <button className="back-btn" onClick={onBack} disabled={placingOrder}>← Back to menu</button>
                <span className="restaurant-tag" style={{ color: themeColor }}>{tableInfo.restaurant_name}</span>
                <h1 className="summary-title">Review your order</h1>
                <div className="summary-table-badge" style={{ background: `${themeColor}18`, borderColor: `${themeColor}55` }}>
                    <span className="table-dot" style={{ background: themeColor }} />
                    <span style={{ color: themeColor }}>{tableInfo.table_number} · Dine in</span>
                </div>
            </div>

            <div className="summary-section">
                <div className="section-label" style={{ color: themeColor }}>YOUR ITEMS · {totalItems}</div>
                <div className="cart-lines">
                    {cart.map(c => {
                        const vegC = c.is_veg ? "#4CAF50" : "#e53935";
                        return (
                            <div className="cart-line" key={c.key}>
                                <div className="cart-line-head">
                                    <div className="veg-box-sm" style={{ borderColor: vegC }}>
                                        {c.is_veg
                                            ? <div className="veg-circle-sm" style={{ background: vegC }} />
                                            : <div className="nonveg-tri-sm" style={{ borderBottomColor: vegC }} />}
                                    </div>
                                    <div className="cart-line-name">{c.name}</div>
                                    <div className="cart-line-total" style={{ color: themeColor }}>
                                        ₹ {(c.price * c.qty).toFixed(0)}
                                    </div>
                                </div>
                                {c.addons && c.addons.length > 0 && (
                                    <div className="cart-line-addons">
                                        + {c.addons.map(a => a.name).join(' · ')}
                                    </div>
                                )}
                                <div className="cart-line-foot">
                                    <span className="cart-line-unit">₹ {c.price} each</span>
                                    <div className="qty-mini">
                                        <button style={{ color: themeColor }}
                                            onClick={() => onUpdateQty(c.key, -1)}
                                            disabled={placingOrder}>−</button>
                                        <span>{c.qty}</span>
                                        <button style={{ color: themeColor }}
                                            onClick={() => onUpdateQty(c.key, +1)}
                                            disabled={placingOrder}>+</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="summary-section">
                <div className="section-label" style={{ color: themeColor }}>SPECIAL INSTRUCTIONS</div>
                <textarea className="instructions-input"
                    placeholder="Any allergies, spice level, or special requests for the chef?"
                    value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                    disabled={placingOrder} rows={3} />
            </div>

            <div className="summary-section">
                <div className="section-label" style={{ color: themeColor }}>BILL DETAILS</div>
                <div className="bill-rows">
                    <div className="bill-row"><span>Item subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
                    <div className="bill-row">
                        <span className="bill-info-row">
                            Taxes & fees

                            <button
                                className="bill-info-btn"
                                onClick={() => setShowFeeInfo(true)}
                            >
                                i
                            </button>
                        </span>

                        <span>
                            ₹ {(cgst + sgst + platformFee).toFixed(2)}
                        </span>
                    </div>
                    <div className="bill-row total-row">
                        <span>Grand total</span>
                        <span style={{ color: themeColor }}>₹ {grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                <p className="bill-note">Inclusive of all taxes</p>
            </div>

            {showFeeInfo && (
                <div className="sheet-backdrop" onClick={() => setShowFeeInfo(false)}>

                    <div
                        className="bottom-sheet"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sheet-handle" />

                        <div className="sheet-scroll">
                            <div className="sheet-body">

                                <h2 className="tracker-sheet-title">
                                    Taxes & fees
                                </h2>

                                <p className="tracker-sheet-sub">
                                    Transparent pricing breakdown
                                </p>

                                <div className="bill-popup-card">

                                    <div className="bill-popup-row">
                                        <span>CGST (2.5%)</span>
                                        <span>₹ {cgst.toFixed(2)}</span>
                                    </div>

                                    <div className="bill-popup-row">
                                        <span>SGST (2.5%)</span>
                                        <span>₹ {sgst.toFixed(2)}</span>
                                    </div>

                                    <div className="bill-popup-row">
                                        <span>Digital platform fee (0.5%)</span>
                                        <span>₹ {platformFee.toFixed(2)}</span>
                                    </div>

                                </div>

                            </div>
                        </div>

                        <div className="sheet-footer">
                            <button
                                className="confirm-btn"
                                style={{ background: themeColor, width: "100%" }}
                                onClick={() => setShowFeeInfo(false)}
                            >
                                Close
                            </button>
                        </div>

                    </div>

                </div>
            )}

            <div className="summary-footer-spacer" />
            <div className="summary-footer">
                <div className="summary-footer-inner">
                    <div className="summary-footer-info">
                        <span className="summary-footer-count">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                        <span className="summary-footer-total">₹ {grandTotal.toFixed(2)}</span>
                    </div>
                    <button className="confirm-btn"
                        style={{ background: themeColor, opacity: placingOrder ? 0.6 : 1 }}
                        onClick={() => onConfirm(grandTotal, subtotal, cgst + sgst, platformFee)}
                        disabled={placingOrder}>
                        {placingOrder ? "Placing order..." : "Confirm order →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// ACTION HUB — awaiting-aware title; Cash + Pay with card labels
// ============================================================
function ActionHub({ order, tableInfo, themeColor, completedTotal, onAction, onBackToMenu, paidStatus }) {
    const isAwaiting = !order?.order_no || order?.status === "awaiting";

    const mainActions = [
        { id: 'pay_card', icon: '💳', title: 'Pay now', desc: 'Pay online by card', highlight: true, disabled: paidStatus === 'paid' },
        { id: 'cash_at_counter', icon: '💵', title: 'Cash', desc: 'Waiter will collect cash', disabled: paidStatus === 'paid' },
        { id: 'tap_to_pay', icon: '📲', title: 'Pay with card', desc: 'Staff brings card machine', disabled: paidStatus === 'paid' },
        { id: 'call_staff', icon: '🔔', title: 'Call staff', desc: 'Get a server\'s attention' },
        { id: 'add_review', icon: '⭐', title: 'Add review', desc: 'Rate your meal' },
        { id: 'report_issue', icon: '⚠️', title: 'Report issue', desc: 'Problem with food or service' },
    ];

    const secondaryActions = [
        { id: 'request_bill', icon: '🧾', label: 'Request bill' },
        { id: 'water_refill', icon: '💧', label: 'Water refill' },
        { id: 'extra_cutlery', icon: '🍴', label: 'Extra cutlery' },
    ];

    return (
        <div className="action-page">
            <div className="action-success-card" style={{ borderColor: `${themeColor}55`, background: `${themeColor}0d` }}>
                <div className="success-icon-sm" style={{ background: themeColor, color: "#0a0a0a" }}>
                    {isAwaiting ? "⏳" : "✓"}
                </div>
                <div className="action-success-body">
                    <div className="action-success-title">
                        {isAwaiting ? "Order received" : "Order placed"}
                    </div>
                    <div className="action-success-sub">
                        {isAwaiting
                            ? "Order under review by staff"
                            : <>Kitchen received order <strong style={{ color: themeColor }}>#{order.order_no}</strong></>
                        }
                    </div>
                </div>
            </div>

            <div className="action-meta-row">
                <div><span>TABLE</span><strong>{tableInfo.table_number}</strong></div>
                <div><span>ORDER</span><strong>{order?.order_no ? `#${order.order_no}` : "Pending"}</strong></div>
                <div><span>TOTAL</span><strong style={{ color: themeColor }}>₹ {completedTotal.toFixed(2)}</strong></div>
            </div>

            {paidStatus === 'paid' && (
                <div className="paid-banner" style={{ borderColor: "#4CAF50", color: "#4CAF50" }}>
                    ✓ Payment received · Enjoy your meal
                </div>
            )}

            <div className="section-label" style={{ color: themeColor, marginTop: 24 }}>WHAT'S NEXT?</div>
            <div className="action-grid">
                {mainActions.map(a => (
                    <button key={a.id}
                        className={"action-card" + (a.highlight ? " action-card-highlight" : "") + (a.disabled ? " action-card-disabled" : "")}
                        style={a.highlight && !a.disabled ? { borderColor: themeColor } : {}}
                        onClick={() => !a.disabled && onAction(a.id)}
                        disabled={a.disabled}>
                        <div className="action-card-icon" style={a.highlight && !a.disabled ? { color: themeColor } : {}}>{a.icon}</div>
                        <div className="action-card-text">
                            <div className="action-card-title">{a.title}</div>
                            <div className="action-card-desc">{a.desc}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="section-label" style={{ color: themeColor, marginTop: 28 }}>QUICK REQUESTS</div>
            <div className="secondary-actions">
                {secondaryActions.map(a => (
                    <button key={a.id} className="secondary-btn" onClick={() => onAction(a.id)}>
                        <span className="secondary-icon">{a.icon}</span>
                        <span>{a.label}</span>
                    </button>
                ))}
            </div>

            <div className="action-footer">
                <button className="back-btn-center" onClick={onBackToMenu}>← Back to menu · Place new order</button>
            </div>
        </div>
    );
}

// ============================================================
// CARD PAYMENT FORM — save-card checkbox removed
// ============================================================
function CardPaymentForm({ amount, themeColor, onBack, onSubmit, submitting }) {
    const [number, setNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [errors, setErrors] = useState({});

    const formatNumber = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
    const formatExpiry = (v) => {
        const d = v.replace(/\D/g, "").slice(0, 4);
        return d.length < 3 ? d : d.slice(0, 2) + "/" + d.slice(2);
    };
    const detectCardType = (num) => {
        const n = num.replace(/\s/g, "");
        if (n.startsWith("4")) return "Visa";
        if (/^5[1-5]/.test(n)) return "Mastercard";
        if (/^3[47]/.test(n)) return "Amex";
        if (/^60|65/.test(n)) return "Discover";
        return "Card";
    };

    const validate = () => {
        const e = {};
        const numDigits = number.replace(/\s/g, "");
        if (numDigits.length < 13) e.number = "Enter a valid card number";
        if (!name.trim()) e.name = "Cardholder name required";
        if (!/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = "MM/YY";
        else {
            const [mm] = expiry.split("/").map(Number);
            if (mm < 1 || mm > 12) e.expiry = "Invalid month";
        }
        if (cvv.length < 3) e.cvv = "3-4 digits";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const last4 = number.replace(/\s/g, "").slice(-4);
        onSubmit({
            card_last4: last4,
            card_holder: name.trim(),
            transaction_ref: "MOCK-" + Date.now()
        });
    };

    return (
        <div className="form-page">
            <button className="back-btn" onClick={onBack} disabled={submitting}>← Back</button>
            <h1 className="form-title">Pay by card</h1>
            <p className="form-sub">Amount: <strong style={{ color: themeColor }}>₹ {amount.toFixed(2)}</strong></p>

            <div className="card-visual" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}99 60%, #1a1a1a)` }}>
                <div className="card-chip" />
                <div className="card-number-display">{number || "•••• •••• •••• ••••"}</div>
                <div className="card-bottom-row">
                    <div>
                        <div className="card-label">CARD HOLDER</div>
                        <div className="card-value">{name.toUpperCase() || "YOUR NAME"}</div>
                    </div>
                    <div>
                        <div className="card-label">EXPIRES</div>
                        <div className="card-value">{expiry || "MM/YY"}</div>
                    </div>
                </div>
                <div className="card-type">{detectCardType(number)}</div>
            </div>

            <div className="form-section">
                <label className="form-label">Card number</label>
                <input className={"form-input" + (errors.number ? " form-input-error" : "")}
                    type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                    value={number} onChange={e => setNumber(formatNumber(e.target.value))}
                    disabled={submitting} autoComplete="cc-number" />
                {errors.number && <span className="form-error">{errors.number}</span>}
            </div>

            <div className="form-section">
                <label className="form-label">Cardholder name</label>
                <input className={"form-input" + (errors.name ? " form-input-error" : "")}
                    type="text" placeholder="As printed on card"
                    value={name} onChange={e => setName(e.target.value)}
                    disabled={submitting} autoComplete="cc-name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-row">
                <div className="form-section" style={{ flex: 1 }}>
                    <label className="form-label">Expiry</label>
                    <input className={"form-input" + (errors.expiry ? " form-input-error" : "")}
                        type="text" inputMode="numeric" placeholder="MM/YY"
                        value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                        disabled={submitting} autoComplete="cc-exp" />
                    {errors.expiry && <span className="form-error">{errors.expiry}</span>}
                </div>
                <div className="form-section" style={{ flex: 1 }}>
                    <label className="form-label">CVV</label>
                    <input className={"form-input" + (errors.cvv ? " form-input-error" : "")}
                        type="password" inputMode="numeric" placeholder="•••"
                        value={cvv} maxLength={4}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        disabled={submitting} autoComplete="cc-csc" />
                    {errors.cvv && <span className="form-error">{errors.cvv}</span>}
                </div>
            </div>

            <div className="form-note">
                🔒 Secure demo payment · Card details are not stored anywhere.<br />
                Real payment processing via Stripe / Razorpay will be added soon.
            </div>

            <div className="form-footer-spacer" />
            <div className="form-footer">
                <button className="confirm-btn"
                    style={{ background: themeColor, opacity: submitting ? 0.6 : 1, width: "100%" }}
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Processing..." : `Pay ₹ ${amount.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
}

// ============================================================
// STAR RATING + REVIEW FORM — category ratings & tags removed
// ============================================================
function StarRating({ value, onChange, size = "md", color }) {
    return (
        <div className={"star-rating star-rating-" + size}>
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                    className={"star" + (n <= value ? " star-filled" : "")}
                    style={n <= value ? { color: color || "#FFD700" } : {}}
                    onClick={() => onChange(n)}>★</button>
            ))}
        </div>
    );
}

function ReviewForm({ completedItems, themeColor, onBack, onSubmit, submitting }) {
    const [overall, setOverall] = useState(0);
    const [comment, setComment] = useState("");
    const [name, setName] = useState("");
    const [recommend, setRecommend] = useState(null);
    const [itemRatings, setItemRatings] = useState({});
    const [error, setError] = useState("");

    const setItemRating = (id, r) => setItemRatings(prev => ({ ...prev, [id]: r }));

    const uniqueItemMap = {};
    completedItems.forEach(c => { if (!uniqueItemMap[c.id]) uniqueItemMap[c.id] = c; });
    const uniqueItems = Object.values(uniqueItemMap);

    const handleSubmit = () => {
        if (overall < 1) { setError("Please give an overall rating"); return; }
        setError("");
        const item_ratings = uniqueItems
            .filter(it => itemRatings[it.id])
            .map(it => ({ menu_item_id: it.id, item_name: it.name, rating: itemRatings[it.id] }));

        onSubmit({
            overall_rating: overall,
            food_rating: null,
            service_rating: null,
            ambience_rating: null,
            value_rating: null,
            comment: comment.trim() || null,
            customer_name: name.trim() || null,
            would_recommend: recommend,
            tags: null,
            item_ratings
        });
    };

    const overallLabel = ["Tap to rate", "Poor", "Below average", "Good", "Very good", "Excellent"][overall];

    return (
        <div className="form-page">
            <button className="back-btn" onClick={onBack} disabled={submitting}>← Back</button>
            <h1 className="form-title">How was your meal?</h1>
            <p className="form-sub">Your feedback helps us serve you better</p>

            <div className="form-section center">
                <label className="form-label-big">Overall experience</label>
                <StarRating value={overall} onChange={setOverall} size="lg" color={themeColor} />
                <div className="rating-label">{overallLabel}</div>
            </div>

            {uniqueItems.length > 0 && (
                <div className="form-section">
                    <label className="form-label">
                        Rate each dish <span className="form-label-opt">(optional)</span>
                    </label>

                    <div className="item-rate-list">

                        {uniqueItems.map(it => (

                            <div key={it.id} className="item-rate-row">

                                <img
                                    src={it.image}
                                    alt={it.name}
                                    className="item-rate-img"
                                />

                                <div className="item-rate-name">
                                    {it.name}
                                </div>

                                <StarRating
                                    value={itemRatings[it.id] || 0}
                                    onChange={r => setItemRating(it.id, r)}
                                    color={themeColor}
                                />

                            </div>

                        ))}

                    </div>
                </div>
            )}

            <div className="form-section">
                <label className="form-label">Tell us more <span className="form-label-opt">(optional)</span></label>
                <textarea className="instructions-input" rows={4}
                    placeholder="What stood out? What could be better?"
                    value={comment} onChange={e => setComment(e.target.value)} disabled={submitting} />
            </div>

            <div className="form-section">
                <label className="form-label">Your name <span className="form-label-opt">(optional)</span></label>
                <input className="form-input" placeholder="Anonymous is fine too"
                    value={name} onChange={e => setName(e.target.value)} disabled={submitting} />
            </div>

            <div className="form-section">
                <label className="form-label">Would you recommend us?</label>
                <div className="toggle-row">
                    <button className={"toggle-btn" + (recommend === true ? " toggle-btn-active" : "")}
                        style={recommend === true ? { borderColor: "#4CAF50", color: "#4CAF50", background: "rgba(76,175,80,0.1)" } : {}}
                        onClick={() => setRecommend(true)} disabled={submitting}>👍 Yes</button>
                    <button className={"toggle-btn" + (recommend === false ? " toggle-btn-active" : "")}
                        style={recommend === false ? { borderColor: "#4CAF50", color: "#4CAF50", background: "rgba(76,175,80,0.06)" } : {}}
                        onClick={() => setRecommend(false)} disabled={submitting}>👎 No</button>
                </div>
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-footer-spacer" />
            <div className="form-footer">
                <button className="confirm-btn"
                    style={{ background: themeColor, opacity: submitting ? 0.6 : 1, width: "100%" }}
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit review"}
                </button>
            </div>
        </div>
    );
}

// ============================================================
// REPORT ISSUE FORM
// ============================================================
const ISSUE_CATEGORIES = [
    { id: "cold_food", label: "Cold food", icon: "❄️" },
    { id: "wrong_dish", label: "Wrong dish", icon: "❌" },
    { id: "missing_item", label: "Missing item", icon: "❓" },
    { id: "quality", label: "Quality concern", icon: "⚠️" },
    { id: "allergy", label: "Allergy issue", icon: "🩺" },
    { id: "hygiene", label: "Hygiene", icon: "🧼" },
    { id: "slow_service", label: "Slow service", icon: "🕐" },
    { id: "other", label: "Other", icon: "💬" },
];

function ReportIssueForm({ themeColor, onBack, onSubmit, submitting }) {
    const [category, setCategory] = useState(null);
    const [description, setDescription] = useState("");
    const [urgent, setUrgent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (!category) { setError("Please pick what's wrong"); return; }
        if (description.trim().length < 5) { setError("Please describe the issue (at least a few words)"); return; }
        setError("");
        const catLabel = ISSUE_CATEGORIES.find(c => c.id === category)?.label || category;
        onSubmit({
            message: `[${catLabel}] ${description.trim()}`,
            priority: urgent ? "urgent" : "normal"
        });
    };

    return (
        <div className="form-page">
            <button className="back-btn" onClick={onBack} disabled={submitting}>← Back</button>
            <h1 className="form-title">Report an issue</h1>
            <p className="form-sub">A staff member will come over to help</p>

            <div className="form-section">
                <label className="form-label">What's the problem?</label>
                <div className="issue-grid">
                    {ISSUE_CATEGORIES.map(c => (
                        <button key={c.id}
                            className={"issue-cat" + (category === c.id ? " issue-cat-selected" : "")}
                            style={category === c.id ? {
                                borderColor: themeColor, color: themeColor, background: `${themeColor}18`
                            } : {}}
                            onClick={() => setCategory(c.id)} disabled={submitting}>
                            <span className="issue-cat-icon">{c.icon}</span>
                            <span>{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-section">
                <label className="form-label">Describe what happened</label>
                <textarea className="instructions-input" rows={5}
                    placeholder="The more detail you share, the faster we can fix it"
                    value={description} onChange={e => setDescription(e.target.value)} disabled={submitting} />
            </div>

            <div className="form-section">
                <label className="checkbox-row">
                    <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} disabled={submitting} />
                    <span>This is urgent — please prioritise</span>
                </label>
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-footer-spacer" />
            <div className="form-footer">
                <button className="confirm-btn"
                    style={{ background: themeColor, opacity: submitting ? 0.6 : 1, width: "100%" }}
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Sending..." : "Send to staff"}
                </button>
            </div>
        </div>
    );
}

// ============================================================
// LOADING / INVALID
// ============================================================
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
    return <div className="invalid-screen"><p style={{ color: "#555" }}>Loading menu...</p></div>;
}

// ============================================================
// MAIN APP
// ============================================================
function App() {
    const [tableInfo, setTableInfo] = useState(null);
    const [tokenStatus, setTokenStatus] = useState("loading");
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [openItemId, setOpenItemId] = useState(null);

    const [view, setView] = useState("menu");
    const [actionView, setActionView] = useState("hub");
    const [placingOrder, setPlacingOrder] = useState(false);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [specialInstructions, setSpecialInstructions] = useState("");

    const [completedItems, setCompletedItems] = useState([]);
    const [completedTotal, setCompletedTotal] = useState(0);
    const [paidStatus, setPaidStatus] = useState("unpaid");

    const [activeOrders, setActiveOrders] = useState([]);
    const [showTracker, setShowTracker] = useState(false);

    const [toasts, setToasts] = useState([]);
    const [heroSlide, setHeroSlide] = useState(0);

    // Toast helper
    const showToast = ({ icon, title, message, kind = "success", duration = 3500 }) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, icon, title, message, kind }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    };
    const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // Step 1: resolve token → table info
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (!token) {
            const t = setTimeout(() => setTokenStatus("invalid"), 0);
            return () => clearTimeout(t);
        }
        let cancelled = false;
        fetch(`${API_BASE}/api/table?token=${token}`)
            .then(res => { if (!res.ok) throw new Error("not found"); return res.json(); })
            .then(data => {
                if (cancelled) return;
                setTableInfo(data);
                setTokenStatus("valid");
                document.documentElement.style.setProperty("--theme", data.theme_color || "#D4AF37");
            })
            .catch(() => { if (!cancelled) setTokenStatus("invalid"); });
        return () => { cancelled = true; };
    }, []);

    

    // Step 2: load menu
    useEffect(() => {
        if (!tableInfo) return;
        let cancelled = false;
        fetch(`${API_BASE}/api/menu?branch_id=${tableInfo.branch_id}`)
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                setMenu(data);
                if (data.length > 0) setActiveCategory(data[0].category);
            });
        return () => { cancelled = true; };
    }, [tableInfo]);

    // Hero carousel auto-rotate every 4 seconds
    useEffect(() => {
        const imgs = tableInfo?.hero_images || [];
        if (imgs.length <= 1) return;
        const id = setInterval(() => setHeroSlide(i => (i + 1) % imgs.length), 4000);
        return () => clearInterval(id);
    }, [tableInfo?.hero_images]);

    // Poll active orders every 5 seconds for tracker
    useEffect(() => {
        if (!tableInfo) return;
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) return;
        let cancelled = false;
        const fetchActive = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/table/${token}/active-orders`);
                if (!res.ok) return;
                const data = await res.json();
                const filteredOrders = (data || []).filter(o => {

                    const served =
                        (o.status || "").toLowerCase() === "served";

                    const paid =
                        (o.payment_status || "").toLowerCase() === "paid";

                    // remove ONLY when served + paid
                    return !(served && paid);
                });

                if (!cancelled)
                    setActiveOrders(filteredOrders);
            } catch { /* silent */ }
        };
        fetchActive();
        const id = setInterval(fetchActive, 5000);
        return () => { cancelled = true; clearInterval(id); };
    }, [tableInfo]);


    useEffect(() => {
        const lock = showTracker || !!openItemId;
        document.body.style.overflow = lock ? "hidden" : "auto";
    }, [showTracker, openItemId]);

    // Sync orderResult with latest active-order data (status updates etc.)
    useEffect(() => {
        if (!orderResult?.order_id) return;
        const live = activeOrders.find(o => o.order_id === orderResult.order_id);

        if (live && JSON.stringify(live) !== JSON.stringify(orderResult)) {
            setTimeout(() => {
                setOrderResult(prev => ({ ...prev, ...live }));
                if (live.payment_status === "paid") setPaidStatus("paid");
            }, 0);
        }
        // eslint-disable-next-line
    }, [activeOrders]);

    const addToCart = (item, addons, addonsTotal) => {
        const key = item.id + "_" + addons.map(a => a.id).join("_");
        const existing = cart.find(c => c.key === key);
        if (existing) {
            setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, {
                key, id: item.id, name: item.name, is_veg: item.is_veg, image: item.image,
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

    const goToSummary = () => {
        if (cart.length === 0) return;
        setView("summary");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const updateQty = (key, delta) => {
        setCart(prev => prev.map(c => c.key === key ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
    };

    const confirmOrder = async (grandTotal, subtotal, taxAmount, platformFee) => {
        if (!tableInfo || placingOrder) return;
        setPlacingOrder(true);
        const orderData = {
            restaurant_id: tableInfo.restaurant_id,
            branch_id: tableInfo.branch_id,
            table_id: tableInfo.table_id,
            total_amount: grandTotal,
            subtotal,
            tax_amount: taxAmount,
            service_charge: platformFee,
            special_instructions: specialInstructions,
            items: cart.map(c => ({
                item_id: c.id, quantity: c.qty, price: c.price,
                addons: c.addons ? c.addons.map(a => a.id) : []
            }))
        };
        try {
            const res = await fetch(`${API_BASE}/api/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            setOrderResult(data);
            setCompletedItems(cart);
            setCompletedTotal(grandTotal);
            setPaidStatus("unpaid");
            setCart([]);
            setSpecialInstructions("");
            setView("actions");
            setActionView("hub");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            showToast({ kind: "error", icon: "✕", title: "Could not place order", message: "Please try again." });
            console.error(err);
        } finally {
            setPlacingOrder(false);
        }
    };

    const backToMenu = () => { setView("menu"); window.scrollTo({ top: 0, behavior: "smooth" }); };

    const fullResetToMenu = () => {
        setView("menu");
        setActionView("hub");
        setOrderResult(null);
        setCompletedItems([]);
        setCompletedTotal(0);
        setPaidStatus("unpaid");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToCategory = (category) => {
        setActiveCategory(category);
        const el = document.getElementById("cat-" + category);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Action handlers — all toast-based
    const sendServiceRequest = async (type, opts) => {
        setActionSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/service-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurant_id: tableInfo.restaurant_id,
                    branch_id: tableInfo.branch_id,
                    table_id: tableInfo.table_id,
                    order_id: orderResult?.order_id,
                    request_type: type,
                    priority: opts.priority || "normal",
                    message: opts.message || null
                })
            });
            if (!res.ok) throw new Error("Request failed");
            showToast({ icon: opts.icon, title: opts.successTitle, message: opts.successSub });
            if (opts.backToHub) setActionView("hub");
        } catch (err) {
            showToast({ kind: "error", icon: "✕", title: "Could not send request", message: "Please try again." });
            console.error(err);
        } finally {
            setActionSubmitting(false);
        }
    };

    const sendPayment = async (method, opts = {}, cardDetails = {}) => {
        setActionSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: orderResult.order_id,
                    restaurant_id: tableInfo.restaurant_id,
                    branch_id: tableInfo.branch_id,
                    table_id: tableInfo.table_id,
                    method, amount: completedTotal, ...cardDetails
                })
            });
            if (!res.ok) throw new Error("Payment failed");
            await res.json();
            if (method === "card_online") setPaidStatus("paid");
            else if (method === "pay_later") setPaidStatus("pay_later");
            else setPaidStatus("pending");
            showToast({ icon: opts.icon, title: opts.successTitle, message: opts.successSub });
            setActionView("hub");
        } catch (err) {
            showToast({ kind: "error", icon: "✕", title: "Payment could not be recorded", message: "Please try again." });
            console.error(err);
        } finally {
            setActionSubmitting(false);
        }
    };

    const submitReview = async (reviewData) => {
        setActionSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurant_id: tableInfo.restaurant_id,
                    branch_id: tableInfo.branch_id,
                    table_id: tableInfo.table_id,
                    order_id: orderResult?.order_id,
                    ...reviewData
                })
            });
            if (!res.ok) throw new Error("Submit failed");
            showToast({ icon: "⭐", title: "Thank you!", message: "Your review helps us improve." });
            setActionView("hub");
        } catch (err) {
            showToast({ kind: "error", icon: "✕", title: "Could not submit review", message: "Please try again." });
            console.error(err);
        } finally {
            setActionSubmitting(false);
        }
    };

    const submitIssue = (issueData) => {
        sendServiceRequest("report_issue", {
            message: issueData.message,
            priority: issueData.priority,
            icon: issueData.priority === "urgent" ? "🚨" : "⚠️",
            successTitle: issueData.priority === "urgent" ? "Help is on the way" : "Reported to staff",
            successSub: "A team member will be with you shortly",
            backToHub: true
        });
    };

    const submitCardPayment = (cardDetails) => {
        sendPayment("card_online", {
            icon: "✓",
            successTitle: "Payment successful",
            successSub: `₹ ${completedTotal.toFixed(2)} paid · card ending ${cardDetails.card_last4}`
        }, cardDetails);
    };

    const handleAction = (actionId) => {
        if (actionSubmitting) return;
        switch (actionId) {
            case "pay_card": setActionView("card_form"); break;
            case "add_review": setActionView("review_form"); break;
            case "report_issue": setActionView("issue_form"); break;
            case "cash_at_counter":
                sendPayment("cash_at_counter", {
                    icon: "💵",
                    successTitle: "Waiter has been called",
                    successSub: "A team member is coming to collect cash"
                });
                break;
            case "tap_to_pay":
                sendPayment("tap_at_table", {
                    icon: "📲",
                    successTitle: "Card machine on the way",
                    successSub: "A staff member is bringing the POS machine"
                });
                break;
            case "call_staff":
                sendServiceRequest("call_staff", {
                    icon: "🔔",
                    successTitle: "Staff notified",
                    successSub: "A server will be with you shortly"
                });
                break;
            case "request_bill":
                sendServiceRequest("request_bill", {
                    icon: "🧾",
                    successTitle: "Bill requested",
                    successSub: "Your bill is being prepared"
                });
                break;
            case "water_refill":
                sendServiceRequest("water_refill", {
                    icon: "💧",
                    successTitle: "Water on the way",
                    successSub: "We'll refill your glasses shortly"
                });
                break;
            case "extra_cutlery":
                sendServiceRequest("extra_cutlery", {
                    icon: "🍴",
                    successTitle: "Cutlery on the way",
                    successSub: "Extra utensils coming right up"
                });
                break;
            default: break;
        }
    };

    if (tokenStatus === "loading") return <LoadingScreen />;
    if (tokenStatus === "invalid") return <InvalidToken />;

    const themeColor = tableInfo?.theme_color || "#D4AF37";
    const heroImages = (tableInfo?.hero_images && tableInfo.hero_images.length > 0)
        ? tableInfo.hero_images
        : [tableInfo?.hero_image_url || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&q=80"];

    // Tracker visible on menu + action hub (not on forms or summary)
    const trackerVisibleHere = view === "menu" || (view === "actions" && actionView === "hub");
    const hasActiveOrders = activeOrders.length > 0;
    const trackerOnScreen = trackerVisibleHere && hasActiveOrders;

    // ── Summary view ──
    if (view === "summary") {
        return (
            <>
                <OrderSummary
                    cart={cart} tableInfo={tableInfo} themeColor={themeColor}
                    onBack={backToMenu} onUpdateQty={updateQty} onConfirm={confirmOrder}
                    placingOrder={placingOrder}
                    specialInstructions={specialInstructions}
                    setSpecialInstructions={setSpecialInstructions}
                />
                <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            </>
        );
    }

    // ── Action views ──
    if (view === "actions") {
        let body;
        if (actionView === "card_form") {
            body = <CardPaymentForm amount={completedTotal} themeColor={themeColor}
                onBack={() => setActionView("hub")} onSubmit={submitCardPayment}
                submitting={actionSubmitting} />;
        } else if (actionView === "review_form") {
            body = <ReviewForm completedItems={completedItems} themeColor={themeColor}
                onBack={() => setActionView("hub")} onSubmit={submitReview}
                submitting={actionSubmitting} />;
        } else if (actionView === "issue_form") {
            body = <ReportIssueForm themeColor={themeColor}
                onBack={() => setActionView("hub")} onSubmit={submitIssue}
                submitting={actionSubmitting} />;
        } else {
            body = <ActionHub order={orderResult} tableInfo={tableInfo}
                themeColor={themeColor} completedTotal={completedTotal}
                paidStatus={paidStatus} onAction={handleAction}
                onBackToMenu={fullResetToMenu} />;
        }
        return (
            <>
                {body}

                

                {/* FULL SHEET */}
                {showTracker && (
                    <OrderTrackerSheet
                        orders={activeOrders}
                        themeColor={themeColor}
                        onClose={() => setShowTracker(false)}
                    />
                )}

                <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            </>
        );
    }
    const isMenuPage = view === "menu" && !openItemId;
    // ── Menu view ──
    const cartBarBottom = trackerOnScreen ? 60 : 0;
    return (
        <div className="app">
            <div className="hero">
                <HeroCarousel images={heroImages} current={heroSlide} />
                <div className="hero-overlay" />
                <div className="hero-content hero-centered">
                    <span className="restaurant-tag" style={{ color: themeColor }}>{tableInfo.restaurant_name}</span>
                    <h1 className="hero-title">{tableInfo.branch_subtitle || tableInfo.branch_name}</h1>
                    {tableInfo.tagline && <p className="hero-sub">{tableInfo.tagline}</p>}
                    <div className="table-badge" style={{ background: `${themeColor}18`, borderColor: `${themeColor}55` }}>
                        <span className="table-dot" style={{ background: themeColor }} />
                        <span style={{ color: themeColor }}>{tableInfo.table_number} &nbsp;·&nbsp; Dine in</span>
                    </div>
                </div>
            </div>

            <div className="cat-bar">
                {menu.map((cat, i) => (
                    <button key={i}
                        className={"cat-pill" + (activeCategory === cat.category ? " active" : "")}
                        style={activeCategory === cat.category ? { background: themeColor, borderColor: themeColor, color: "#0a0a0a" } : {}}
                        onClick={() => scrollToCategory(cat.category)}>
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
                                const indicatorColor = item.is_veg ? "#4CAF50" : "#e53935";
                                const outOfStock = item.is_available === false;
                                return (
                                    <div className={"item-card" + (outOfStock ? " item-card-disabled" : "")}
                                        key={item.id}
                                        onClick={() => {
                                            if (outOfStock) {
                                                showToast({ icon: "🚫", title: "Out of stock", message: `${item.name} is unavailable right now.` });
                                                return;
                                            }
                                            setOpenItemId(item.id);
                                        }}>
                                        <div className="item-img-wrap">
                                            {item.image
                                                ? <img src={item.image} alt={item.name} className="item-img" />
                                                : <div className="item-img-placeholder" />}
                                            {outOfStock && (
                                                <div className="out-of-stock-overlay">Out of stock</div>
                                            )}
                                        </div>
                                        <div className="item-body">
                                            <div className="item-name-row">
                                                <div className="veg-box-sm" style={{ borderColor: indicatorColor }}>
                                                    {item.is_veg
                                                        ? <div className="veg-circle-sm" style={{ background: indicatorColor }} />
                                                        : <div className="nonveg-tri-sm" style={{ borderBottomColor: indicatorColor }} />}
                                                </div>
                                                <span className="item-name">{item.name}</span>
                                            </div>
                                            <span className="item-desc">
                                                {outOfStock ? "Currently unavailable" : "Tap to view & customise"}
                                            </span>
                                            <div className="item-footer">
                                                <span className="item-price" style={{ color: themeColor }}>₹ {item.price}</span>
                                                <div className="item-action" onClick={e => e.stopPropagation()}>
                                                    {outOfStock ? (
                                                        <span className="out-of-stock-pill">Unavailable</span>
                                                    ) : qty === 0 ? (
                                                        <button className="add-btn" style={{ background: themeColor }}
                                                            onClick={() => setOpenItemId(item.id)}>+</button>
                                                    ) : (
                                                        <div className="qty-ctrl">
                                                            <button style={{ color: themeColor }} onClick={() => {
                                                                const last = [...cart].reverse().find(c => c.id === item.id);
                                                                if (last) removeFromCart(last.key);
                                                            }}>−</button>
                                                            <span>{qty}</span>
                                                            <button style={{ color: themeColor }} onClick={() => setOpenItemId(item.id)}>+</button>
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

            {(cart.length > 0 || trackerOnScreen) && <div className="sticky-spacer" style={{ height: (cart.length > 0 ? 80 : 0) + (trackerOnScreen ? 60 : 0) }} />}

            {cart.length > 0 && !openItemId && (
                <div className="sticky-bar" style={{ bottom: cartBarBottom }}>
                    <div className="sticky-inner">
                        <div className="sticky-info">
                            <span className="sticky-count">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                            <span className="sticky-total">₹ {total}</span>
                        </div>
                        <button className="place-order-btn" style={{ background: themeColor }} onClick={goToSummary}>
                            Place order →
                        </button>
                    </div>
                </div>
            )}

            {trackerOnScreen && isMenuPage && !showTracker && (
                <OrderTrackerMini
                    orders={activeOrders}
                    themeColor={themeColor}
                    onClick={() => setShowTracker(true)}
                    bottomOffset={80}
                />
            )}

            {showTracker && (
                <OrderTrackerSheet
                    orders={activeOrders}
                    themeColor={themeColor}
                    onClose={() => setShowTracker(false)}
                />
            )}

            {openItemId && (
                <ItemSheet itemId={openItemId} onClose={() => setOpenItemId(null)} onAddToCart={addToCart} themeColor={themeColor} />
            )}

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}

export default App;
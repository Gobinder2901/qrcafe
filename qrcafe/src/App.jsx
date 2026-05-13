import { useEffect, useState, useRef } from "react";
import "./App.css";

const API_BASE = "https://scannermenu-api.onrender.com";

// ============================================================
// ITEM DETAIL BOTTOM SHEET
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

// ============================================================
// ORDER SUMMARY (cart review)
// ============================================================
function OrderSummary({ cart, tableInfo, themeColor, onBack, onUpdateQty, onConfirm, placingOrder, specialInstructions, setSpecialInstructions }) {
    const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    const cgst = +(subtotal * 0.025).toFixed(2);
    const sgst = +(subtotal * 0.025).toFixed(2);
    const serviceCharge = +(subtotal * 0.05).toFixed(2);
    const grandTotal = +(subtotal + cgst + sgst + serviceCharge).toFixed(2);
    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

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
                <div className="summary-items">
                    {cart.map(c => (
                        <div className="summary-item" key={c.key}>
                            <div className="summary-item-main">
                                <div className="summary-item-name">{c.name}</div>
                                {c.addons && c.addons.length > 0 && (
                                    <div className="summary-item-addons">
                                        {c.addons.map(a => a.name).join(' · ')}
                                    </div>
                                )}
                                <div className="summary-item-price-row">
                                    <span className="summary-unit-price">₹ {c.price} each</span>
                                    <div className="summary-qty-ctrl">
                                        <button style={{ color: themeColor }} onClick={() => onUpdateQty(c.key, -1)} disabled={placingOrder}>−</button>
                                        <span>{c.qty}</span>
                                        <button style={{ color: themeColor }} onClick={() => onUpdateQty(c.key, +1)} disabled={placingOrder}>+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="summary-item-total" style={{ color: themeColor }}>₹ {c.price * c.qty}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="summary-section">
                <div className="section-label" style={{ color: themeColor }}>SPECIAL INSTRUCTIONS</div>
                <textarea
                    className="instructions-input"
                    placeholder="Any allergies, spice level, or special requests for the chef?"
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    disabled={placingOrder}
                    rows={3}
                />
            </div>

            <div className="summary-section">
                <div className="section-label" style={{ color: themeColor }}>BILL DETAILS</div>
                <div className="bill-rows">
                    <div className="bill-row"><span>Item subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
                    <div className="bill-row"><span>CGST (2.5%)</span><span>₹ {cgst.toFixed(2)}</span></div>
                    <div className="bill-row"><span>SGST (2.5%)</span><span>₹ {sgst.toFixed(2)}</span></div>
                    <div className="bill-row"><span>Service charge (5%)</span><span>₹ {serviceCharge.toFixed(2)}</span></div>
                    <div className="bill-row total-row">
                        <span>Grand total</span>
                        <span style={{ color: themeColor }}>₹ {grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                <p className="bill-note">Inclusive of all taxes · Service charge is optional and discretionary</p>
            </div>

            <div className="summary-footer-spacer" />
            <div className="summary-footer">
                <div className="summary-footer-inner">
                    <div className="summary-footer-info">
                        <span className="summary-footer-count">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                        <span className="summary-footer-total">₹ {grandTotal.toFixed(2)}</span>
                    </div>
                    <button
                        className="confirm-btn"
                        style={{ background: themeColor, opacity: placingOrder ? 0.6 : 1 }}
                        onClick={() => onConfirm(grandTotal, subtotal, cgst + sgst, serviceCharge)}
                        disabled={placingOrder}>
                        {placingOrder ? "Placing order..." : "Confirm order →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// ACTION HUB (post-order: 6 main + 3 secondary actions)
// ============================================================
function ActionHub({ orderResult, tableInfo, themeColor, completedTotal, onAction, onBackToMenu, paidStatus }) {
    const mainActions = [
        { id: 'pay_card', icon: '💳', title: 'Pay now', desc: 'Pay online by card', highlight: true, disabled: paidStatus === 'paid' },
        { id: 'pay_later', icon: '🕐', title: 'Pay after dining', desc: 'Settle at end of meal', disabled: paidStatus === 'paid' },
        { id: 'tap_to_pay', icon: '📲', title: 'Tap to pay', desc: 'Staff brings card machine', disabled: paidStatus === 'paid' },
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
                <div className="success-icon-sm" style={{ background: themeColor, color: "#0a0a0a" }}>✓</div>
                <div className="action-success-body">
                    <div className="action-success-title">Order placed</div>
                    <div className="action-success-sub">
                        Kitchen received order <strong style={{ color: themeColor }}>#{orderResult.order_no}</strong>
                    </div>
                </div>
            </div>

            <div className="action-meta-row">
                <div><span>TABLE</span><strong>{tableInfo.table_number}</strong></div>
                <div><span>ORDER</span><strong>#{orderResult.order_no}</strong></div>
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
                    <button
                        key={a.id}
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
// CARD PAYMENT FORM
// ============================================================
function CardPaymentForm({ amount, themeColor, onBack, onSubmit, submitting }) {
    const [number, setNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [saveCard, setSaveCard] = useState(false);
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
                <input
                    className={"form-input" + (errors.number ? " form-input-error" : "")}
                    type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                    value={number} onChange={e => setNumber(formatNumber(e.target.value))}
                    disabled={submitting} autoComplete="cc-number" />
                {errors.number && <span className="form-error">{errors.number}</span>}
            </div>

            <div className="form-section">
                <label className="form-label">Cardholder name</label>
                <input
                    className={"form-input" + (errors.name ? " form-input-error" : "")}
                    type="text" placeholder="As printed on card"
                    value={name} onChange={e => setName(e.target.value)}
                    disabled={submitting} autoComplete="cc-name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-row">
                <div className="form-section" style={{ flex: 1 }}>
                    <label className="form-label">Expiry</label>
                    <input
                        className={"form-input" + (errors.expiry ? " form-input-error" : "")}
                        type="text" inputMode="numeric" placeholder="MM/YY"
                        value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                        disabled={submitting} autoComplete="cc-exp" />
                    {errors.expiry && <span className="form-error">{errors.expiry}</span>}
                </div>
                <div className="form-section" style={{ flex: 1 }}>
                    <label className="form-label">CVV</label>
                    <input
                        className={"form-input" + (errors.cvv ? " form-input-error" : "")}
                        type="password" inputMode="numeric" placeholder="•••"
                        value={cvv} maxLength={4}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        disabled={submitting} autoComplete="cc-csc" />
                    {errors.cvv && <span className="form-error">{errors.cvv}</span>}
                </div>
            </div>

            <label className="checkbox-row">
                <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} disabled={submitting} />
                <span>Save card for faster checkout next time</span>
            </label>

            <div className="form-note">
                🔒 Secure demo payment · Card details never leave your device.<br />
                Real payment processing via Stripe / Razorpay will be added soon.
            </div>

            <div className="form-footer-spacer" />
            <div className="form-footer">
                <button
                    className="confirm-btn"
                    style={{ background: themeColor, opacity: submitting ? 0.6 : 1, width: "100%" }}
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Processing..." : `Pay ₹ ${amount.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
}

// ============================================================
// STAR RATING + REVIEW FORM
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

const TAG_SUGGESTIONS = [
    "Tasty", "Fresh", "Generous portions", "Quick service",
    "Friendly staff", "Cozy ambience", "Great value",
    "Will return", "Authentic flavors", "Hot & fresh"
];

function ReviewForm({ completedItems, themeColor, onBack, onSubmit, submitting }) {
    const [overall, setOverall] = useState(0);
    const [food, setFood] = useState(0);
    const [service, setService] = useState(0);
    const [ambience, setAmbience] = useState(0);
    const [value, setValue] = useState(0);
    const [comment, setComment] = useState("");
    const [name, setName] = useState("");
    const [recommend, setRecommend] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [itemRatings, setItemRatings] = useState({});
    const [error, setError] = useState("");

    const toggleTag = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
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
            food_rating: food || null,
            service_rating: service || null,
            ambience_rating: ambience || null,
            value_rating: value || null,
            comment: comment.trim() || null,
            customer_name: name.trim() || null,
            would_recommend: recommend,
            tags: selectedTags.length ? selectedTags.join(",") : null,
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

            <div className="form-section">
                <label className="form-label">Rate by category</label>
                <div className="rating-rows">
                    <div className="rating-row"><span>Food quality</span><StarRating value={food} onChange={setFood} color={themeColor} /></div>
                    <div className="rating-row"><span>Service</span><StarRating value={service} onChange={setService} color={themeColor} /></div>
                    <div className="rating-row"><span>Ambience</span><StarRating value={ambience} onChange={setAmbience} color={themeColor} /></div>
                    <div className="rating-row"><span>Value for money</span><StarRating value={value} onChange={setValue} color={themeColor} /></div>
                </div>
            </div>

            <div className="form-section">
                <label className="form-label">What did you love? <span className="form-label-opt">(optional)</span></label>
                <div className="tag-chips">
                    {TAG_SUGGESTIONS.map(tag => (
                        <button key={tag} type="button"
                            className={"tag-chip" + (selectedTags.includes(tag) ? " tag-chip-selected" : "")}
                            style={selectedTags.includes(tag) ? {
                                borderColor: themeColor, color: themeColor, background: `${themeColor}18`
                            } : {}}
                            onClick={() => toggleTag(tag)}>{tag}</button>
                    ))}
                </div>
            </div>

            {uniqueItems.length > 0 && (
                <div className="form-section">
                    <label className="form-label">Rate each dish <span className="form-label-opt">(optional)</span></label>
                    <div className="item-rate-list">
                        {uniqueItems.map(it => (
                            <div key={it.id} className="item-rate-row">
                                <span className="item-rate-name">{it.name}</span>
                                <StarRating value={itemRatings[it.id] || 0} onChange={r => setItemRating(it.id, r)} color={themeColor} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-section">
                <label className="form-label">Tell us more <span className="form-label-opt">(optional)</span></label>
                <textarea
                    className="instructions-input" rows={4}
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
                    <button
                        className={"toggle-btn" + (recommend === true ? " toggle-btn-active" : "")}
                        style={recommend === true ? { borderColor: "#4CAF50", color: "#4CAF50", background: "rgba(76,175,80,0.1)" } : {}}
                        onClick={() => setRecommend(true)} disabled={submitting}>👍 Yes</button>
                    <button
                        className={"toggle-btn" + (recommend === false ? " toggle-btn-active" : "")}
                        style={recommend === false ? { borderColor: "#e53935", color: "#e53935", background: "rgba(229,57,53,0.1)" } : {}}
                        onClick={() => setRecommend(false)} disabled={submitting}>👎 No</button>
                </div>
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-footer-spacer" />
            <div className="form-footer">
                <button
                    className="confirm-btn"
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
                <textarea
                    className="instructions-input" rows={5}
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
                <button
                    className="confirm-btn"
                    style={{ background: themeColor, opacity: submitting ? 0.6 : 1, width: "100%" }}
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Sending..." : "Send to staff"}
                </button>
            </div>
        </div>
    );
}

// ============================================================
// CONFIRMATION SCREEN (generic)
// ============================================================
function ConfirmationScreen({ confirmation, themeColor, onBackToHub, onBackToMenu }) {
    return (
        <div className="confirmation-page">
            <div className="confirmation-icon" style={{ color: themeColor, borderColor: themeColor }}>
                {confirmation.icon || "✓"}
            </div>
            <h1 className="confirmation-title">{confirmation.title}</h1>
            <p className="confirmation-sub">{confirmation.subtitle}</p>
            {confirmation.note && <p className="confirmation-note">{confirmation.note}</p>}
            <div className="confirmation-actions">
                <button className="confirm-btn" style={{ background: themeColor }} onClick={onBackToHub}>
                    Back to dashboard
                </button>
                <button className="back-btn-center" onClick={onBackToMenu}>Or place a new order →</button>
            </div>
        </div>
    );
}

// ============================================================
// LOADING / INVALID TOKEN
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

    const [view, setView] = useState("menu");              // menu | summary | actions
    const [actionView, setActionView] = useState("hub");   // hub | card_form | review_form | issue_form | confirmation
    const [placingOrder, setPlacingOrder] = useState(false);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [specialInstructions, setSpecialInstructions] = useState("");

    // Snapshot of order at time of placing (so review/payment screens still know what was ordered)
    const [completedItems, setCompletedItems] = useState([]);
    const [completedTotal, setCompletedTotal] = useState(0);
    const [paidStatus, setPaidStatus] = useState("unpaid");

    const [confirmation, setConfirmation] = useState(null);

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

    const goToSummary = () => {
        if (cart.length === 0) return;
        setView("summary");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const updateQty = (key, delta) => {
        setCart(prev => prev.map(c => c.key === key ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
    };

    const confirmOrder = async (grandTotal, subtotal, taxAmount, serviceCharge) => {
        if (!tableInfo || placingOrder) return;
        setPlacingOrder(true);
        const orderData = {
            restaurant_id: tableInfo.restaurant_id,
            branch_id: tableInfo.branch_id,
            table_id: tableInfo.table_id,
            total_amount: grandTotal,
            subtotal,
            tax_amount: taxAmount,
            service_charge: serviceCharge,
            special_instructions: specialInstructions,
            items: cart.map(c => ({
                item_id: c.id,
                quantity: c.qty,
                price: c.price,
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
            alert("Error placing order. Please try again.");
            console.error(err);
        } finally {
            setPlacingOrder(false);
        }
    };

    const backToMenu = () => {
        setView("menu");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const fullResetToMenu = () => {
        setView("menu");
        setActionView("hub");
        setOrderResult(null);
        setCompletedItems([]);
        setCompletedTotal(0);
        setConfirmation(null);
        setPaidStatus("unpaid");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToCategory = (category) => {
        setActiveCategory(category);
        const el = document.getElementById("cat-" + category);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // ── Action handlers ──

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
            setConfirmation({
                icon: opts.icon || "✓",
                title: opts.successTitle,
                subtitle: opts.successSub,
                note: opts.successNote
            });
            setActionView("confirmation");
        } catch (err) {
            alert("Could not send request. Please try again.");
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
                    method,
                    amount: completedTotal,
                    ...cardDetails
                })
            });
            if (!res.ok) throw new Error("Payment failed");
            const data = await res.json();
            // Update paid status if card_online
            if (method === "card_online") setPaidStatus("paid");
            else if (method === "pay_later") setPaidStatus("pay_later");
            else setPaidStatus("pending");

            setConfirmation({
                icon: opts.icon || "✓",
                title: opts.successTitle,
                subtitle: opts.successSub,
                note: opts.successNote
            });
            setActionView("confirmation");
        } catch (err) {
            alert("Payment could not be recorded. Please try again.");
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
            setConfirmation({
                icon: "⭐",
                title: "Thank you!",
                subtitle: "Your review helps us get better",
                note: "We read every piece of feedback."
            });
            setActionView("confirmation");
        } catch (err) {
            alert("Could not submit review. Please try again.");
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
            successSub: "A team member will be with you shortly to resolve this"
        });
    };

    const submitCardPayment = (cardDetails) => {
        sendPayment("card_online", {
            icon: "✓",
            successTitle: "Payment successful",
            successSub: `₹ ${completedTotal.toFixed(2)} paid · card ending ${cardDetails.card_last4}`,
            successNote: "Enjoy your meal!"
        }, cardDetails);
    };

    const handleAction = (actionId) => {
        if (actionSubmitting) return;
        switch (actionId) {
            case "pay_card": setActionView("card_form"); break;
            case "add_review": setActionView("review_form"); break;
            case "report_issue": setActionView("issue_form"); break;
            case "pay_later":
                sendPayment("pay_later", {
                    icon: "🕐",
                    successTitle: "Pay at end of meal",
                    successSub: "We've marked your order for end-of-meal billing",
                    successNote: "Just let your server know when you're ready to settle."
                });
                break;
            case "tap_to_pay":
                sendPayment("tap_at_table", {
                    icon: "📲",
                    successTitle: "Card machine on the way",
                    successSub: "A staff member is bringing the POS machine to your table",
                    successNote: "This usually takes 1–2 minutes."
                });
                break;
            case "call_staff":
                sendServiceRequest("call_staff", {
                    icon: "🔔",
                    successTitle: "Staff notified",
                    successSub: "A server will be with you in a moment"
                });
                break;
            case "request_bill":
                sendServiceRequest("request_bill", {
                    icon: "🧾",
                    successTitle: "Bill requested",
                    successSub: "Your bill is being prepared and will be brought over"
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
                    successSub: "Extra plates and utensils coming right up"
                });
                break;
            default: break;
        }
    };

    if (tokenStatus === "loading") return <LoadingScreen />;
    if (tokenStatus === "invalid") return <InvalidToken />;

    const themeColor = tableInfo?.theme_color || "#D4AF37";

    // ── Summary view ──
    if (view === "summary") {
        return (
            <OrderSummary
                cart={cart}
                tableInfo={tableInfo}
                themeColor={themeColor}
                onBack={backToMenu}
                onUpdateQty={updateQty}
                onConfirm={confirmOrder}
                placingOrder={placingOrder}
                specialInstructions={specialInstructions}
                setSpecialInstructions={setSpecialInstructions}
            />
        );
    }

    // ── Action views ──
    if (view === "actions") {
        if (actionView === "card_form") {
            return (
                <CardPaymentForm
                    amount={completedTotal}
                    themeColor={themeColor}
                    onBack={() => setActionView("hub")}
                    onSubmit={submitCardPayment}
                    submitting={actionSubmitting}
                />
            );
        }
        if (actionView === "review_form") {
            return (
                <ReviewForm
                    completedItems={completedItems}
                    themeColor={themeColor}
                    onBack={() => setActionView("hub")}
                    onSubmit={submitReview}
                    submitting={actionSubmitting}
                />
            );
        }
        if (actionView === "issue_form") {
            return (
                <ReportIssueForm
                    themeColor={themeColor}
                    onBack={() => setActionView("hub")}
                    onSubmit={submitIssue}
                    submitting={actionSubmitting}
                />
            );
        }
        if (actionView === "confirmation") {
            return (
                <ConfirmationScreen
                    confirmation={confirmation}
                    themeColor={themeColor}
                    onBackToHub={() => setActionView("hub")}
                    onBackToMenu={fullResetToMenu}
                />
            );
        }
        // default: hub
        return (
            <ActionHub
                orderResult={orderResult}
                tableInfo={tableInfo}
                themeColor={themeColor}
                completedTotal={completedTotal}
                paidStatus={paidStatus}
                onAction={handleAction}
                onBackToMenu={fullResetToMenu}
            />
        );
    }

    // ── Menu view ──
    return (
        <div className="app">
            <div className="hero">
                <div className="hero-bg" style={{
                    backgroundImage: `url('${tableInfo.hero_image_url || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80"}')`
                }} />
                <div className="hero-overlay" />
                <div className="hero-content">
                    <span className="restaurant-tag" style={{ color: themeColor }}>{tableInfo.restaurant_name}</span>
                    <h1 className="hero-title">{tableInfo.branch_subtitle || tableInfo.branch_name}</h1>
                    <p className="hero-sub">{tableInfo.tagline}</p>
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
                                const vegColor = item.is_veg ? "#4CAF50" : "#e53935";
                                return (
                                    <div className="item-card" key={item.id} onClick={() => setOpenItemId(item.id)}>
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
                                                <span className="item-price" style={{ color: themeColor }}>₹ {item.price}</span>
                                                <div className="item-action" onClick={e => e.stopPropagation()}>
                                                    {qty === 0 ? (
                                                        <button className="add-btn" style={{ background: themeColor }} onClick={() => setOpenItemId(item.id)}>+</button>
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

            {cart.length > 0 && <div className="sticky-spacer" />}

            {cart.length > 0 && (
                <div className="sticky-bar">
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

            {openItemId && (
                <ItemSheet itemId={openItemId} onClose={() => setOpenItemId(null)} onAddToCart={addToCart} themeColor={themeColor} />
            )}
        </div>
    );
}

export default App;
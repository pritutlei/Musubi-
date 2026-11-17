/**
 * Spam Musubi & Onigiri Bar - Interactive App Script
 */

// 1. Menu Data
const MENU_ITEMS = [
  {
    id: "musubi-with-egg",
    name: "Spam Musubi with Egg",
    category: "musubi",
    price: 55,
    bundleNote: null,
    badge: "Best Seller 🔥",
    badgeClass: "badge-bestseller",
    emoji: "🍳🥓",
    description: "Pan-seared teriyaki glazed Spam, fluffy golden egg omelet, and seasoned sushi rice wrapped in roasted nori."
  },
  {
    id: "musubi-no-egg",
    name: "Spam Musubi (Without Egg)",
    category: "musubi",
    price: 50,
    bundleNote: null,
    badge: "Classic ⭐",
    badgeClass: "badge-classic",
    emoji: "🥓🍙",
    description: "The timeless Hawaiian favorite! Savory caramelized Spam over warm seasoned rice wrapped in crisp seaweed."
  },
  {
    id: "onigiri-original",
    name: "Original Onigiri",
    category: "onigiri",
    price: 35,
    bundleNote: "3 for ₱100 Combo",
    badge: "3 for ₱100 Deal 🍙",
    badgeClass: "badge-bundle",
    emoji: "🍙✨",
    description: "Traditional Japanese triangular rice ball blended with savory furikake seasoning and crispy nori."
  },
  {
    id: "onigiri-spicy",
    name: "Spicy Onigiri",
    category: "onigiri",
    price: 35,
    bundleNote: "3 for ₱100 Combo",
    badge: "Spicy 🌶️",
    badgeClass: "badge-spicy",
    emoji: "🍙🌶️",
    description: "Spiced Japanese rice triangle with spicy togarashi seasoning, savory kick, and toasted seaweed wrap."
  }
];

// 2. Cart State
let cart = {}; // { itemId: quantity }
let lastOrderReceipt = "";

// 3. DOM Elements
const menuGrid = document.getElementById("menu-grid");
const cartDrawer = document.getElementById("cart-drawer");
const cartBackdrop = document.getElementById("cart-drawer-backdrop");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartCounter = document.getElementById("cart-counter");
const cartDrawerCount = document.getElementById("cart-drawer-count");
const cartItemsList = document.getElementById("cart-items-list");
const cartSubtotalVal = document.getElementById("cart-subtotal-val");
const cartDiscountVal = document.getElementById("cart-discount-val");
const bundleDiscountRow = document.getElementById("bundle-discount-row");
const cartTotalVal = document.getElementById("cart-total-val");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutBtnPrice = document.getElementById("checkout-btn-price");
const cartPromoBanner = document.getElementById("cart-promo-banner");
const cartPromoText = document.getElementById("cart-promo-text");
const toast = document.getElementById("toast");

// Modals
const checkoutModal = document.getElementById("checkout-modal");
const successModal = document.getElementById("success-modal");
const modalSummaryItems = document.getElementById("modal-summary-items");
const modalSummaryTotalVal = document.getElementById("modal-summary-total-val");
const addressGroup = document.getElementById("address-group");
const orderReceiptContent = document.getElementById("order-receipt-content");

// 4. Initialize Menu
function renderMenu(filter = "all") {
  menuGrid.innerHTML = "";
  const filtered = filter === "all" ? MENU_ITEMS : MENU_ITEMS.filter(item => item.category === filter);

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-top">
        <span class="card-badge ${item.badgeClass}">${item.badge}</span>
        <div class="card-image-box">
          <span class="card-emoji-visual">${item.emoji}</span>
        </div>
        <h3 class="card-title">${item.name}</h3>
        <p class="card-desc">${item.description}</p>
      </div>
      <div class="card-bottom">
        <div class="price-container">
          <span class="price-main">₱${item.price}</span>
          ${item.bundleNote ? `<span class="price-sub">${item.bundleNote}</span>` : ""}
        </div>
        <button class="btn-add-cart" onclick="addToCart('${item.id}')" aria-label="Add ${item.name} to cart" title="Add to cart">
          +
        </button>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

// 5. Category Filtering
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderMenu(btn.dataset.filter);
  });
});

// 6. Cart Logic & 3 for 100 Bundle Calculation
function calculateCartTotals() {
  let subtotal = 0;
  let totalItemsCount = 0;
  let totalOnigiriCount = 0;

  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = MENU_ITEMS.find(m => m.id === id);
    if (!item) continue;

    subtotal += item.price * qty;
    totalItemsCount += qty;

    if (item.category === "onigiri") {
      totalOnigiriCount += qty;
    }
  }

  // 3 for 100 Deal Calculation:
  // Regular: 3 * 35 = 105. Bundle: 100.
  // Saving: ₱5 discount per complete set of 3 Onigiris!
  const completeSetsOfThree = Math.floor(totalOnigiriCount / 3);
  const discount = completeSetsOfThree * 5;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total,
    totalItemsCount,
    totalOnigiriCount,
    completeSetsOfThree
  };
}

function updateCartUI() {
  const { subtotal, discount, total, totalItemsCount, totalOnigiriCount, completeSetsOfThree } = calculateCartTotals();

  // Badges & Counters
  cartCounter.textContent = totalItemsCount;
  cartDrawerCount.textContent = totalItemsCount;

  if (totalItemsCount > 0) {
    cartCounter.style.transform = "scale(1.2)";
    setTimeout(() => { cartCounter.style.transform = "scale(1)"; }, 200);
  }

  // Cart List Items
  if (totalItemsCount === 0) {
    cartItemsList.innerHTML = `
      <div class="empty-cart-state">
        <span class="empty-icon">🍙</span>
        <h4>Your cart is empty</h4>
        <p>Explore our menu and add your favorite musubi!</p>
        <button class="btn btn-sm btn-primary" onclick="closeCart()">Browse Menu</button>
      </div>
    `;
    checkoutBtn.disabled = true;
    bundleDiscountRow.classList.add("hidden");
    cartPromoBanner.classList.add("hidden");
  } else {
    checkoutBtn.disabled = false;
    cartItemsList.innerHTML = "";

    for (const [id, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const item = MENU_ITEMS.find(m => m.id === id);
      if (!item) continue;

      const itemRow = document.createElement("div");
      itemRow.className = "cart-item";
      itemRow.innerHTML = `
        <div class="cart-item-icon">${item.emoji}</div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₱${item.price} each</div>
        </div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
          <span class="qty-number">${qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      `;
      cartItemsList.appendChild(itemRow);
    }

    // Promo banner hint
    if (totalOnigiriCount > 0) {
      cartPromoBanner.classList.remove("hidden");
      const remainder = totalOnigiriCount % 3;
      if (completeSetsOfThree > 0 && remainder === 0) {
        cartPromoText.textContent = `🎉 Awesome! ${completeSetsOfThree}x Onigiri 3-for-₱100 promo applied!`;
      } else if (remainder === 1) {
        cartPromoText.textContent = `💡 Add 2 more Onigiri to get 3 for ₱100!`;
      } else if (remainder === 2) {
        cartPromoText.textContent = `💡 Add 1 more Onigiri to get 3 for ₱100! (Save ₱5)`;
      }
    } else {
      cartPromoBanner.classList.add("hidden");
    }

    // Bundle Discount display
    if (discount > 0) {
      bundleDiscountRow.classList.remove("hidden");
      cartDiscountVal.textContent = `-₱${discount}`;
    } else {
      bundleDiscountRow.classList.add("hidden");
    }
  }

  // Price Totals
  cartSubtotalVal.textContent = `₱${subtotal}`;
  cartTotalVal.textContent = `₱${total}`;
  checkoutBtnPrice.textContent = `₱${total}`;
}

function addToCart(itemId, quantity = 1) {
  cart[itemId] = (cart[itemId] || 0) + quantity;
  updateCartUI();
  const item = MENU_ITEMS.find(m => m.id === itemId);
  showToast(`Added ${item ? item.name : 'item'} to cart!`);
}

function updateQty(itemId, change) {
  if (!cart[itemId]) return;
  cart[itemId] += change;
  if (cart[itemId] <= 0) {
    delete cart[itemId];
  }
  updateCartUI();
}

// Quick Add 3-Pack Onigiri Promo
function quickAddBundle() {
  // Adds 2 Original + 1 Spicy to make the 3 for 100 deal
  addToCart("onigiri-original", 2);
  addToCart("onigiri-spicy", 1);
  openCart();
  showToast("🍙 3-Pack Onigiri (3 for ₱100) added to your cart!");
}

// 7. Drawer Open / Close
function openCart() {
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("open");
  document.body.style.overflow = "";
}

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

// 8. Toast Helper
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// 9. Checkout Modal & Order Handling
function openCheckoutModal() {
  const { totalItemsCount, subtotal, discount, total } = calculateCartTotals();
  if (totalItemsCount === 0) return;

  // Build order summary rows for modal
  modalSummaryItems.innerHTML = "";
  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = MENU_ITEMS.find(m => m.id === id);
    if (!item) continue;

    const row = document.createElement("div");
    row.className = "modal-summary-item";
    row.innerHTML = `
      <span>${qty}x ${item.name}</span>
      <span>₱${item.price * qty}</span>
    `;
    modalSummaryItems.appendChild(row);
  }

  if (discount > 0) {
    const discRow = document.createElement("div");
    discRow.className = "modal-summary-item";
    discRow.style.color = "#15803d";
    discRow.style.fontWeight = "700";
    discRow.innerHTML = `
      <span>Onigiri Bundle Promo (3 for ₱100)</span>
      <span>-₱${discount}</span>
    `;
    modalSummaryItems.appendChild(discRow);
  }

  modalSummaryTotalVal.textContent = `₱${total}`;
  closeCart();
  checkoutModal.classList.add("open");
}

function closeCheckoutModal() {
  checkoutModal.classList.remove("open");
}

// Toggle delivery address input based on radio selection
document.querySelectorAll('input[name="orderType"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "Delivery") {
      addressGroup.style.display = "block";
      document.getElementById("cust-address").required = true;
    } else {
      addressGroup.style.display = "none";
      document.getElementById("cust-address").required = false;
    }
  });
});

// Handle Order Submission
function handlePlaceOrder(event) {
  event.preventDefault();

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const orderType = document.querySelector('input[name="orderType"]:checked').value;
  const address = document.getElementById("cust-address").value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const notes = document.getElementById("cust-notes").value.trim();

  const { subtotal, discount, total, completeSetsOfThree } = calculateCartTotals();
  const orderId = "SM-" + Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const timeString = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Build items text
  let itemsListText = "";
  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = MENU_ITEMS.find(m => m.id === id);
    if (!item) continue;
    itemsListText += `• ${qty}x ${item.name} (₱${item.price * qty})\n`;
  }

  // Format Receipt
  lastOrderReceipt = 
`==============================
🍙 SPAM MUSUBI & ONIGIRI BAR
ORDER CONFIRMATION: #${orderId}
==============================
Date: ${timeString}
Customer: ${name}
Phone: ${phone}
Order Type: ${orderType}
${orderType === "Delivery" ? `Delivery Address: ${address}\n` : ""}Payment: ${paymentMethod}
${notes ? `Special Notes: ${notes}\n` : ""}
------------------------------
ITEMS ORDERED:
${itemsListText}
Subtotal: ₱${subtotal}
${discount > 0 ? `Onigiri Promo Savings: -₱${discount} (3 for ₱100)\n` : ""}TOTAL PAYABLE: ₱${total}
==============================
Thank you for your order!`;

  orderReceiptContent.textContent = lastOrderReceipt;

  // Clear Cart
  cart = {};
  updateCartUI();
  closeCheckoutModal();

  // Reset Form
  document.getElementById("checkout-form").reset();
  addressGroup.style.display = "none";

  // Show Success Modal
  successModal.classList.add("open");
}

function closeSuccessModal() {
  successModal.classList.remove("open");
}

function copyReceiptText() {
  if (!lastOrderReceipt) return;
  navigator.clipboard.writeText(lastOrderReceipt).then(() => {
    showToast("Receipt copied to clipboard!");
  }).catch(() => {
    showToast("Could not copy automatically. You can copy the text directly.");
  });
}

// Close modal when backdrop clicked
[checkoutModal, successModal].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });
});

// Initial Render
renderMenu();
updateCartUI();

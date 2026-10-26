const CART_STORAGE_KEY = "onlineBookStoreCart";

function readCart() {
    try {
        const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        if (!Array.isArray(storedCart)) {
            return [];
        }

        return storedCart.filter(item =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            Number.isFinite(Number(item.price)) &&
            Number(item.price) >= 0 &&
            Number.isInteger(Number(item.quantity)) &&
            Number(item.quantity) > 0
        ).map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }));
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

function showCartFeedback(productName) {
    let feedback = document.querySelector("#cart-feedback");
    if (!feedback) {
        feedback = document.createElement("div");
        feedback.id = "cart-feedback";
        feedback.className = "cart-feedback";
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        document.body.append(feedback);
    }

    const message = document.createElement("span");
    const viewCartLink = document.createElement("a");
    message.textContent = `${productName} added to cart.`;
    viewCartLink.href = "cart.html";
    viewCartLink.textContent = "View cart";
    feedback.replaceChildren(message, viewCartLink);
}

function updateAddButtons() {
    const quantities = new Map(readCart().map(item => [item.id, item.quantity]));

    document.querySelectorAll("[data-add-to-cart]").forEach(button => {
        const quantity = quantities.get(button.dataset.id) || 0;
        const name = button.dataset.name;
        button.textContent = quantity > 0 ? `Add to cart (${quantity})` : "Add to cart";
        button.setAttribute(
            "aria-label",
            quantity > 0
                ? `Add another ${name} to cart. Current quantity: ${quantity}`
                : `Add ${name} to cart`
        );
    });
}

function createCartButton(label, action, id, description) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-reset";
    button.dataset.cartAction = action;
    button.dataset.cartId = id;
    button.setAttribute("aria-label", description);
    button.textContent = label;
    return button;
}

function renderCart() {
    const cartItems = document.querySelector("#cart-items");
    if (!cartItems) {
        return;
    }

    const cart = readCart();
    const cartTable = document.querySelector("#cart-table");
    const cartEmpty = document.querySelector("#cart-empty");
    const clearCartButton = document.querySelector("#clear-cart");
    const cartTotal = document.querySelector("#cart-total");

    cartItems.replaceChildren();
    cartTable.hidden = cart.length === 0;
    cartEmpty.hidden = cart.length !== 0;
    clearCartButton.disabled = cart.length === 0;

    let total = 0;
    for (const item of cart) {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const priceCell = document.createElement("td");
        const quantityCell = document.createElement("td");
        const amountCell = document.createElement("td");
        const actionCell = document.createElement("td");
        const quantityLabel = document.createElement("span");

        nameCell.textContent = item.name;
        priceCell.textContent = formatPrice(item.price);
        quantityLabel.textContent = item.quantity;
        quantityLabel.style.margin = "0 8px";
        quantityCell.append(
            createCartButton("-", "decrease", item.id, `Decrease ${item.name} quantity`),
            quantityLabel,
            createCartButton("+", "increase", item.id, `Increase ${item.name} quantity`)
        );
        amountCell.textContent = formatPrice(item.price * item.quantity);
        actionCell.append(createCartButton("Remove", "remove", item.id, `Remove ${item.name} from cart`));
        row.append(nameCell, priceCell, quantityCell, amountCell, actionCell);
        cartItems.append(row);
        total += item.price * item.quantity;
    }

    cartTotal.textContent = formatPrice(total);
}

document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-to-cart]");
    if (addButton) {
        const product = {
            id: addButton.dataset.id,
            name: addButton.dataset.name,
            price: Number(addButton.dataset.price)
        };

        if (!product.id || !product.name || !Number.isFinite(product.price) || product.price < 0) {
            return;
        }

        const cart = readCart();
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart(cart);
        updateAddButtons();
        showCartFeedback(product.name);
        return;
    }

    const actionButton = event.target.closest("[data-cart-action]");
    if (!actionButton) {
        return;
    }

    const action = actionButton.dataset.cartAction;
    let cart = readCart();
    if (action === "clear") {
        cart = [];
    } else {
        const item = cart.find(cartItem => cartItem.id === actionButton.dataset.cartId);
        if (!item) {
            return;
        }
        if (action === "remove") {
            cart = cart.filter(cartItem => cartItem.id !== item.id);
        } else if (action === "increase") {
            item.quantity += 1;
        } else if (action === "decrease") {
            item.quantity = Math.max(1, item.quantity - 1);
        }
    }

    saveCart(cart);
    renderCart();
    updateAddButtons();
});

window.addEventListener("pageshow", updateAddButtons);
window.addEventListener("storage", event => {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
        updateAddButtons();
    }
});

renderCart();
updateAddButtons();
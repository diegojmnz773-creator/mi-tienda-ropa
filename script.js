
const db = window.supabaseClient;
const WHATSAPP = "593969569214";

let products = [];
let cart = [];

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(price) || 0);
}

function getSizes(sizes) {
  return sizes || "Consultar tallas";
}

function parseSizes(sizes) {
  if (!sizes) return ["Consultar talla"];

  const result = String(sizes)
    .split(/[,;/|]+/)
    .map(size => size.trim())
    .filter(Boolean);

  return result.length ? result : ["Consultar talla"];
}

// CATÁLOGO

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = products.filter(product => {
    const matchesSearch =
      String(product.name || "").toLowerCase().includes(search);

    const matchesCategory =
      !category || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    grid.innerHTML =
      "<p class='loading'>No encontramos prendas disponibles.</p>";
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const sizes = parseSizes(product.sizes);

    return `
      <article class="product-card">
        <img
          src="${escapeHTML(product.image_url || "")}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >

        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>

          <p class="product-price">
            ${formatPrice(product.price)}
          </p>

          <p class="product-sizes">
            Tallas: ${escapeHTML(getSizes(product.sizes))}
          </p>

          <label>
            Selecciona tu talla:
            <select class="product-size">
              ${sizes.map(size => `
                <option value="${escapeHTML(size)}">
                  ${escapeHTML(size)}
                </option>
              `).join("")}
            </select>
          </label>

          <label>
            Cantidad:
            <input
              class="product-quantity"
              type="number"
              min="1"
              max="20"
              value="1"
            >
          </label>

          <button
            class="btn-primary add-to-cart"
            type="button"
            data-product-id="${escapeHTML(product.id)}"
          >
            AGREGAR AL CARRITO
          </button>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      const size = card.querySelector(".product-size").value;
      const quantityInput = card.querySelector(".product-quantity");

      const quantity = Math.max(
        1,
        Math.min(20, Number.parseInt(quantityInput.value, 10) || 1)
      );

      addToCart(button.dataset.productId, size, quantity);
      quantityInput.value = "1";
    });
  });
}

// CARRITO

function addToCart(productId, size, quantity) {
  const product = products.find(
    p => String(p.id) === String(productId)
  );

  if (!product) {
    alert("No encontramos esta prenda.");
    return;
  }

  const existing = cart.find(item =>
    String(item.productId) === String(productId) &&
    item.size === size
  );

  if (existing) {
    existing.quantity = Math.min(20, existing.quantity + quantity);
  } else {
    cart.push({
      productId: product.id,
      size,
      quantity
    });
  }

  renderCart();

  document.getElementById("carrito").scrollIntoView({
    behavior: "smooth"
  });
}

function changeQuantity(index, amount) {
  const item = cart[index];

  if (!item) return;

  item.quantity = Math.max(
    1,
    Math.min(20, item.quantity + amount)
  );

  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const totalUnits = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = cart.reduce((sum, item) => {
    const product = products.find(
      p => String(p.id) === String(item.productId)
    );

    return sum + (Number(product?.price) || 0) * item.quantity;
  }, 0);

  cartCount.textContent = totalUnits;
  cartTotal.textContent = formatPrice(total);
  checkoutButton.disabled = cart.length === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => {
    const product = products.find(
      p => String(p.id) === String(item.productId)
    );

    if (!product) return "";

    const subtotal = Number(product.price) * item.quantity;

    return `
      <article class="cart-item">
        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p>Talla: ${escapeHTML(item.size)}</p>
          <p>Precio: ${formatPrice(product.price)}</p>
          <p>Subtotal: ${formatPrice(subtotal)}</p>
        </div>

        <div class="cart-controls">
          <button
            type="button"
            class="quantity-minus"
            data-index="${index}"
            aria-label="Disminuir cantidad"
          >−</button>

          <span>${item.quantity}</span>

          <button
            type="button"
            class="quantity-plus"
            data-index="${index}"
            aria-label="Aumentar cantidad"
          >+</button>

          <button
            type="button"
            class="remove-cart-item"
            data-index="${index}"
          >
            ELIMINAR
          </button>
        </div>
      </article>
    `;
  }).join("");

  cartItems.querySelectorAll(".quantity-minus").forEach(button => {
    button.addEventListener("click", () => {
      changeQuantity(Number(button.dataset.index), -1);
    });
  });

  cartItems.querySelectorAll(".quantity-plus").forEach(button => {
    button.addEventListener("click", () => {
      changeQuantity(Number(button.dataset.index), 1);
    });
  });

  cartItems.querySelectorAll(".remove-cart-item").forEach(button => {
    button.addEventListener("click", () => {
      removeFromCart(Number(button.dataset.index));
    });
  });
}

// ENVIAR PEDIDO POR WHATSAPP

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) return;

  let total = 0;

  const lines = cart.map((item, index) => {
    const product = products.find(
      p => String(p.id) === String(item.productId)
    );

    if (!product) return "";

    const subtotal = Number(product.price) * item.quantity;
    total += subtotal;

    return (
      `${index + 1}. ${product.name}\n` +
      `   Talla: ${item.size}\n` +
      `   Cantidad: ${item.quantity}\n` +
      `   Precio unitario: ${formatPrice(product.price)}\n` +
      `   Subtotal: ${formatPrice(subtotal)}`
    );
  }).filter(Boolean);

  const message =
    `¡Hola Anto! ❤️ Quiero realizar un pedido en EL CLOSET DE ANTO.\n\n` +
    `MI PEDIDO:\n\n` +
    lines.join("\n\n") +
    `\n\nTOTAL: ${formatPrice(total)}` +
    `\n\n¿Me confirmas la disponibilidad y cómo realizar la compra?`;

  const url =
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
});

// CARGAR PRODUCTOS

async function loadProducts() {
  grid.innerHTML = "<p class='loading'>Cargando colección...</p>";

  try {
    if (!db) {
      throw new Error("No se pudo conectar con Supabase.");
    }

    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];

    const categories = [
      ...new Set(products.map(p => p.category).filter(Boolean))
    ];

    categoryFilter.innerHTML =
      '<option value="">Todas las categorías</option>' +
      categories.map(category =>
        `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
      ).join("");

    renderProducts();
    renderCart();

  } catch (error) {
    console.error("Error cargando productos:", error);

    grid.innerHTML =
      "<p class='loading'>No pudimos cargar el catálogo. Intenta nuevamente.</p>";
  }
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

// RECUPERACIÓN DE CONTRASEÑA

const recoverySection = document.getElementById("recoverySection");
const recoveryForm = document.getElementById("recoveryForm");

if (db && recoverySection && recoveryForm) {
  db.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) {
      recoverySection.hidden = false;
      recoverySection.scrollIntoView({ behavior: "smooth" });
    }
  });

  recoveryForm.addEventListener("submit", async event => {
    event.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirmation = document.getElementById("confirmPassword").value;
    const message = document.getElementById("recoveryMessage");

    if (password.length < 8) {
      message.textContent =
        "La contraseña debe tener al menos 8 caracteres.";
      return;
    }

    if (password !== confirmation) {
      message.textContent = "Las contraseñas no coinciden.";
      return;
    }

    const { error } = await db.auth.updateUser({ password });

    if (error) {
      message.textContent = "Error: " + error.message;
      return;
    }

    message.textContent =
      "¡Contraseña actualizada correctamente! Ya puedes entrar al panel.";

    recoveryForm.reset();
  });
}

loadProducts();

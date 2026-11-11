
const SUPABASE_URL = "https://psyoerdzvkedptvffpnt.supabase.co";
const SUPABASE_KEY = "sb_publishable_XNo_u5CNTLj-4r-yGoh5OQ_cZ9EXoVd";

const db = window.supabaseClient;

//const db = window.supabase.createClient(
 // SUPABASE_URL,
  //SUPABASE_KEY
//);

const WHATSAPP = "593990961961";

let products = [];

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

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

function buyProduct(productId) {
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;

  const message =
    `Hola Anto, me interesa esta prenda:\n\n` +
    `Producto: ${product.name}\n` +
    `Precio: ${formatPrice(product.Price)}\n` +
    `Tallas: ${getSizes(product.sizes)}\n\n` +
    `¿Está disponible?`;

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

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
    grid.innerHTML = "<p class='loading'>No encontramos prendas disponibles.</p>";
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <img
        src="${escapeHTML(product.image_url || "")}"
        alt="${escapeHTML(product.name)}"
        loading="lazy"
        onerror="this.style.display='none'"
      >

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
        <p class="product-sizes">
          Tallas: ${escapeHTML(getSizes(product.sizes))}
        </p>
        <button
          class="btn-primary"
          type="button"
          onclick="buyProduct(${JSON.stringify(String(product.id))})"
        >
          COMPRAR POR WHATSAPP
        </button>
      </div>
    </article>
  `).join("");
}

async function loadProducts() {
  grid.innerHTML = "<p class='loading'>Cargando colección...</p>";

  try {
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

  } catch (error) {
    console.error("Error cargando productos:", error);
    grid.innerHTML =
      "<p class='loading'>No pudimos cargar el catálogo. Intenta nuevamente.</p>";
  }
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

loadProducts();


const SUPABASE_URL = "https://psyoerdzvkedptvffpnt.supabase.co";
const SUPABASE_KEY = "sb_publishable_XNo_u5CNTLj-4r-yGoh5OQ_cZ9EXoVd";

const ADMIN_ID = "7e94240f-a568-42f7-87e6-eac77ecc8d14";
const BUCKET = "ropa";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const productForm = document.getElementById("productForm");
const loginMessage = document.getElementById("loginMessage");
const productMessage = document.getElementById("productMessage");
const adminProducts = document.getElementById("adminProducts");

let currentUser = null;

function showMessage(element, message) {
  element.textContent = message;
}

function showDashboard(isLoggedIn) {
  loginSection.hidden = isLoggedIn;
  dashboardSection.hidden = !isLoggedIn;
}

function resetProductForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
}

async function uploadPhoto(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
  const path = `productos/${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data } = db.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

async function loadAdminProducts() {
  adminProducts.textContent = "Cargando productos...";

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    adminProducts.textContent = "No se pudieron cargar los productos: " + error.message;
    return;
  }

  adminProducts.replaceChildren();

  if (!data.length) {
    adminProducts.textContent = "Todavía no hay productos registrados.";
    return;
  }

  data.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const price = document.createElement("p");
    price.textContent = "$" + Number(product.price).toFixed(2);

    const sizes = document.createElement("p");
    sizes.textContent = "Tallas: " + (product.sizes || "No especificadas");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn-primary";
    editButton.textContent = "EDITAR";

    editButton.addEventListener("click", () => {
      document.getElementById("productId").value = product.id;
      document.getElementById("name").value = product.name || "";
      document.getElementById("price").value = product.price ?? "";
      document.getElementById("category").value = product.category || "";
      document.getElementById("sizes").value = product.sizes || "";
      document.getElementById("description").value = product.description || "";
      document.getElementById("photo").value = "";

      showMessage(productMessage, "Editando: " + product.name);

      productForm.scrollIntoView({ behavior: "smooth" });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "ELIMINAR";

    deleteButton.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas eliminar " + product.name + "?")) return;

      deleteButton.disabled = true;

      const { error } = await db
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        alert("No se pudo eliminar: " + error.message);
        deleteButton.disabled = false;
        return;
      }

      showMessage(productMessage, "Producto eliminado correctamente.");
      await loadAdminProducts();
    });

    card.append(title, price, sizes, editButton, deleteButton);
    adminProducts.appendChild(card);
  });
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  showMessage(loginMessage, "Verificando acceso...");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(loginMessage, "Error de acceso: " + error.message);
    return;
  }

  if (data.user.id !== ADMIN_ID) {
    await db.auth.signOut();
    showMessage(loginMessage, "Acceso denegado. Usuario no autorizado.");
    return;
  }

  currentUser = data.user;
  showDashboard(true);
  await loadAdminProducts();
});

productForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser || currentUser.id !== ADMIN_ID) {
    showMessage(productMessage, "No tienes autorización.");
    return;
  }

  const saveButton = productForm.querySelector('button[type="submit"]');
  saveButton.disabled = true;

  try {
    const id = document.getElementById("productId").value;

    const product = {
      name: document.getElementById("name").value.trim(),
      price: Number(document.getElementById("price").value),
      category: document.getElementById("category").value.trim(),
      sizes: document.getElementById("sizes").value.trim(),
      description: document.getElementById("description").value.trim()
    };

    if (!product.name || !product.category ||
        !Number.isFinite(product.price) || product.price < 0) {
      throw new Error("Revisa el nombre, categoría y precio.");
    }

    const photo = document.getElementById("photo").files[0];

    if (photo) {
      if (!photo.type.startsWith("image/")) {
        throw new Error("Selecciona un archivo de imagen válido.");
      }

      if (photo.size > 5 * 1024 * 1024) {
        throw new Error("La imagen no debe superar 5 MB.");
      }

      product.image_url = await upload

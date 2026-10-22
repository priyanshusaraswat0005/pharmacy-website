function getPriceHtml(m) {
  if (m.mrp && m.mrp > m.price) {
    const discountPercent = Math.round(((m.mrp - m.price) / m.mrp) * 100);
    return "<p><span class='discount-badge'>" + discountPercent + "% OFF</span></p>" +
      "<p class='price'><span class='mrp-strike'>Rs. " + m.mrp + "</span> Rs. " + m.price + "</p>";
  }
  return "<p class='price'>Rs. " + m.price + "</p>";
}

function getStarsHtml(rating) {
  const fullStars = Math.round(rating);
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars = stars + (i < fullStars ? "★" : "☆");
  }
  return stars;
}

function getMedicineIcon(category) {
  if (category === "Pain Relief" || category === "Blood Pressure") {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Pills.JPG";
  }
  if (category === "Antibiotic" || category === "Diabetes") {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Capsules1.JPG";
  }
  if (category === "Cold and Cough") {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Sirop%20toux.jpg";
  }
  if (category === "First Aid") {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Plasterbandage.JPG";
  }
  if (category === "Allergy" || category === "Vitamins") {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Vitamin%20D%20pills.jpg";
  }
  return "https://commons.wikimedia.org/wiki/Special:FilePath/Various%20pills.JPG";
}

function getMedicineImage(m) {
  if (m.image_url) {
    return m.image_url.replace(/'/g, "%27");
  }
  return getMedicineIcon(m.category);
}

// like flipkart shows estimated delivery, we just add 4 days to today
function getEstimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  const options = { weekday: "short", day: "numeric", month: "short" };
  return d.toLocaleDateString("en-IN", options);
}

function getEstimatedDeliveryDateOnly() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toISOString().split("T")[0];
}

function getWishlist() {
  const data = localStorage.getItem("wishlist");
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function saveWishlist(list) {
  localStorage.setItem("wishlist", JSON.stringify(list));
}

function toggleWishlist(id, name, price) {
  const list = getWishlist();
  let index = -1;

  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      index = i;
    }
  }

  if (index === -1) {
    list.push({ id: id, name: name, price: price });
    saveWishlist(list);
  } else {
    list.splice(index, 1);
    saveWishlist(list);
  }
}

function isInWishlist(id) {
  const list = getWishlist();
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return true;
    }
  }
  return false;
}

function toggleHeart(el, id, name, price) {
  toggleWishlist(id, name, price);
  el.classList.toggle("active");
}

function getCart() {
  const cartData = localStorage.getItem("cart");
  if (cartData) {
    return JSON.parse(cartData);
  }
  return [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id, name, price, needsPrescription, coldChain) {
  const cart = getCart();
  let found = false;

  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      cart[i].qty = cart[i].qty + 1;
      found = true;
    }
  }

  if (!found) {
    cart.push({
      id: id,
      name: name,
      price: price,
      qty: 1,
      needsPrescription: needsPrescription,
      coldChain: coldChain || 0,
    });
  }

  saveCart(cart);
  alert(name + " added to cart");
}

function getCartCount() {
  const cart = getCart();
  let count = 0;
  for (let i = 0; i < cart.length; i++) {
    count = count + cart[i].qty;
  }
  return count;
}

function saveProfileCache(address, phone) {
  if (address) {
    localStorage.setItem("savedAddress", address);
  }
  if (phone) {
    localStorage.setItem("savedPhone", phone);
  }
}

function getProfileCache() {
  return {
    address: localStorage.getItem("savedAddress") || "",
    phone: localStorage.getItem("savedPhone") || ""
  };
}

function isLoggedIn() {
  return localStorage.getItem("userId") !== null;
}

function getUserId() {
  return localStorage.getItem("userId");
}

function getUserName() {
  return localStorage.getItem("userName");
}

function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("savedAddress");
  localStorage.removeItem("savedPhone");
  window.location.href = "home.html";
}

function loadHeader() {
  const headerNav = document.getElementById("headerNav");
  if (!headerNav) {
    return;
  }

  let navHtml = '<a href="home.html">Home</a>';
  navHtml = navHtml + '<a href="labtests.html">Lab Tests</a>';
  navHtml = navHtml + '<a href="doctors.html">Chat with Doctor</a>';
  navHtml = navHtml + '<a href="membership.html">MediCare Plus</a>';
  navHtml = navHtml + '<a href="cart.html">Cart (' + getCartCount() + ')</a>';
  navHtml = navHtml + '<a href="wishlist.html">Wishlist</a>';

  if (isLoggedIn()) {
    navHtml = navHtml + '<a href="profile.html">' + getUserName() + '</a>';
  } else {
    navHtml = navHtml + '<a href="login.html">Login</a>';
  }

  headerNav.innerHTML = navHtml;
}

document.addEventListener("DOMContentLoaded", loadHeader);

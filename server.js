const express = require("express");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");
const db = require("./db.js");

const app = express();
const PORT = process.env.PORT || 3000;

const SHOP_UPI_ID = "priyanshusaraswat99@okicici";
const SHOP_UPI_NAME = "MediCare Pharmacy";
const SHOP_WHATSAPP_NUMBER = "919529227771";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.post("/api/register", function (req, res) {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";
  const age = req.body.age;

  if (name === "" || email === "" || password === "" || !age) {
    res.json({ success: false, message: "Please fill all fields" });
    return;
  }

  db.run(
    "INSERT INTO users (name, email, password, age) VALUES (?, ?, ?, ?)",
    [name, email, password, age],
    function (err) {
      if (err) {
        res.json({ success: false, message: "Could not register, please try again" });
      } else {
        res.json({ success: true, userId: this.lastID, name: name });
      }
    }
  );
});

app.post("/api/login", function (req, res) {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password;

  db.get(
    "SELECT * FROM users WHERE LOWER(email) = ? AND password = ?",
    [email, password],
    function (err, row) {
      if (row) {
        res.json({ success: true, userId: row.id, name: row.name });
      } else {
        res.json({ success: false, message: "Wrong email or password" });
      }
    }
  );
});

app.get("/api/medicines", function (req, res) {
  const search = req.query.search || "";
  const category = req.query.category || "";

  let sql = "SELECT * FROM medicines WHERE name LIKE ?";
  let params = ["%" + search + "%"];

  if (category !== "" && category !== "All") {
    sql = sql + " AND category = ?";
    params.push(category);
  }

  db.all(sql, params, function (err, rows) {
    res.json(rows);
  });
});

app.get("/api/medicines/:id", function (req, res) {
  const id = req.params.id;
  db.get("SELECT * FROM medicines WHERE id = ?", [id], function (err, medicine) {
    if (!medicine) {
      res.json({ found: false });
      return;
    }
    if (medicine.stock === 0) {
      // agar stock khatam hai to same category ki dusri medicine dikha do
      db.all(
        "SELECT * FROM medicines WHERE category = ? AND id != ? AND stock > 0",
        [medicine.category, id],
        function (err, subs) {
          res.json({ found: true, medicine: medicine, substitutes: subs });
        }
      );
    } else {
      res.json({ found: true, medicine: medicine, substitutes: [] });
    }
  });
});

app.get("/api/categories", function (req, res) {
  db.all("SELECT DISTINCT category FROM medicines", [], function (err, rows) {
    res.json(rows);
  });
});

app.get("/api/generate-qr", function (req, res) {
  // makes a upi payment link and converts it to qr image
  const amount = req.query.amount;
  const orderRef = req.query.orderRef || "ORDER";

  const upiString =
    "upi://pay?pa=" + SHOP_UPI_ID +
    "&pn=" + encodeURIComponent(SHOP_UPI_NAME) +
    "&am=" + amount +
    "&cu=INR" +
    "&tn=" + encodeURIComponent(orderRef);

  QRCode.toDataURL(upiString, function (err, url) {
    if (err) {
      res.json({ success: false });
    } else {
      res.json({ success: true, qrImage: url, upiString: upiString });
    }
  });
});

app.get("/api/user/:id", function (req, res) {
  const id = req.params.id;
  db.get("SELECT id, name, email, address, phone, is_member, member_plan, member_expiry FROM users WHERE id = ?", [id], function (err, row) {
    res.json(row || {});
  });
});

app.post("/api/update-profile", function (req, res) {
  const userId = req.body.userId;
  const address = req.body.address;
  const phone = req.body.phone;

  db.run(
    "UPDATE users SET address = ?, phone = ? WHERE id = ?",
    [address, phone, userId],
    function (err) {
      res.json({ success: true });
    }
  );
});

app.post("/api/order", upload.single("prescription"), function (req, res) {
  const userId = req.body.userId;
  const items = req.body.items;
  const total = req.body.total;
  const address = req.body.address;
  const phone = req.body.phone;
  const deliveryDate = req.body.deliveryDate;
  const paymentMethod = req.body.paymentMethod;
  const paymentStatus = req.body.paymentStatus;
  const insuranceStatus = req.body.insuranceStatus || "";
  const coldChainStatus = req.body.coldChainStatus || "";
  const prescriptionFile = req.file ? req.file.filename : "";
  const orderDate = new Date().toLocaleString();

  db.run(
    "INSERT INTO orders (user_id, items, total, address, phone, delivery_date, prescription_file, payment_method, payment_status, insurance_status, cold_chain_status, status, order_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, items, total, address, phone, deliveryDate, prescriptionFile, paymentMethod, paymentStatus, insuranceStatus, coldChainStatus, "Pending Verification", orderDate],
    function (err) {
      if (err) {
        res.json({ success: false });
      } else {
        db.run("UPDATE users SET address = ?, phone = ? WHERE id = ?", [address, phone, userId]);
        res.json({ success: true, orderId: this.lastID });
      }
    }
  );
});

app.get("/api/orders/:userId", function (req, res) {
  const userId = req.params.userId;
  db.all(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
    [userId],
    function (err, rows) {
      res.json(rows);
    }
  );
});

app.post("/api/reminders", function (req, res) {
  const userId = req.body.userId;
  const medicineName = req.body.medicineName;
  const remindDate = req.body.remindDate;

  db.run(
    "INSERT INTO reminders (user_id, medicine_name, remind_date) VALUES (?, ?, ?)",
    [userId, medicineName, remindDate],
    function (err) {
      res.json({ success: true });
    }
  );
});

app.get("/api/reminders/:userId", function (req, res) {
  const userId = req.params.userId;
  db.all(
    "SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_date ASC",
    [userId],
    function (err, rows) {
      res.json(rows);
    }
  );
});

app.get("/api/admin/orders", function (req, res) {
  db.all("SELECT * FROM orders ORDER BY id DESC", [], function (err, rows) {
    res.json(rows);
  });
});

app.post("/api/admin/orders/:id/status", function (req, res) {
  const id = req.params.id;
  const status = req.body.status;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id], function (err) {
    res.json({ success: true });
  });
});

app.get("/api/admin/medicines", function (req, res) {
  db.all("SELECT * FROM medicines", [], function (err, rows) {
    res.json(rows);
  });
});

app.post("/api/admin/medicines", function (req, res) {
  const name = req.body.name;
  const category = req.body.category;
  const price = req.body.price;
  const stock = req.body.stock;
  const needsPrescription = req.body.needsPrescription ? 1 : 0;
  const coldChain = req.body.coldChain ? 1 : 0;
  const description = req.body.description;
  const imageUrl = req.body.imageUrl || "";

  db.run(
    "INSERT INTO medicines (name, category, price, stock, needs_prescription, description, image_url, cold_chain) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name, category, price, stock, needsPrescription, description, imageUrl, coldChain],
    function (err) {
      res.json({ success: true });
    }
  );
});

app.put("/api/admin/medicines/:id", function (req, res) {
  const id = req.params.id;
  const price = req.body.price;
  const stock = req.body.stock;

  db.run(
    "UPDATE medicines SET price = ?, stock = ? WHERE id = ?",
    [price, stock, id],
    function (err) {
      res.json({ success: true });
    }
  );
});

app.get("/api/admin/analytics", function (req, res) {
  db.get("SELECT COUNT(*) as totalOrders, SUM(total) as totalSales FROM orders", [], function (err, totals) {
    db.all(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status",
      [],
      function (err, statusCounts) {
        db.all(
          "SELECT name, stock FROM medicines WHERE stock < 20",
          [],
          function (err, lowStock) {
            res.json({
              totalOrders: totals.totalOrders || 0,
              totalSales: totals.totalSales || 0,
              statusCounts: statusCounts,
              lowStock: lowStock,
            });
          }
        );
      }
    );
  });
});

app.post("/api/chat", function (req, res) {
  const userId = req.body.userId;
  const sender = req.body.sender;
  const message = req.body.message;
  const sentTime = new Date().toLocaleString();

  db.run(
    "INSERT INTO chat_messages (user_id, sender, message, sent_time) VALUES (?, ?, ?, ?)",
    [userId, sender, message, sentTime],
    function (err) {
      res.json({ success: true });
    }
  );
});

app.get("/api/chat/:userId", function (req, res) {
  const userId = req.params.userId;
  db.all(
    "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id ASC",
    [userId],
    function (err, rows) {
      res.json(rows);
    }
  );
});

app.get("/api/admin/chat-users", function (req, res) {
  db.all(
    "SELECT DISTINCT user_id FROM chat_messages",
    [],
    function (err, rows) {
      res.json(rows);
    }
  );
});

app.get("/api/lab-tests", function (req, res) {
  db.all("SELECT * FROM lab_tests", [], function (err, rows) {
    res.json(rows);
  });
});

app.post("/api/lab-booking", function (req, res) {
  const userId = req.body.userId;
  const testName = req.body.testName;
  const price = req.body.price;
  const address = req.body.address;
  const phone = req.body.phone;
  const bookingDate = req.body.bookingDate;
  const orderDate = new Date().toLocaleString();

  db.run(
    "INSERT INTO lab_bookings (user_id, test_name, price, address, phone, booking_date, status, order_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, testName, price, address, phone, bookingDate, "Booked", orderDate],
    function (err) {
      if (err) {
        res.json({ success: false });
      } else {
        res.json({ success: true, bookingId: this.lastID });
      }
    }
  );
});

app.get("/api/lab-bookings/:userId", function (req, res) {
  const userId = req.params.userId;
  db.all(
    "SELECT * FROM lab_bookings WHERE user_id = ? ORDER BY id DESC",
    [userId],
    function (err, rows) {
      res.json(rows);
    }
  );
});

app.get("/api/admin/lab-bookings", function (req, res) {
  db.all("SELECT * FROM lab_bookings ORDER BY id DESC", [], function (err, rows) {
    res.json(rows);
  });
});

app.post("/api/admin/lab-bookings/:id/status", function (req, res) {
  const id = req.params.id;
  const status = req.body.status;
  db.run("UPDATE lab_bookings SET status = ? WHERE id = ?", [status, id], function (err) {
    res.json({ success: true });
  });
});

// these are the only valid coupon codes for this project, checked on server so people cant cheat from browser
const validCoupons = {
  FIRST10: 10,
  FLAT50: 50,
  HEALTH20: 20,
};

app.post("/api/apply-coupon", function (req, res) {
  const code = (req.body.code || "").toUpperCase();
  const total = Number(req.body.total);

  if (!validCoupons[code]) {
    res.json({ success: false, message: "Invalid coupon code" });
    return;
  }

  let discount = 0;
  if (code === "FLAT50") {
    discount = 50;
  } else {
    discount = Math.round((total * validCoupons[code]) / 100);
  }

  if (discount > total) {
    discount = total;
  }

  res.json({ success: true, discount: discount, finalTotal: total - discount });
});

app.get("/api/doctors", function (req, res) {
  db.all("SELECT * FROM doctors ORDER BY rating DESC", [], function (err, rows) {
    res.json(rows);
  });
});

// first 5 minutes of any chat are free, after that patient is billed per minute
// based on the doctor's rate, which is higher for more experienced/rated doctors
const FREE_CHAT_SECONDS = 5 * 60;

app.post("/api/live-chat/start", function (req, res) {
  const userId = req.body.userId;
  const doctorId = req.body.doctorId;
  const doctorName = req.body.doctorName;
  const patientName = req.body.patientName;
  const perMinRate = req.body.perMinRate;
  const startTime = Date.now();
  const createdAt = new Date().toLocaleString();

  db.run(
    "INSERT INTO live_chat_sessions (user_id, doctor_id, doctor_name, patient_name, per_min_rate, status, paid_minutes, start_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, doctorId, doctorName, patientName, perMinRate, "Waiting", 0, startTime, createdAt],
    function (err) {
      res.json({ success: true, sessionId: this.lastID, startTime: startTime });
    }
  );
});

app.get("/api/live-chat/session/:userId", function (req, res) {
  const userId = req.params.userId;
  db.get(
    "SELECT * FROM live_chat_sessions WHERE user_id = ? AND status != 'Ended' ORDER BY id DESC LIMIT 1",
    [userId],
    function (err, row) {
      res.json(row || null);
    }
  );
});

app.get("/api/live-chat/sessions", function (req, res) {
  db.all(
    "SELECT * FROM live_chat_sessions WHERE status != 'Ended' ORDER BY id DESC",
    [],
    function (err, rows) {
      res.json(rows);
    }
  );
});

app.post("/api/live-chat/join/:sessionId", function (req, res) {
  const sessionId = req.params.sessionId;
  db.run("UPDATE live_chat_sessions SET status = 'Active' WHERE id = ?", [sessionId], function (err) {
    res.json({ success: true });
  });
});

app.post("/api/live-chat/recharge/:sessionId", function (req, res) {
  const sessionId = req.params.sessionId;
  const minutes = req.body.minutes;

  db.run(
    "UPDATE live_chat_sessions SET paid_minutes = paid_minutes + ? WHERE id = ?",
    [minutes, sessionId],
    function (err) {
      res.json({ success: true });
    }
  );
});

app.post("/api/live-chat/end/:sessionId", function (req, res) {
  const sessionId = req.params.sessionId;
  db.run("UPDATE live_chat_sessions SET status = 'Ended' WHERE id = ?", [sessionId], function (err) {
    res.json({ success: true });
  });
});

app.post("/api/live-chat/message", function (req, res) {
  const sessionId = req.body.sessionId;
  const sender = req.body.sender;
  const message = req.body.message;
  const sentTime = new Date().toLocaleString();

  db.get("SELECT * FROM live_chat_sessions WHERE id = ?", [sessionId], function (err, session) {
    if (!session) {
      res.json({ success: false, message: "Chat session not found" });
      return;
    }

    if (sender === "patient") {
      const secondsPassed = (Date.now() - session.start_time) / 1000;
      const allowedSeconds = FREE_CHAT_SECONDS + (session.paid_minutes * 60);

      if (secondsPassed > allowedSeconds) {
        res.json({
          success: false,
          needRecharge: true,
          perMinRate: session.per_min_rate,
          message: "Your free time and recharge minutes are over"
        });
        return;
      }
    }

    db.run(
      "INSERT INTO live_chat_messages (session_id, sender, message, sent_time) VALUES (?, ?, ?, ?)",
      [sessionId, sender, message, sentTime],
      function (err) {
        res.json({ success: true });
      }
    );
  });
});

app.get("/api/live-chat/messages/:sessionId", function (req, res) {
  const sessionId = req.params.sessionId;
  db.all(
    "SELECT * FROM live_chat_messages WHERE session_id = ? ORDER BY id ASC",
    [sessionId],
    function (err, rows) {
      res.json(rows);
    }
  );
});

// membership gives free delivery and a discount on medicine purchases
// three plans, longer plans give more days for a bit less per month
const MEMBERSHIP_PLANS = [
  { id: "monthly", label: "Monthly", price: 79, days: 30 },
  { id: "quarterly", label: "Quarterly", price: 199, days: 90 },
  { id: "annual", label: "Annual", price: 699, days: 365 }
];

const MEMBER_DISCOUNT_PERCENT = 10;
const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_ABOVE = 499;

app.get("/api/membership-info", function (req, res) {
  res.json({
    plans: MEMBERSHIP_PLANS,
    discountPercent: MEMBER_DISCOUNT_PERCENT,
    deliveryCharge: DELIVERY_CHARGE,
    freeDeliveryAbove: FREE_DELIVERY_ABOVE
  });
});

app.post("/api/membership/subscribe", function (req, res) {
  const userId = req.body.userId;
  const planId = req.body.planId;

  let selectedPlan = null;
  for (let i = 0; i < MEMBERSHIP_PLANS.length; i++) {
    if (MEMBERSHIP_PLANS[i].id === planId) {
      selectedPlan = MEMBERSHIP_PLANS[i];
    }
  }

  if (!selectedPlan) {
    res.json({ success: false, message: "Please choose a valid plan" });
    return;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + selectedPlan.days);
  const expiryText = expiryDate.toDateString();

  db.run(
    "UPDATE users SET is_member = 1, member_plan = ?, member_expiry = ? WHERE id = ?",
    [selectedPlan.label, expiryText, userId],
    function (err) {
      res.json({ success: true, expiry: expiryText });
    }
  );
});

app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});

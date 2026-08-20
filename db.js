const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./pharmacy.db");

db.serialize(function () {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, age INTEGER, address TEXT, phone TEXT, is_member INTEGER DEFAULT 0, member_plan TEXT, member_expiry TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS medicines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, price REAL, mrp REAL, stock INTEGER, needs_prescription INTEGER, description TEXT, image_url TEXT, cold_chain INTEGER DEFAULT 0, rating REAL DEFAULT 4.0, rating_count INTEGER DEFAULT 0)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, items TEXT, total REAL, address TEXT, phone TEXT, delivery_date TEXT, prescription_file TEXT, payment_method TEXT, payment_status TEXT, insurance_status TEXT, cold_chain_status TEXT, status TEXT, order_date TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, medicine_name TEXT, remind_date TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, sender TEXT, message TEXT, sent_time TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS lab_tests (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, description TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS lab_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, test_name TEXT, price REAL, address TEXT, phone TEXT, booking_date TEXT, status TEXT, order_date TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, specialty TEXT, experience TEXT, rating REAL, per_min_rate REAL, image_url TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS live_chat_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, doctor_id INTEGER, doctor_name TEXT, patient_name TEXT, per_min_rate REAL, status TEXT, paid_minutes INTEGER DEFAULT 0, start_time INTEGER, created_at TEXT)"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS live_chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER, sender TEXT, message TEXT, sent_time TEXT)"
  );

  db.get("SELECT COUNT(*) as count FROM medicines", function (err, row) {
    if (row && row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO medicines (name, category, price, stock, needs_prescription, description, image_url, cold_chain, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );

      const wiki = "https://commons.wikimedia.org/wiki/Special:FilePath/";

      stmt.run("Paracetamol 500mg", "Pain Relief", 25, 100, 0, "Used for fever and mild pain relief.", wiki + "Pills.JPG", 0, 4.3, 512);
      stmt.run("Crocin Advance", "Pain Relief", 30, 80, 0, "Fast relief from headache and body pain.", wiki + "Crestor%20Tablets%20(rosuvastatin).jpg", 0, 4.1, 340);
      stmt.run("Diclofenac Pain Relief Gel", "Pain Relief", 85, 55, 0, "Topical gel for joint and muscle pain.", wiki + "Ointment%20Jar%20MET%20DP115759.jpg", 0, 4.0, 178);
      stmt.run("Azithromycin 500mg", "Antibiotic", 90, 40, 1, "Antibiotic used for bacterial infections.", wiki + "Antibiotic%20pills.jpg", 0, 4.4, 265);
      stmt.run("Amoxicillin 250mg", "Antibiotic", 60, 50, 1, "Common antibiotic for infections.", wiki + "Capsules1.JPG", 0, 4.2, 198);
      stmt.run("Cetrizine 10mg", "Allergy", 20, 90, 0, "Used to treat allergy and itching.", wiki + "Clonazepam%20Pills.jpg", 0, 4.3, 421);
      stmt.run("Eye Drops (Redness Relief)", "Allergy", 65, 45, 0, "Relieves eye redness, itching and irritation.", wiki + "Visine.JPG", 0, 3.9, 156);
      stmt.run("Metformin 500mg", "Diabetes", 45, 60, 1, "Used to control blood sugar level.", wiki + "C%C3%A1psulas.jpg", 0, 4.5, 302);
      stmt.run("Glimepiride 2mg", "Diabetes", 55, 45, 1, "Used for type 2 diabetes management.", wiki + "Trileptal%20tablets.jpg", 0, 4.2, 143);
      stmt.run("Insulin Injection Pen", "Diabetes", 350, 20, 1, "Pre-filled insulin pen, must be kept refrigerated.", wiki + "Insulin%20analog%20100%20IU-1ml%20pen%20white%20background%20(02).jpg", 1, 4.6, 87);
      stmt.run("Glucometer Kit", "Diabetes", 899, 25, 0, "Device to check blood sugar level at home.", wiki + "Glucometer01.JPG", 0, 4.4, 210);
      stmt.run("Amlodipine 5mg", "Blood Pressure", 40, 70, 1, "Used to control high blood pressure.", wiki + "Diazepam%2010mg.jpg", 0, 4.3, 289);
      stmt.run("Telmisartan 40mg", "Blood Pressure", 65, 55, 1, "Used to treat hypertension.", wiki + "Medication%20blister%20pack%202.jpg", 0, 4.1, 176);
      stmt.run("Blood Pressure Monitor", "Blood Pressure", 1299, 15, 0, "Digital machine to measure blood pressure at home.", wiki + "Omron%20M4-1%20sphygmomanometer.jpg", 0, 4.5, 94);
      stmt.run("Vitamin C Tablets", "Vitamins", 35, 120, 0, "Boosts immunity and skin health.", wiki + "Vitamin%20D%20pills.jpg", 0, 4.4, 620);
      stmt.run("Multivitamin Capsules", "Vitamins", 80, 100, 0, "Daily multivitamin supplement.", wiki + "Assorted%20pharmaceuticals%20by%20LadyofProcrastination.jpg", 0, 4.2, 385);
      stmt.run("Whey Protein Powder", "Vitamins", 1499, 30, 0, "Protein supplement for muscle recovery and daily nutrition.", wiki + "Orgain%20organic%20protein%20powder.jpg", 0, 4.6, 512);
      stmt.run("Calcium and Vitamin D3 Tablets", "Vitamins", 210, 85, 0, "Supports bone health and calcium levels.", wiki + "500%20mg%20calcium%20supplements%20with%20Vitamin%20D.jpg", 0, 4.3, 231);
      stmt.run("Iron and Folic Acid Tablets", "Vitamins", 95, 70, 0, "Helps prevent iron deficiency and anemia.", wiki + "Ativan05mg.jpg", 0, 4.0, 118);
      stmt.run("Chyawanprash 1kg", "Vitamins", 320, 65, 0, "Ayurvedic immunity booster made with amla and herbs.", wiki + "Indian%20Gooseberry.JPG", 0, 4.5, 275);
      stmt.run("Cough Syrup", "Cold and Cough", 50, 65, 0, "Relief from cough and cold symptoms.", wiki + "Sirop%20toux.jpg", 0, 4.1, 302);
      stmt.run("Vicks Vaporub", "Cold and Cough", 45, 75, 0, "Used for cold and blocked nose relief.", wiki + "Vicks%20VapoRub%20(51013600352)%20(cropped).jpg", 0, 4.5, 890);
      stmt.run("Kids Multivitamin Syrup", "Cold and Cough", 120, 40, 0, "Multivitamin syrup for children to support growth and immunity.", wiki + "Bottle%20of%20Liquid%20Children's%20Benadryl.JPG", 0, 4.3, 156);
      stmt.run("Cough Lozenges (Pack of 10)", "Cold and Cough", 30, 110, 0, "Soothing lozenges for sore throat and cough relief.", wiki + "Halls%20cough%20drops.jpg", 0, 4.0, 245);
      stmt.run("ORS Powder", "First Aid", 15, 150, 0, "Oral rehydration salt for dehydration.", wiki + "Oral%20rehydration%20salts%20(ORS)%20-%20Packet.jpg", 0, 4.4, 410);
      stmt.run("Antiseptic Liquid", "First Aid", 55, 60, 0, "Used to clean wounds and cuts.", wiki + "Savlon%20Antiseptic%20Liquid.jpg", 0, 4.3, 320);
      stmt.run("Adhesive Bandage Pack", "First Aid", 40, 80, 0, "Sterile bandage for cuts and wounds.", wiki + "Plasterbandage.JPG", 0, 4.2, 198);
      stmt.run("Digital Thermometer", "First Aid", 199, 50, 0, "Digital thermometer to check body temperature.", wiki + "Digital%20thermometer.jpg", 0, 4.3, 267);
      stmt.run("Disposable Syringe (Pack of 10)", "First Aid", 120, 60, 0, "Sterile syringes for injections at home or clinic.", wiki + "Syringe.jpg", 0, 4.1, 89);
      stmt.run("Pulse Oximeter", "First Aid", 899, 35, 0, "Clips on finger to measure oxygen level and pulse rate.", wiki + "Pulox%20Pulse%20Oximeter.JPG", 0, 4.4, 176);
      stmt.run("Omeprazole 20mg", "Digestive Care", 65, 70, 1, "Reduces stomach acid, used for acidity and ulcers.", wiki + "Aciphex-20b.jpg", 0, 4.2, 234);
      stmt.run("Antacid Tablets", "Digestive Care", 40, 90, 0, "Fast relief from acidity, gas and indigestion.", wiki + "Antacid-L478.jpg", 0, 4.1, 356);
      stmt.run("Hand Sanitizer 500ml", "Personal Care", 150, 100, 0, "Alcohol based hand sanitizer to kill germs.", wiki + "University%20Medical%20Pharmaceuticals%20Hand%20Sanitizer.jpg", 0, 4.2, 445);
      stmt.run("N95 Face Mask (Pack of 5)", "Personal Care", 250, 90, 0, "Protective face mask for daily use.", wiki + "Unfolded%20Face%20Mask.jpg", 0, 4.0, 312);
      stmt.run("Anti-Dandruff Shampoo 200ml", "Personal Care", 195, 80, 0, "Medicated shampoo to control dandruff and scalp itching.", wiki + "Green%20shampoo%20bottle.jpg", 0, 4.1, 289);
      stmt.run("Sensitive Teeth Toothpaste", "Personal Care", 110, 95, 0, "Toothpaste for sensitive teeth and gum care.", wiki + "Toothpaste.jpg", 0, 4.3, 198);
      stmt.run("Sanitary Napkins (Pack of 15)", "Personal Care", 130, 100, 0, "Soft and comfortable sanitary napkins with high absorption.", wiki + "Sanitary%20pad.jpg", 0, 4.4, 267);
      stmt.run("Baby Diaper Pack (M)", "Baby Care", 399, 45, 0, "Soft and absorbent diapers for babies.", wiki + "Disposablediaper.JPG", 0, 4.3, 210);
      stmt.run("Baby Massage Oil 200ml", "Baby Care", 175, 70, 0, "Gentle oil for baby massage, keeps skin soft and healthy.", wiki + "Baby%20oil%20bottle.jpg", 0, 4.2, 134);

      stmt.finalize(function () {
        // this runs only after all the inserts above are done, so every row gets its mrp set
        db.run("UPDATE medicines SET mrp = ROUND(price * (1.25 + (id % 6) * 0.12)) WHERE mrp IS NULL");
      });
    } else {
      db.run("UPDATE medicines SET mrp = ROUND(price * (1.25 + (id % 6) * 0.12)) WHERE mrp IS NULL");
    }
  });

  db.get("SELECT COUNT(*) as count FROM lab_tests", function (err, row) {
    if (row && row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO lab_tests (name, price, description) VALUES (?, ?, ?)"
      );

      stmt.run("Complete Blood Count (CBC)", 299, "Checks red cells, white cells and platelets in blood.");
      stmt.run("Blood Sugar Fasting", 149, "Measures blood glucose level after fasting.");
      stmt.run("Thyroid Profile (T3 T4 TSH)", 499, "Checks thyroid gland function.");
      stmt.run("Lipid Profile", 399, "Measures cholesterol and triglyceride levels.");
      stmt.run("Vitamin D Test", 899, "Checks Vitamin D level in the body.");
      stmt.run("Vitamin B12 Test", 799, "Checks Vitamin B12 level in the body.");
      stmt.run("Liver Function Test (LFT)", 599, "Checks how well the liver is working.");
      stmt.run("Kidney Function Test (KFT)", 599, "Checks how well the kidneys are working.");
      stmt.run("HbA1c (Diabetes 3 Month Average)", 449, "Shows average blood sugar over last 3 months.");
      stmt.run("Full Body Checkup", 1499, "A combo of common tests to check overall health.");

      stmt.finalize();
    }
  });

  db.get("SELECT COUNT(*) as count FROM doctors", function (err, row) {
    if (row && row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO doctors (name, specialty, experience, rating, per_min_rate, image_url) VALUES (?, ?, ?, ?, ?, ?)"
      );

      const wiki = "https://commons.wikimedia.org/wiki/Special:FilePath/";
      const doc = wiki + "Doctors%20stethoscope%201.jpg";

      stmt.run("Dr. Ramesh Sharma", "General Physician", "12 years experience", 4.6, 15, doc);
      stmt.run("Dr. Anjali Verma", "Dermatologist", "8 years experience", 4.3, 15, doc);
      stmt.run("Dr. Vikram Singh", "Cardiologist", "15 years experience", 4.8, 25, doc);
      stmt.run("Dr. Priya Nair", "Pediatrician", "6 years experience", 4.2, 15, doc);
      stmt.run("Dr. Suresh Gupta", "Diabetologist", "14 years experience", 4.7, 20, doc);
      stmt.run("Dr. Neha Kapoor", "Gynecologist", "9 years experience", 4.4, 15, doc);

      stmt.finalize();
    }
  });
});

module.exports = db;

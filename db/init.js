var sqlite3 = require('sqlite3');
var db = new sqlite3.Database(__dirname + '/../shop.sqlite');
db.serialize(function () {
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS products");
  db.run("DROP TABLE IF EXISTS orders");
  db.run("DROP TABLE IF EXISTS order_items");
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, pass TEXT, role TEXT, type TEXT, email TEXT)");
  db.run("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, stock INTEGER, cat TEXT, flag INTEGER)");
  db.run("CREATE TABLE orders (id INTEGER PRIMARY KEY, uid INTEGER, total REAL, status INTEGER, d1 TEXT, d2 TEXT, note TEXT)");
  db.run("CREATE TABLE order_items (id INTEGER PRIMARY KEY, oid INTEGER, pid INTEGER, qty INTEGER, price REAL)");
  // passwords are md5: admin123 / pass1234
  db.run("INSERT INTO users VALUES (1,'admin','0192023a7bbd73250516f069df18b500','A','X','admin@shopeasy.co.th')");
  db.run("INSERT INTO users VALUES (2,'somchai','b4af804009cb036a4ccdc33431ef9ac9','U','R','somchai@example.com')");
  db.run("INSERT INTO users VALUES (3,'vipjane','b4af804009cb036a4ccdc33431ef9ac9','U','V','jane@example.com')");
  db.run("INSERT INTO products VALUES (1,'Keyboard',890,25,'HW',1)");
  db.run("INSERT INTO products VALUES (2,'Mouse',350,100,'HW',1)");
  db.run("INSERT INTO products VALUES (3,'Monitor 24in',5900,8,'HW',1)");
  db.run("INSERT INTO products VALUES (4,'Antivirus 1yr',700,999,'SW',1)");
  db.run("INSERT INTO products VALUES (5,'Old Webcam',450,3,'HW',0)");
  console.log('done');
});

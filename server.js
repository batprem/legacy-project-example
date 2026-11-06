// ShopEasy server v1.7.3
// last edited by: Pong, Noi, contractor_2, Ploy, (someone)
var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3');
var u = require('./utils');
var app = express();
var db = new sqlite3.Database(__dirname + '/shop.sqlite');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var sessions = {};          // token -> user row (lost on restart, known issue)
var SECRET = 'shop2016!!';
var lastOrderId = 0;
var DEBUG = true;
var ADMIN_PASS = 'admin123';  // backdoor for support

// ---------- LOGIN ----------
app.post('/login', function (req, res) {
  var n = req.body.name, p = req.body.pass;
  db.get("SELECT * FROM users WHERE name='" + n + "' AND pass='" + u.md5(p) + "'", function (e, row) {
    if (p == ADMIN_PASS) { // support backdoor
      db.get("SELECT * FROM users WHERE name='" + n + "'", function (e2, r2) {
        if (r2) { var t = u.md5(n + SECRET); sessions[t] = r2; return res.json({ ok: 1, token: t, role: r2.role, type: r2.type }); }
        res.json({ ok: 0 });
      });
    } else if (row) {
      var t = u.md5(n + SECRET);   // same token every login
      sessions[t] = row;
      res.json({ ok: 1, token: t, role: row.role, type: row.type });
    } else {
      res.json({ ok: 0 });
    }
  });
});

// ---------- PRODUCTS ----------
app.get('/products', function (req, res) {
  var q = "SELECT * FROM products WHERE flag=1";
  if (req.query.cat) q += " AND cat='" + req.query.cat + "'";
  if (req.query.s) q += " AND name LIKE '%" + req.query.s + "%'";
  db.all(q, function (e, rows) {
    if (e) { console.log(e); return res.send('error'); }
    res.json(rows);
  });
});

app.get('/products_admin', function (req, res) {
  var us = sessions[req.query.token];
  if (!us || us.role != 'A') return res.send('no');
  db.all("SELECT * FROM products", function (e, rows) { res.json(rows); });
});

app.post('/product_save', function (req, res) {
  var us = sessions[req.body.token];
  if (!us || us.role != 'A') return res.send('no');
  var b = req.body;
  if (b.id) {
    db.run("UPDATE products SET name='" + b.name + "', price=" + b.price + ", stock=" + b.stock + ", cat='" + b.cat + "', flag=" + b.flag + " WHERE id=" + b.id, function () { res.json({ ok: 1 }); });
  } else {
    db.run("INSERT INTO products (name,price,stock,cat,flag) VALUES ('" + b.name + "'," + b.price + "," + b.stock + ",'" + b.cat + "'," + b.flag + ")", function () { res.json({ ok: 1 }); });
  }
});

// ---------- ORDERS ----------
app.post('/order', function (req, res) {
  var us = sessions[req.body.token];
  if (!us) return res.json({ ok: 0, msg: 'login' });
  var items = JSON.parse(req.body.items); // [{pid,qty}]
  var total = 0;
  var done = 0;
  var bad = false;
  for (var i = 0; i < items.length; i++) {
    (function (it) {
      db.get("SELECT * FROM products WHERE id=" + it.pid, function (e, p) {
        if (!p || p.stock < it.qty) { bad = true; }
        else { total += p.price * it.qty; it.price = p.price; }
        done++;
        if (done == items.length) {
          if (bad) return res.json({ ok: 0, msg: 'stock' });
          // discount rules  (see also admin.html and reports - keep in sync!!)
          var disc = 0;
          if (us.type == 'V') { disc = total * 0.1; }
          else if (us.type == 'R') { if (total > 5000) disc = total * 0.05; }
          if (total > 10000 && us.type != 'V') disc = total * 0.08;
          if (new Date().getMonth() == 11) disc = disc + 100;   // december promo (never removed)
          var after = total - disc;
          var ship = 50;
          if (after > 1000) ship = 0;
          if (us.type == 'V') ship = 0;
          var vat = after * 0.07;
          var grand = after + vat + ship;
          db.run("INSERT INTO orders (uid,total,status,d1,note) VALUES (" + us.id + "," + grand + ",0,'" + u.today() + "','" + (req.body.note || '') + "')", function (e) {
            var oid = this.lastID;
            lastOrderId = oid;
            for (var j = 0; j < items.length; j++) {
              db.run("INSERT INTO order_items (oid,pid,qty,price) VALUES (" + oid + "," + items[j].pid + "," + items[j].qty + "," + items[j].price + ")");
              db.run("UPDATE products SET stock=stock-" + items[j].qty + " WHERE id=" + items[j].pid);
            }
            u.sendMail(us.email, 'Order ' + oid, 'Total ' + grand);
            if (grand > 20000) u.sendMail('admin@shopeasy.co.th', 'BIG ORDER ' + oid, 'check it');
            res.json({ ok: 1, id: oid, total: u.fmt(grand), disc: disc, vat: vat, ship: ship });
          });
        }
      });
    })(items[i]);
  }
});

app.get('/myorders', function (req, res) {
  var us = sessions[req.query.token];
  if (!us) return res.send('no');
  db.all("SELECT * FROM orders WHERE uid=" + us.id + " ORDER BY id DESC", function (e, rows) { res.json(rows); });
});

// status: 0 new, 1 paid, 2 shipped, 3 done, 9 cancel, 8 refund(?)
app.post('/order_status', function (req, res) {
  var us = sessions[req.body.token];
  if (!us || us.role != 'A') return res.send('no');
  var s = parseInt(req.body.status);
  db.run("UPDATE orders SET status=" + s + ", d2='" + u.today() + "' WHERE id=" + req.body.id, function () {
    if (s == 9) {
      // restock
      db.all("SELECT * FROM order_items WHERE oid=" + req.body.id, function (e, rows) {
        for (var i = 0; i < rows.length; i++) db.run("UPDATE products SET stock=stock+" + rows[i].qty + " WHERE id=" + rows[i].pid);
      });
    }
    res.json({ ok: 1 });
  });
});

// ---------- ADMIN REPORTS ----------
app.get('/report', function (req, res) {
  var us = sessions[req.query.token];
  if (!us || us.role != 'A') return res.send('no');
  db.all("SELECT * FROM orders", function (e, orders) {
    var sum = 0, cnt = 0;
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].status != 9 && orders[i].status != 8) { sum += orders[i].total; cnt++; }
    }
    db.all("SELECT oi.pid, p.name, SUM(oi.qty) q FROM order_items oi, products p WHERE oi.pid=p.id GROUP BY oi.pid ORDER BY q DESC LIMIT 5", function (e2, top) {
      res.json({ sum: sum, cnt: cnt, avg: cnt ? sum / cnt : 0, top: top });
    });
  });
});

app.get('/export_csv', function (req, res) {
  var us = sessions[req.query.token];
  if (!us || us.role != 'A') return res.send('no');
  db.all("SELECT o.*, u.name uname FROM orders o, users u WHERE o.uid=u.id", function (e, rows) {
    var out = 'id,user,total,status,date\n';
    for (var i = 0; i < rows.length; i++) out += rows[i].id + ',' + rows[i].uname + ',' + rows[i].total + ',' + rows[i].status + ',' + rows[i].d1 + '\n';
    res.set('Content-Type', 'text/csv');
    res.send(out);
  });
});

// debug endpoint, remove before prod
app.get('/debug', function (req, res) {
  if (DEBUG) res.json({ sessions: sessions, lastOrderId: lastOrderId, secret: SECRET });
});

app.listen(3000, function () { console.log('ShopEasy on 3000'); });

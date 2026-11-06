var tk = '', ut = '', cart = [], PRODS = [];
function doLogin() {
  $.post('/login', { name: $('#n').val(), pass: $('#p').val() }, function (r) {
    if (r.ok) { tk = r.token; ut = r.type; localStorage.tk = tk; $('#login').hide(); $('#app').show(); $('#who').html($('#n').val()); loadP(); loadO(); }
    else alert('wrong');
  });
}
function loadP() {
  $.get('/products?cat=' + $('#cat').val() + '&s=' + $('#search').val(), function (r) {
    PRODS = r; var h = '';
    for (var i = 0; i < r.length; i++) h += '<tr><td>' + r[i].name + '</td><td>' + r[i].price + '</td><td>' + r[i].stock + '</td><td><button onclick="add(' + r[i].id + ')">+</button></td></tr>';
    $('#plist').html(h);
  });
}
function add(id) {
  for (var i = 0; i < cart.length; i++) if (cart[i].pid == id) { cart[i].qty++; return show(); }
  cart.push({ pid: id, qty: 1 }); show();
}
function show() {
  var h = '', t = 0;
  for (var i = 0; i < cart.length; i++) {
    for (var j = 0; j < PRODS.length; j++) if (PRODS[j].id == cart[i].pid) { h += '<tr><td>' + PRODS[j].name + '</td><td>' + cart[i].qty + '</td></tr>'; t += PRODS[j].price * cart[i].qty; }
  }
  // discount calc COPY of server logic (needs to match!)
  var d = 0;
  if (ut == 'V') d = t * 0.1; else if (ut == 'R' && t > 5000) d = t * 0.05;
  if (t > 10000 && ut != 'V') d = t * 0.08;
  $('#cartt').html(h); $('#sum').html('total ' + t + ' discount ' + d + ' (est.)');
}
function checkout() {
  $.post('/order', { token: tk, items: JSON.stringify(cart), note: $('#note').val() }, function (r) {
    if (r.ok) { alert('Order ' + r.id + ' total ' + r.total); cart = []; show(); loadP(); loadO(); } else alert(r.msg);
  });
}
function loadO() {
  $.get('/myorders?token=' + tk, function (r) {
    var h = '', st = ['new', 'paid', 'shipped', 'done'];
    for (var i = 0; i < r.length; i++) h += '<tr><td>' + r[i].id + '</td><td>' + r[i].total + '</td><td>' + (st[r[i].status] || 'cancel') + '</td><td>' + r[i].note + '</td></tr>';
    $('#ol').html(h);
  });
}

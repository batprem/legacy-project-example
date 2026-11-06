// main app. sorry this got big - Noi
import React, { useState, useEffect } from 'react'
import $ from 'jquery'
import Admin from './Admin'
import { money, calc, dt } from './helpers'
// import ProductCard from './components/ProductCard'
import './App.css'

window.TOKEN = localStorage.tk || ''
window.USER = null
try { window.USER = JSON.parse(localStorage.usr) } catch (e) {}

// product pictures, keyed by db id. new products get the box. ask design for more
const ART = {
  1: { bg: '#e4dcc8', svg: <g><rect x="14" y="38" width="92" height="44" rx="7" fill="#1c2a24" /><g fill="#f6f1e7">{[0, 1, 2, 3, 4, 5, 6].map(i => <rect key={i} x={22 + i * 11} y="46" width="8" height="7" rx="1.5" />)}{[0, 1, 2, 3, 4, 5, 6].map(i => <rect key={'b' + i} x={22 + i * 11} y="57" width="8" height="7" rx="1.5" />)}<rect x="36" y="68" width="48" height="7" rx="1.5" /></g></g> },
  2: { bg: '#cfdccf', svg: <g><rect x="40" y="20" width="40" height="72" rx="20" fill="#1f4d3a" /><line x1="60" y1="20" x2="60" y2="48" stroke="#cfdccf" strokeWidth="2.5" /><rect x="57" y="30" width="6" height="12" rx="3" fill="#d9542b" /></g> },
  3: { bg: '#f0d5c5', svg: <g><rect x="16" y="22" width="88" height="56" rx="5" fill="#1c2a24" /><rect x="22" y="28" width="76" height="44" rx="2" fill="#f6f1e7" /><path d="M22 62 L48 44 L64 56 L78 46 L98 62 L98 72 L22 72Z" fill="#d9542b" /><rect x="54" y="78" width="12" height="12" fill="#1c2a24" /><rect x="40" y="90" width="40" height="5" rx="2.5" fill="#1c2a24" /></g> },
  4: { bg: '#d6dfe4', svg: <g><path d="M60 16 L94 28 V56 C94 76 78 90 60 98 C42 90 26 76 26 56 V28 Z" fill="#1f4d3a" /><path d="M45 56 L56 67 L77 43" fill="none" stroke="#f6f1e7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></g> },
  5: { bg: '#e9e3d6', svg: <g><circle cx="60" cy="50" r="30" fill="#1c2a24" /><circle cx="60" cy="50" r="15" fill="#f6f1e7" /><circle cx="60" cy="50" r="7" fill="#d9542b" /><path d="M42 92 H78 L70 78 H50 Z" fill="#1c2a24" /></g> },
}
const BOX = { bg: '#e6e0d2', svg: <g><path d="M60 18 L98 38 V80 L60 100 L22 80 V38 Z" fill="#1c2a24" /><path d="M22 38 L60 58 L98 38 M60 58 V100" stroke="#f6f1e7" strokeWidth="2.5" fill="none" /></g> }

function Login(props) {
  var [n, setN] = useState(''), [p, setP] = useState(''), [err, setErr] = useState(false), [busy, setBusy] = useState(false)
  function go(e, nn, pp) {
    if (e) e.preventDefault()
    setBusy(true)
    $.post('/login', { name: nn || n, pass: pp || p }, function (r) {
      setBusy(false)
      if (r.ok == 1) {
        localStorage.tk = r.token
        window.TOKEN = r.token
        var u = { name: nn || n, role: r.role, type: r.type }
        localStorage.usr = JSON.stringify(u)
        window.USER = u
        props.done(u)
      } else { setErr(true) }
    })
  }
  return (
    <div className="lg-wrap">
      <div className="lg-left">
        <div className="brand" style={{ color: '#f6f1e7', fontSize: 26 }}>ShopEasy<span style={{ color: '#ef7a50' }}>.</span></div>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 'clamp(38px,5vw,62px)', lineHeight: 1.05, margin: '0 0 18px', color: '#f6f1e7', letterSpacing: '-0.02em' }}>Good gear,<br />ordered without<br />the fuss.</h1>
          <p style={{ color: '#b9c8bf', fontSize: 16, maxWidth: 380, lineHeight: 1.6, margin: 0 }}>Everything your office needs, from keyboards to antivirus, delivered across Thailand.</p>
        </div>
        <div style={{ color: '#8ba295', fontSize: 13 }}>© 2019 ShopEasy Co., Ltd.</div>
      </div>
      <div className="lg-right">
        <form onSubmit={go} style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#1c2a24' }}>Welcome back</h2>
          <p style={{ color: '#6b7a71', margin: '0 0 28px', fontSize: 15 }}>Sign in to your account to continue.</p>
          <label className="fld">Username<input autoFocus value={n} onChange={e => { setN(e.target.value); setErr(false) }} /></label>
          <label className="fld">Password<input type="password" value={p} onChange={e => { setP(e.target.value); setErr(false) }} /></label>
          {err ? <div style={{ background: '#fbe6de', color: '#a83a17', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 14 }}>That username and password don't match.</div> : null}
          <button className="btn-main" disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
          {/* TEST ACCOUNTS - remove before go live!! */}
          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid #e5decf' }}>
            <div style={{ fontSize: 12, color: '#8a8f85', marginBottom: 8 }}>Quick sign-in</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="chip" onClick={() => go(null, 'somchai', 'pass1234')}>somchai</button>
              <button type="button" className="chip" onClick={() => go(null, 'vipjane', 'pass1234')}>vipjane</button>
              <button type="button" className="chip" onClick={() => go(null, 'admin', 'admin123')}>admin</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  var [user, setUser] = useState(window.USER)
  var [page, setPage] = useState(localStorage.pg || 'shop')
  var [prods, setProds] = useState([])
  var [cart, setCart] = useState([])
  var [s, setS] = useState('')
  var [cat, setCat] = useState('')
  var [orders, setOrders] = useState([])
  var [note, setNote] = useState('')
  var [done, setDone] = useState(null)
  var [toast, setToast] = useState('')
  var [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch('/products?cat=' + cat + '&s=' + s).then(r => r.json()).then(r => { setProds(r); setLoading(false) })
  }, [s, cat, user])

  function loadOrders() {
    $.get('/myorders?token=' + window.TOKEN, function (r) {
      if (r == 'no') return // session gone? ignore for now
      setOrders(r)
    })
  }
  useEffect(() => { if (user) loadOrders() }, [user])

  function say(t) { setToast(t); setTimeout(() => setToast(''), 2600) }

  function add(id) {
    for (var i = 0; i < cart.length; i++) { if (cart[i].pid == id) { cart[i].qty++; setCart(cart.slice()); return } }
    cart.push({ pid: id, qty: 1 })
    setCart(cart.slice())
  }
  function dec(id) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].pid == id) {
        cart[i].qty--
        if (cart[i].qty == 0) cart.splice(i, 1)
        setCart(cart.slice())
        return
      }
    }
  }

  function checkout() {
    $.post('/order', { token: window.TOKEN, items: JSON.stringify(cart), note: note }, function (r) {
      if (r.ok == 1) {
        setDone(r); setCart([]); setNote('')
        setTimeout(() => { fetch('/products?cat=' + cat + '&s=' + s).then(x => x.json()).then(setProds); loadOrders() }, 300) // wait for db
      } else if (r.msg == 'stock') { say('Sorry, one of those items just ran out of stock.') }
      else { say('Something went wrong (' + r.msg + ')') }
    })
  }

  function logout() { localStorage.removeItem('tk'); localStorage.removeItem('usr'); localStorage.removeItem('pg'); window.location.reload() }
  function nav(p) { localStorage.pg = p; setPage(p); window.scrollTo(0, 0) }

  if (!user) return <Login done={u => { setUser(u); nav(u.role == 'A' ? 'admin' : 'shop') }} />

  // work out cart. uses prods because that's what we have
  var lines = [], t = 0, cnt = 0
  for (var i = 0; i < cart.length; i++) {
    for (var j = 0; j < prods.length; j++) {
      if (prods[j].id == cart[i].pid) {
        lines.push({ p: prods[j], qty: cart[i].qty })
        t += prods[j].price * cart[i].qty
        cnt += cart[i].qty
      }
    }
  }
  var c = calc(t, user.type)
  var st = ['Processing', 'Paid', 'Shipped', 'Delivered']
  var stc = ['#b7791f', '#2c6e8f', '#5b5fa8', '#1f4d3a']
  var stb = ['#faefd6', '#dcecf3', '#e6e6f5', '#d9e8df']

  return (
    <div>
      <div className="top">
        <div className="top-in">
          <div className="brand" onClick={() => nav('shop')} style={{ cursor: 'pointer' }}>ShopEasy<span style={{ color: '#d9542b' }}>.</span></div>
          <div className="nav">
            <a className={page == 'shop' ? 'on' : ''} onClick={() => nav('shop')}>Shop</a>
            <a className={page == 'orders' ? 'on' : ''} onClick={() => nav('orders')}>My orders</a>
            {user.role == 'A' ? <a className={page == 'admin' ? 'on' : ''} onClick={() => nav('admin')}>Admin</a> : null}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.type == 'V' ? <span style={{ background: '#1c2a24', color: '#f2c879', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', padding: '4px 9px', borderRadius: 99 }}>VIP</span> : null}
            <div className="ava">{user.name.charAt(0).toUpperCase()}</div>
            <span className="uname">{user.name}</span>
            <a className="out" onClick={logout}>Sign out</a>
          </div>
        </div>
      </div>

      {page == 'admin' && user.role == 'A' ? <Admin say={say} /> : null}

      {page == 'orders' ?
        <div className="page" style={{ maxWidth: 900 }}>
          <h1 className="h1">My orders</h1>
          <p className="sub">{orders.length} order{orders.length == 1 ? '' : 's'} on your account</p>
          {orders.length == 0 ? <div className="empty" style={{ marginTop: 30 }}>You haven't ordered anything yet.<br /><a onClick={() => nav('shop')} style={{ color: '#d9542b', cursor: 'pointer', fontWeight: 600 }}>Browse the shop →</a></div> : null}
          <div style={{ marginTop: 24 }}>
            {orders.map((o, idx) => (
              <div key={idx} className="orow">
                <div style={{ minWidth: 80 }}><div style={{ fontSize: 12, color: '#8a8f85' }}>Order</div><div style={{ fontWeight: 600 }}>#{o.id}</div></div>
                <div style={{ minWidth: 110 }}><div style={{ fontSize: 12, color: '#8a8f85' }}>Placed</div><div>{dt(o.d1)}</div></div>
                {/* notes can have <b> from support */}
                <div style={{ flex: 1, color: '#6b7a71', fontSize: 14, minWidth: 120 }} dangerouslySetInnerHTML={{ __html: o.note || '' }}></div>
                <span style={{ background: stb[o.status] || '#f3dcd3', color: stc[o.status] || '#a83a17', padding: '5px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>{st[o.status] || 'Cancelled'}</span>
                <div style={{ fontWeight: 700, minWidth: 110, textAlign: 'right' }}>{money(o.total)}</div>
              </div>
            ))}
          </div>
        </div> : null}

      {page == 'shop' || (page == 'admin' && user.role != 'A') ?
        <div className="page">
          <div className="hero">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.1em', color: '#ef9a78', textTransform: 'uppercase', marginBottom: 10 }}>{new Date().getMonth() == 11 ? 'December deal: ฿100 off every order' : 'Free delivery over ฿1,000'}</div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 'clamp(30px,4vw,46px)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.015em', color: '#f6f1e7' }}>Hello {user.name}, what does the office need today?</h1>
            </div>
          </div>
          <div className="tools">
            <div className="pills">
              {[['', 'Everything'], ['HW', 'Hardware'], ['SW', 'Software']].map(x => <button key={x[0]} className={cat == x[0] ? 'pill act' : 'pill'} onClick={() => setCat(x[0])}>{x[1]}</button>)}
            </div>
            <input className="srch" placeholder="Search products" value={s} onChange={e => setS(e.target.value)} />
          </div>
          <div className="cols">
            <div className="grid">
              {prods.map((p, idx) => {
                var a = ART[p.id] || BOX
                return (
                  <div className="card" key={idx}>
                    <div style={{ background: a.bg, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <svg viewBox="0 0 120 110" width="130" height="120">{a.svg}</svg>
                      {p.stock < 10 ? <span style={{ position: 'absolute', top: 12, left: 12, background: '#d9542b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 99 }}>Only {p.stock} left</span> : null}
                    </div>
                    <div style={{ padding: '16px 18px 18px' }}>
                      <div style={{ fontSize: 11, color: '#8a8f85', fontWeight: 600, letterSpacing: '.08em' }}>{p.cat == 'HW' ? 'HARDWARE' : p.cat == 'SW' ? 'SOFTWARE' : p.cat}</div>
                      <div style={{ fontWeight: 600, fontSize: 17, margin: '4px 0 14px', color: '#1c2a24' }} dangerouslySetInnerHTML={{ __html: p.name }}></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 21, color: '#1c2a24' }}>{money(p.price)}</div>
                        <button className="add" onClick={() => add(p.id)} aria-label={'Add ' + p.name}>Add</button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {!loading && prods.length == 0 ? <div className="empty" style={{ gridColumn: '1/-1' }}>Nothing matches that search.</div> : null}
            </div>
            <div className="cart">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 23, margin: 0 }}>Your cart</h3>
                <span style={{ color: '#8a8f85', fontSize: 14 }}>{cnt} item{cnt == 1 ? '' : 's'}</span>
              </div>
              {lines.length == 0 ? <div style={{ color: '#8a8f85', padding: '26px 0', fontSize: 15 }}>Your cart is empty. Add something from the shelf.</div> : null}
              <div style={{ marginTop: 14 }}>
                {lines.map((l, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eee7d9' }}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{l.p.name}</div><div style={{ color: '#8a8f85', fontSize: 13 }}>{money(l.p.price)}</div></div>
                    <div className="qty"><button onClick={() => dec(l.p.id)} aria-label="Remove one">−</button><span>{l.qty}</span><button onClick={() => add(l.p.id)} aria-label="Add one">+</button></div>
                  </div>
                ))}
              </div>
              {lines.length > 0 ?
                <div>
                  <div className="ln"><span>Subtotal</span><span>{money(t)}</span></div>
                  {c.d > 0 ? <div className="ln" style={{ color: '#1f4d3a', fontWeight: 600 }}><span>{user.type == 'V' ? 'VIP discount' : 'Discount'}</span><span>−{money(c.d)}</span></div> : null}
                  <div className="ln"><span>VAT 7%</span><span>{money(c.vat)}</span></div>
                  <div className="ln"><span>Delivery</span><span>{c.ship == 0 ? 'Free' : money(c.ship)}</span></div>
                  <div className="ln" style={{ fontWeight: 700, fontSize: 19, color: '#1c2a24', paddingTop: 12, marginTop: 6, borderTop: '1px solid #e5decf' }}><span>Total</span><span>{money(c.grand)}</span></div>
                  <textarea className="nt" rows="2" placeholder="Add a note for the warehouse" value={note} onChange={e => setNote(e.target.value)} />
                  <button className="btn-main" style={{ width: '100%' }} onClick={checkout}>Place order</button>
                </div> : null}
            </div>
          </div>
        </div> : null}

      {done ?
        <div className="ov" onClick={() => setDone(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: 54, height: 54, borderRadius: 99, background: '#d9e8df', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1f4d3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 28, margin: '0 0 6px' }}>Order #{done.id} placed</h2>
            <p style={{ color: '#6b7a71', margin: '0 0 18px' }}>We've emailed your confirmation.</p>
            <div className="ln"><span>Discount</span><span>−{money(done.disc)}</span></div>
            <div className="ln"><span>VAT</span><span>{money(done.vat)}</span></div>
            <div className="ln"><span>Delivery</span><span>{done.ship == 0 ? 'Free' : money(done.ship)}</span></div>
            <div className="ln" style={{ fontWeight: 700, fontSize: 19, color: '#1c2a24', borderTop: '1px solid #e5decf', marginTop: 6, paddingTop: 12 }}><span>Total charged</span><span>{money(done.total)}</span></div>
            <button className="btn-main" style={{ width: '100%', marginTop: 18 }} onClick={() => { setDone(null); nav('orders') }}>View my orders</button>
          </div>
        </div> : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}

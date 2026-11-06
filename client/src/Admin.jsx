// admin page. class because it was written before hooks and nobody wants to touch it
import React from 'react'
import $ from 'jquery'
import { money, dt, parseCsv } from './helpers'

var ST = { 0: 'New', 1: 'Paid', 2: 'Shipped', 3: 'Done', 8: 'Refund', 9: 'Cancelled' }

export default class Admin extends React.Component {
  constructor(p) {
    super(p)
    this.state = { rep: null, prods: [], orders: [], tab: 0, edit: null, nw: { name: '', price: '', stock: '', cat: 'HW' } }
  }
  componentDidMount() { this.load() }
  load() {
    var me = this
    $.get('/report?token=' + window.TOKEN, function (r) { me.state.rep = r; me.forceUpdate() })
    $.get('/products_admin?token=' + window.TOKEN, function (r) { me.state.prods = r; me.forceUpdate() })
    $.get('/export_csv?token=' + window.TOKEN, function (r) { me.state.orders = parseCsv(r).reverse(); me.forceUpdate() })
  }
  toggle(p) {
    var me = this
    p.flag = p.flag ? 0 : 1
    this.forceUpdate()
    $.post('/product_save', { token: window.TOKEN, id: p.id, name: p.name, price: p.price, stock: p.stock, cat: p.cat, flag: p.flag }, function () { me.props.say(p.name + (p.flag ? ' is now visible' : ' is now hidden')) })
  }
  saveEdit(p) {
    var me = this
    $.post('/product_save', { token: window.TOKEN, id: p.id, name: p.name, price: p.price, stock: p.stock, cat: p.cat, flag: p.flag }, function () { me.state.edit = null; me.props.say('Saved'); me.load() })
  }
  addNew() {
    var me = this, n = this.state.nw
    if (!n.name) return this.props.say('Give the product a name first')
    $.post('/product_save', { token: window.TOKEN, name: n.name, price: n.price, stock: n.stock, cat: n.cat, flag: 1 }, function () {
      me.state.nw = { name: '', price: '', stock: '', cat: 'HW' }
      me.props.say('Product added'); me.load()
    })
  }
  status(o, v) {
    var me = this
    if (v == 9 && !window.confirm('Cancel order #' + o.id + '? Stock will go back on the shelf.')) return
    $.post('/order_status', { token: window.TOKEN, id: o.id, status: v }, function () { me.props.say('Order #' + o.id + ' updated'); setTimeout(() => me.load(), 200) })
  }
  render() {
    var r = this.state.rep, net = r ? r.sum / 1.07 : 0, mx = 1, me = this
    if (r && r.top) for (var i = 0; i < r.top.length; i++) if (r.top[i].q > mx) mx = r.top[i].q
    var low = 0
    this.state.prods.forEach(p => { if (p.stock < 10 && p.flag == 1) low++ })
    return (
      <div className="page">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14 }}>
          <div><h1 className="h1">Back office</h1><p className="sub">Sales, stock and orders at a glance.</p></div>
          <a className="btn-sec" href={'/export_csv?token=' + window.TOKEN}>Export CSV</a>
        </div>
        <div className="kpis">
          <div className="kpi" style={{ background: '#1f4d3a', borderColor: '#1f4d3a' }}><div className="kl" style={{ color: '#b9c8bf' }}>Revenue</div><div className="kv" style={{ color: '#f6f1e7' }}>{r ? money(r.sum) : '…'}</div><div style={{ color: '#b9c8bf', fontSize: 13 }}>{money(net)} net of VAT</div></div>
          <div className="kpi"><div className="kl">Orders</div><div className="kv">{r ? r.cnt : '…'}</div><div style={{ color: '#8a8f85', fontSize: 13 }}>excl. cancelled</div></div>
          <div className="kpi"><div className="kl">Average order</div><div className="kv">{r ? money(r.avg) : '…'}</div><div style={{ color: '#8a8f85', fontSize: 13 }}>per order</div></div>
          <div className="kpi"><div className="kl">Low stock</div><div className="kv" style={{ color: low > 0 ? '#d9542b' : '#1c2a24' }}>{low}</div><div style={{ color: '#8a8f85', fontSize: 13 }}>under 10 units</div></div>
        </div>
        <div className="pills" style={{ margin: '30px 0 18px' }}>
          {['Orders', 'Products', 'Top sellers'].map((x, i) => <button key={i} className={this.state.tab == i ? 'pill act' : 'pill'} onClick={() => this.setState({ tab: i })}>{x}</button>)}
        </div>

        {this.state.tab == 0 ?
          <div className="tw"><table className="tb"><thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th style={{ textAlign: 'right' }}>Total</th><th>Status</th></tr></thead><tbody>
            {this.state.orders.map((o, i) => <tr key={i}><td style={{ fontWeight: 600 }}>#{o.id}</td><td>{o.user}</td><td>{dt(o.date)}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{money(o.total)}</td>
              <td><select className="sel" value={o.status} onChange={e => me.status(o, e.target.value)}>{Object.keys(ST).map(k => <option key={k} value={k}>{ST[k]}</option>)}</select></td></tr>)}
            {this.state.orders.length == 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8a8f85', padding: 40 }}>No orders yet.</td></tr> : null}
          </tbody></table></div> : null}

        {this.state.tab == 1 ?
          <div className="tw"><table className="tb"><thead><tr><th>Product</th><th>Category</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Stock</th><th>Visible</th><th></th></tr></thead><tbody>
            {this.state.prods.map((p, i) => this.state.edit == p.id ?
              <tr key={i}><td><input className="ti" value={p.name} onChange={e => { p.name = e.target.value; me.forceUpdate() }} /></td><td>{p.cat}</td>
                <td style={{ textAlign: 'right' }}><input className="ti" style={{ width: 90, textAlign: 'right' }} value={p.price} onChange={e => { p.price = e.target.value; me.forceUpdate() }} /></td>
                <td style={{ textAlign: 'right' }}><input className="ti" style={{ width: 70, textAlign: 'right' }} value={p.stock} onChange={e => { p.stock = e.target.value; me.forceUpdate() }} /></td>
                <td></td><td style={{ textAlign: 'right' }}><a className="lnk" onClick={() => me.saveEdit(p)}>Save</a></td></tr> :
              <tr key={i} style={{ opacity: p.flag ? 1 : .55 }}><td style={{ fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: p.name }}></td><td>{p.cat}</td><td style={{ textAlign: 'right' }}>{money(p.price)}</td>
                <td style={{ textAlign: 'right', color: p.stock < 10 ? '#d9542b' : 'inherit', fontWeight: p.stock < 10 ? 700 : 400 }}>{p.stock}</td>
                <td><button className={p.flag ? 'sw on' : 'sw'} onClick={() => me.toggle(p)} aria-label={'Toggle ' + p.name}><i></i></button></td>
                <td style={{ textAlign: 'right' }}><a className="lnk" onClick={() => me.setState({ edit: p.id })}>Edit</a></td></tr>)}
            <tr style={{ background: '#fbf8f1' }}><td><input className="ti" placeholder="New product name" value={this.state.nw.name} onChange={e => { me.state.nw.name = e.target.value; me.forceUpdate() }} /></td>
              <td><select className="sel" value={this.state.nw.cat} onChange={e => { me.state.nw.cat = e.target.value; me.forceUpdate() }}><option>HW</option><option>SW</option></select></td>
              <td style={{ textAlign: 'right' }}><input className="ti" style={{ width: 90, textAlign: 'right' }} placeholder="Price" value={this.state.nw.price} onChange={e => { me.state.nw.price = e.target.value; me.forceUpdate() }} /></td>
              <td style={{ textAlign: 'right' }}><input className="ti" style={{ width: 70, textAlign: 'right' }} placeholder="Stock" value={this.state.nw.stock} onChange={e => { me.state.nw.stock = e.target.value; me.forceUpdate() }} /></td>
              <td></td><td style={{ textAlign: 'right' }}><a className="lnk" onClick={() => me.addNew()}>Add</a></td></tr>
          </tbody></table></div> : null}

        {this.state.tab == 2 ?
          <div className="tw" style={{ padding: 24 }}>
            {r && r.top.length ? r.top.map((x, i) => <div key={i} style={{ marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{x.name}</span><span style={{ color: '#6b7a71' }}>{x.q} sold</span></div><div style={{ background: '#eee7d9', height: 10, borderRadius: 99 }}><div style={{ width: (x.q / mx * 100) + '%', background: i == 0 ? '#d9542b' : '#1f4d3a', height: 10, borderRadius: 99 }}></div></div></div>) : <div style={{ color: '#8a8f85', textAlign: 'center', padding: 24 }}>No sales yet.</div>}
          </div> : null}
      </div>
    )
  }
}

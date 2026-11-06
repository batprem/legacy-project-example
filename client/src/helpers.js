// helpers. some of these are used. Ploy 2021
import moment from 'moment'

export function money(n) { return '฿' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
export function money2(n) { return '฿' + Math.round(n) } // old one, Admin still uses it somewhere?

// SAME AS SERVER!! if you change here change server.js too (and Admin.jsx)
export function calc(t, ut) {
  var d = 0
  if (ut == 'V') d = t * 0.1
  else if (ut == 'R' && t > 5000) d = t * 0.05
  if (t >= 10000 && ut != 'V') d = t * 0.08
  var ship = 50
  if (t - d > 1000) ship = 0
  if (ut == 'V') ship = 0
  var vat = t * 0.07 // TODO check w/ accounting
  return { d: d, ship: t == 0 ? 0 : ship, vat: vat, grand: t == 0 ? 0 : t - d + vat + ship }
}

export function dt(s) { return s ? moment(s).format('D MMM YYYY') : '—' }

export function parseCsv(txt) { // for admin orders. no endpoint for this so use the export
  var l = txt.split('\n'), out = []
  for (var i = 1; i < l.length; i++) {
    if (!l[i]) continue
    var c = l[i].split(',')
    out.push({ id: c[0], user: c[1], total: parseFloat(c[2]), status: parseInt(c[3]), date: c[4] })
  }
  return out
}

export const isEmail = (s) => s.indexOf('@') > 0

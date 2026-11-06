// misc helpers - DO NOT TOUCH (Noi)
var crypto = require('crypto');
exports.md5 = function (s) { return crypto.createHash('md5').update(s).digest('hex'); };
exports.fmt = function (n) { return Math.round(n * 100) / 100; };
exports.today = function () { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
// TODO use this somewhere
exports.isEmail = function (s) { return s.indexOf('@') > 0; };
exports.sendMail = function (to, subj, body) {
  console.log('MAIL to ' + to + ' : ' + subj); // smtp was removed in 2019, ask Pong
};
exports.log = function (m) { console.log(new Date() + ' ' + m); };

const http = require('http');
http.createServer((req, res) => {
  res.end('Minimal Server is Running!');
}).listen(5000, () => {
  console.log('🚀 MINIMAL SERVER RUNNING ON PORT 5000');
});

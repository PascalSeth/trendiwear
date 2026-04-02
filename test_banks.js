const https = require('https');

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/bank?country=ghana',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed.data.filter(b => b.type === 'mobile_money' || b.code === 'MTN' || b.name.includes('MTN')), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();

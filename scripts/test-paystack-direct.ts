import dotenv from 'dotenv';
dotenv.config();

async function testPaystack() {
  console.log('--- TESTING PAYSTACK TRANSFER API ---');
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  console.log('Secret Key Loaded:', secretKey ? `${secretKey.slice(0, 12)}...` : 'MISSING!');

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is missing in .env!');
    return;
  }

  // 1. Check Paystack Balance
  try {
    const balRes = await fetch('https://api.paystack.co/balance', {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    const balData = await balRes.json();
    console.log('\n1. PAYSTACK BALANCE RESPONSE:');
    console.log(JSON.stringify(balData, null, 2));
  } catch (e) {
    console.error('Failed checking balance:', e);
  }

  // 2. Create Test Recipient for MTN 0543711728
  try {
    console.log('\n2. CREATING PAYSTACK RECIPIENT...');
    const recRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'mobile_money',
        name: 'Pascal Elikem Adotse',
        account_number: '0543711728',
        bank_code: 'MTN',
        currency: 'GHS'
      })
    });
    const recData = await recRes.json();
    console.log(JSON.stringify(recData, null, 2));

    if (recData.status && recData.data?.recipient_code) {
      console.log('\n3. INITIATING GH₵ 2.00 TRANSFER TO RECIPIENT:', recData.data.recipient_code);
      const trRes = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: 'balance',
          amount: 200, // 2 GHS in pesewas
          recipient: recData.data.recipient_code,
          reason: 'Test TrendiZip Payout'
        })
      });
      const trData = await trRes.json();
      console.log('\nPAYSTACK TRANSFER API RESULT:');
      console.log(JSON.stringify(trData, null, 2));
    }
  } catch (e) {
    console.error('Failed transfer test:', e);
  }
}

testPaystack();

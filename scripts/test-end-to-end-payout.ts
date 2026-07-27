import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import crypto from 'crypto';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testFullPayoutWorkflow() {
  console.log('--- TESTING FULL END-TO-END MERCHANT PAYOUT WORKFLOW ---');

  // 1. Find user and professional profile for mystly19@gmail.com
  const user = await prisma.user.findFirst({
    where: { email: 'mystly19@gmail.com' },
    include: { professionalProfile: true },
  });

  if (!user || !user.professionalProfile) {
    console.error('Merchant account mystly19@gmail.com not found!');
    await pool.end();
    return;
  }

  const profId = user.professionalProfile.id;
  console.log('Merchant Profile ID:', profId);
  console.log('Business Name:', user.professionalProfile.businessName);

  // 2. Ensure merchant wallet has balance
  const updatedProf = await prisma.professionalProfile.update({
    where: { id: profId },
    data: {
      accountBalance: 10.0, // Ensure GH₵ 10.00 test wallet balance
      momoNumber: '0543711728',
      momoProvider: 'MTN',
    },
  });

  console.log('Wallet Balance Set To:', `GH₵ ${updatedProf.accountBalance.toFixed(2)}`);

  // 3. Simulate Payout Request of GH₵ 2.00 to 0543711728
  const withdrawAmount = 2.0;
  const accountNumber = '0543711728';
  const accountName = 'Pascal Elikem Adotse';
  const provider = 'MTN';
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is missing in .env!');
    await pool.end();
    return;
  }

  console.log(`\nExecuting Payout Request: GH₵ ${withdrawAmount.toFixed(2)} to ${provider} (${accountNumber})...`);

  // 3.1 Paystack Recipient Code
  let recipientCode = updatedProf.paystackRecipientCode;

  if (!recipientCode) {
    console.log('Creating Paystack Transfer Recipient...');
    const recRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'mobile_money',
        name: accountName,
        account_number: accountNumber,
        bank_code: 'MTN',
        currency: 'GHS',
      }),
    });
    const recData = await recRes.json();
    if (recData.status && recData.data?.recipient_code) {
      recipientCode = recData.data.recipient_code;
      await prisma.professionalProfile.update({
        where: { id: profId },
        data: { paystackRecipientCode: recipientCode },
      });
      console.log('Cached Paystack Recipient Code:', recipientCode);
    }
  } else {
    console.log('Using Cached Recipient Code:', recipientCode);
  }

  // 3.2 Deduct Wallet & Create PayoutRequest
  const payoutId = crypto.randomUUID();

  const payoutRecord = await prisma.$transaction(async (tx) => {
    await tx.professionalProfile.update({
      where: { id: profId },
      data: {
        accountBalance: { decrement: withdrawAmount },
      },
    });

    return await (tx as any).payoutRequest.create({
      data: {
        id: payoutId,
        professionalId: profId,
        amount: withdrawAmount,
        accountNumber,
        accountName,
        provider: 'MTN',
        status: 'PROCESSING',
      },
    });
  });

  console.log('Wallet Deducted. Created PayoutRequest ID:', payoutRecord.id);

  // 3.3 Execute Paystack Transfer
  console.log('Triggering Paystack Transfer API...');
  const transferRes = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(withdrawAmount * 100),
      recipient: recipientCode,
      reason: `TrendiZip Payout #${payoutRecord.id.slice(0, 8)}`,
    }),
  });

  const transferData = await transferRes.json();
  console.log('\nPAYSTACK RESPONSE:');
  console.log(JSON.stringify(transferData, null, 2));

  if (transferRes.ok && transferData.status) {
    await (prisma as any).payoutRequest.update({
      where: { id: payoutRecord.id },
      data: {
        status: 'PAID',
        paystackTransferCode: transferData.data?.transfer_code || 'PAYSTACK-AUTO',
        processedAt: new Date(),
      },
    });

    const finalProf = await prisma.professionalProfile.findUnique({
      where: { id: profId },
    });

    console.log('\n🎉 END-TO-END PAYOUT SUCCESSFUL!');
    console.log(`Transferred: GH₵ ${withdrawAmount.toFixed(2)} to ${accountNumber}`);
    console.log(`New Wallet Balance: GH₵ ${(finalProf?.accountBalance || 0).toFixed(2)}`);
  } else {
    console.error('❌ Transfer failed:', transferData.message);
  }

  await pool.end();
}

testFullPayoutWorkflow();

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { mapErrorToResponse } from "@/lib/api-utils";
import { getCurrencyCode } from "@/lib/currency";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Paystack MoMo Bank Code mapping for Ghana
 */
const MOMO_BANK_CODES: Record<string, string> = {
  MTN: "MTN",
  TELECEL: "VOD",
  VODAFONE: "VOD",
  AIRTELTIGO: "ATL",
  AT: "ATL",
};

/**
 * Helper to resolve dynamic Payout Threshold & Weekly Free Payout status
 */
async function resolveSellerPayoutLimits(professionalId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { professionalId },
    include: { tier: true },
  });

  const tierName = (sub?.tier?.name || "").toLowerCase();
  const isLegend = tierName.includes("legend");
  const isOhene = tierName.includes("ohene") || tierName.includes("royal");

  // Production Min Threshold by Subscription Tier
  let minThreshold = 50.0;
  if (isLegend) minThreshold = 20.0;
  else if (isOhene) minThreshold = 30.0;

  // Check payouts requested in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let recentCount = 0;

  try {
    const prismaAny = prisma as unknown as Record<string, { count: (args: unknown) => Promise<number> }>;
    if (prismaAny.payoutRequest?.count) {
      recentCount = await prismaAny.payoutRequest.count({
        where: {
          professionalId,
          createdAt: { gte: sevenDaysAgo },
          status: { in: ["PAID", "PROCESSING", "PENDING"] },
        },
      });
    } else {
      const rawRes = (await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as cnt FROM "PayoutRequest" WHERE "professionalId" = $1 AND "createdAt" >= $2 AND "status" IN ('PAID', 'PROCESSING', 'PENDING')`,
        professionalId,
        sevenDaysAgo
      )) as { cnt: number }[];
      recentCount = rawRes?.[0]?.cnt || 0;
    }
  } catch (err) {
    console.error("[PayoutAPI] Error counting recent payouts:", err);
  }

  // Payout fee: Legend is always FREE. Other tiers get 1 Free Payout per week, then GH₵ 1.00 fee.
  const isFreePayout = isLegend || recentCount === 0;
  const payoutFee = isFreePayout ? 0.0 : 1.0;

  return {
    tierName: sub?.tier?.name || "Free Artisan",
    minThreshold,
    isFreePayout,
    payoutFee,
    recentCountThisWeek: recentCount,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const { amount, accountNumber, accountName, provider } = body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid withdrawal amount." },
        { status: 400 }
      );
    }

    if (!accountNumber || !accountName || !provider) {
      return NextResponse.json(
        { error: "Account number, account name, and mobile money provider are required." },
        { status: 400 }
      );
    }

    // 1. Fetch Professional Profile
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Only verified professional seller accounts can request payouts." },
        { status: 403 }
      );
    }

    // 2. Resolve Tier Payout Limits & Weekly Free Status
    const limits = await resolveSellerPayoutLimits(profile.id);

    if (withdrawAmount < limits.minThreshold) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal threshold for your ${
            limits.tierName
          } plan is GH₵ ${limits.minThreshold.toFixed(
            2
          )}. Upgrade your subscription tier for lower payout thresholds!`,
        },
        { status: 400 }
      );
    }

    const totalDeducted = withdrawAmount + limits.payoutFee;

    // 3. Check wallet balance
    if ((profile.accountBalance || 0) < totalDeducted) {
      const feeText = limits.payoutFee > 0 ? ` + GH₵ ${limits.payoutFee.toFixed(2)} transfer fee` : "";
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. Total required: GH₵ ${totalDeducted.toFixed(
            2
          )} (Requested GH₵ ${withdrawAmount.toFixed(2)}${feeText}). Your available balance is GH₵ ${(
            profile.accountBalance || 0
          ).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const currencyCode = await getCurrencyCode();
    const cleanProvider = provider.toUpperCase().trim();
    let failureReasonText = "";

    // 4. Obtain or Create Paystack Recipient Code
    let recipientCode = profile.paystackRecipientCode;

    if (!recipientCode && process.env.PAYSTACK_SECRET_KEY) {
      try {
        const bankCode = MOMO_BANK_CODES[cleanProvider] || "MTN";
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "mobile_money",
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "GHS",
          }),
        });

        const recipientData = await recipientRes.json();
        console.log("[PayoutAPI] Paystack Recipient Creation Response:", JSON.stringify(recipientData));

        if (recipientRes.ok && recipientData.data?.recipient_code) {
          recipientCode = recipientData.data.recipient_code;

          await prisma.professionalProfile.update({
            where: { id: profile.id },
            data: { paystackRecipientCode: recipientCode },
          });
        } else {
          console.error("[PayoutAPI] Recipient Creation Failed:", recipientData.message);
          failureReasonText = recipientData.message || "Failed creating Paystack MoMo recipient";
        }
      } catch (recErr) {
        console.error("[PayoutAPI] Paystack Recipient creation error:", recErr);
      }
    }

    // 5. Atomic Transaction: Deduct totalDeducted, Record WalletTransaction ledger & Create PayoutRequest
    const payoutId = crypto.randomUUID();
    let payoutRecordId = payoutId;

    const currentBal = profile.accountBalance || 0;
    const newBalAfterTotal = currentBal - totalDeducted;

    await prisma.$transaction(async (tx) => {
      // Deduct total balance (withdrawAmount + payoutFee)
      await tx.professionalProfile.update({
        where: { id: profile.id },
        data: {
          accountBalance: {
            decrement: totalDeducted,
          },
        },
      });

      // Record WalletTransaction audit ledger entries
      const walletTxModel = (tx as unknown as Record<string, { create: (data: unknown) => Promise<unknown> }>).walletTransaction || (prisma as unknown as Record<string, { create: (data: unknown) => Promise<unknown> }>).walletTransaction;
      if (walletTxModel?.create) {
        await walletTxModel.create({
          data: {
            professionalId: profile.id,
            amount: -withdrawAmount,
            balanceBefore: currentBal,
            balanceAfter: currentBal - withdrawAmount,
            type: "PAYOUT_WITHDRAWAL",
            referenceId: payoutId,
            description: `Mobile Money Payout to ${cleanProvider} (${accountNumber})`,
          },
        });

        if (limits.payoutFee > 0) {
          await walletTxModel.create({
            data: {
              professionalId: profile.id,
              amount: -limits.payoutFee,
              balanceBefore: currentBal - withdrawAmount,
              balanceAfter: newBalAfterTotal,
              type: "PAYOUT_FEE",
              referenceId: payoutId,
              description: `Paystack Transfer Gateway Fee`,
            },
          });
        }
      } else {
        const now = new Date();
        await tx.$executeRawUnsafe(
          `INSERT INTO "WalletTransaction" ("id", "professionalId", "amount", "balanceBefore", "balanceAfter", "type", "referenceId", "description", "createdAt") VALUES ($1, $2, $3, $4, $5, 'PAYOUT_WITHDRAWAL'::"WalletTransactionType", $6, $7, $8)`,
          crypto.randomUUID(),
          profile.id,
          -withdrawAmount,
          currentBal,
          currentBal - withdrawAmount,
          payoutId,
          `Mobile Money Payout to ${cleanProvider} (${accountNumber})`,
          now
        );
        if (limits.payoutFee > 0) {
          await tx.$executeRawUnsafe(
            `INSERT INTO "WalletTransaction" ("id", "professionalId", "amount", "balanceBefore", "balanceAfter", "type", "referenceId", "description", "createdAt") VALUES ($1, $2, $3, $4, $5, 'PAYOUT_FEE'::"WalletTransactionType", $6, $7, $8)`,
            crypto.randomUUID(),
            profile.id,
            -limits.payoutFee,
            currentBal - withdrawAmount,
            newBalAfterTotal,
            payoutId,
            `Paystack Transfer Gateway Fee`,
            now
          );
        }
      }

      // Create PayoutRequest record
      const payoutModel = (tx as unknown as Record<string, { create: (data: unknown) => Promise<unknown> }>).payoutRequest || (prisma as unknown as Record<string, { create: (data: unknown) => Promise<unknown> }>).payoutRequest;
      if (payoutModel?.create) {
        const created = await payoutModel.create({
          data: {
            id: payoutId,
            professionalId: profile.id,
            amount: withdrawAmount,
            accountNumber,
            accountName,
            provider: cleanProvider,
            status: "PROCESSING",
          },
        });
        payoutRecordId = (created as { id: typeof payoutRecordId }).id;
      } else {
        const now = new Date();
        await tx.$executeRawUnsafe(
          `INSERT INTO "PayoutRequest" ("id", "professionalId", "amount", "accountNumber", "accountName", "provider", "status", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, 'PROCESSING'::"PayoutStatus", $7, $8)`,
          payoutId,
          profile.id,
          withdrawAmount,
          accountNumber,
          accountName,
          cleanProvider,
          now,
          now
        );
      }
    });

    // 6. Attempt Instant Paystack Transfer
    let transferSuccess = false;

    if (process.env.PAYSTACK_SECRET_KEY && recipientCode) {
      try {
        const transferRes = await fetch("https://api.paystack.co/transfer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: "balance",
            amount: Math.round(withdrawAmount * 100), // convert to pesewas
            recipient: recipientCode,
            reason: `TrendiZip Payout #${payoutRecordId.slice(0, 8)}`,
          }),
        });

        const transferData = await transferRes.json();
        console.log("[PayoutAPI] Paystack Transfer Response:", JSON.stringify(transferData));

        if (transferRes.ok && transferData.status) {
          transferSuccess = true;
          
          const pRequestModel = (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>).payoutRequest;
          if (pRequestModel?.update) {
            await pRequestModel.update({
              where: { id: payoutRecordId },
              data: {
                status: "PAID",
                paystackTransferCode: transferData.data?.transfer_code || "PAYSTACK-AUTO",
                processedAt: new Date(),
              },
            });
          } else {
            await prisma.$executeRawUnsafe(
              `UPDATE "PayoutRequest" SET "status" = 'PAID'::"PayoutStatus", "paystackTransferCode" = $1, "processedAt" = $2, "updatedAt" = $3 WHERE "id" = $4`,
              transferData.data?.transfer_code || "PAYSTACK-AUTO",
              new Date(),
              new Date(),
              payoutRecordId
            );
          }

          // Send success notification to seller
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "PAYMENT_RELEASED",
              title: "Payout Transferred Successfully!",
              message: `Your payout of ${currencyCode} ${withdrawAmount.toFixed(
                2
              )} has been transferred to your ${cleanProvider} Mobile Money (${accountNumber}).`,
              data: JSON.stringify({ payoutId: payoutRecordId, amount: withdrawAmount }),
            },
          });
        } else {
          failureReasonText = transferData.message || "Paystack transfer rejected";
        }
      } catch (trErr: unknown) {
        console.error("[PayoutAPI] Paystack Transfer Error:", trErr);
        const errObj = trErr as { message?: string };
        failureReasonText = errObj.message || "Network error executing transfer";
      }
    } else if (!recipientCode) {
      failureReasonText = "Recipient verification pending";
    }

    // If instant transfer failed or was queued
    if (!transferSuccess) {
      const pRequestModel = (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>).payoutRequest;
      if (pRequestModel?.update) {
        await pRequestModel.update({
          where: { id: payoutRecordId },
          data: {
            status: "FAILED",
            failureReason: failureReasonText || "Queued for admin manual recovery",
          },
        });
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "PayoutRequest" SET "status" = 'FAILED'::"PayoutStatus", "failureReason" = $1, "updatedAt" = $2 WHERE "id" = $3`,
          failureReasonText || "Queued for admin manual recovery",
          new Date(),
          payoutRecordId
        );
      }

      // Send queued/failed notification to seller
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "ORDER_UPDATE",
          title: "Payout Queued for Admin Recovery",
          message: `Your payout request of ${currencyCode} ${withdrawAmount.toFixed(
            2
          )} was received and is queued for manual admin processing due to gateway delay.`,
          data: JSON.stringify({ payoutId: payoutRecordId, amount: withdrawAmount }),
        },
      });
    }

    const updatedProfile = await prisma.professionalProfile.findUnique({
      where: { id: profile.id },
      select: { accountBalance: true },
    });

    return NextResponse.json({
      success: true,
      instantPayout: transferSuccess,
      message: transferSuccess
        ? `GH₵ ${withdrawAmount.toFixed(2)} transferred successfully!`
        : `Payout request of GH₵ ${withdrawAmount.toFixed(2)} queued for processing.`,
      payoutId: payoutRecordId,
      newAccountBalance: updatedProfile?.accountBalance || 0,
    });
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "payout-request" });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limits = await resolveSellerPayoutLimits(profile.id);

    let payoutHistory: Record<string, unknown>[] = [];
    const pReqModel = (prisma as unknown as Record<string, { findMany: (args: unknown) => Promise<Record<string, unknown>[]> }>).payoutRequest;
    if (pReqModel?.findMany) {
      payoutHistory = await pReqModel.findMany({
        where: { professionalId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } else {
      payoutHistory = ((await prisma.$queryRawUnsafe(
        `SELECT * FROM "PayoutRequest" WHERE "professionalId" = $1 ORDER BY "createdAt" DESC LIMIT 20`,
        profile.id
      )) as Record<string, unknown>[]) || [];
    }

    // Calculate total paid out successfully
    let totalPaidOut = 0;
    payoutHistory.forEach((p) => {
      if (p.status === "PAID") {
        totalPaidOut += Number(p.amount || 0);
      }
    });

    // Calculate pending escrow held for this seller
    const escrowItems = await prisma.orderItem.findMany({
      where: {
        professionalId: profile.id,
        order: {
          status: {
            in: [
              "PENDING",
              "CONFIRMED",
              "PROCESSING",
              "SHIPPED",
              "READY_FOR_DELIVERY",
              "READY_FOR_PICKUP",
            ],
          },
        },
      },
      select: { price: true, quantity: true },
    });

    const totalEscrowHeld = escrowItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    // Total Lifetime Earnings = Available Wallet Balance + Paid Out + Escrow Held
    const totalLifetimeEarnings = (profile.accountBalance || 0) + totalPaidOut + totalEscrowHeld;

    return NextResponse.json({
      accountBalance: profile.accountBalance || 0,
      totalPaidOut,
      totalEscrowHeld,
      totalLifetimeEarnings,
      momoNumber: profile.momoNumber || "",
      momoProvider: profile.momoProvider || "MTN",
      payoutHistory: payoutHistory || [],
      limits,
    });
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "payout-get" });
    return NextResponse.json({ error: message }, { status });
  }
}

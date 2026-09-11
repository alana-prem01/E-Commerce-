const User = require('../models/UserSchema');
const WalletTransaction = require('../models/WalletTransactionSchema');

// Helper function to credit user wallet idempotently
const creditWallet = async ({ userId, amount, reason, orderId, refundId, referenceId }) => {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid wallet credit parameters');
  }

  const trustedRefId = referenceId || (refundId ? `REFUND_${refundId}` : (orderId ? `ORDER_REFUND_${orderId}` : null));

  // Idempotency check: if transaction with referenceId exists, return it without duplicate credit
  if (trustedRefId) {
    const existingTx = await WalletTransaction.findOne({ referenceId: trustedRefId });
    if (existingTx) {
      console.log(`[creditWallet] Idempotency hit: Transaction already exists for ref ${trustedRefId}`);
      return existingTx;
    }
  }

  // Atomically increment user wallet balance
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: amount } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('User not found for wallet credit');
  }

  // Create WalletTransaction record
  const walletTx = new WalletTransaction({
    user: userId,
    type: 'CREDIT',
    amount: amount,
    reason: reason || 'Order Refund',
    orderId: orderId || undefined,
    refundId: refundId || undefined,
    referenceId: trustedRefId || undefined,
    balanceAfter: updatedUser.walletBalance
  });

  await walletTx.save();
  return walletTx;
};

// Helper function to debit user wallet atomically with insufficient balance protection
const debitWallet = async ({ userId, amount, reason, orderId }) => {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid wallet debit parameters');
  }

  // Atomic condition: walletBalance must be >= amount to prevent overspending/negative balance
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('Insufficient wallet balance or user not found');
  }

  // Create WalletTransaction record
  const walletTx = new WalletTransaction({
    user: userId,
    type: 'DEBIT',
    amount: amount,
    reason: reason || 'Order Payment',
    orderId: orderId || undefined,
    balanceAfter: updatedUser.walletBalance
  });

  await walletTx.save();
  return walletTx;
};

// @desc    Get user wallet balance and recent transactions
// @route   GET /api/profile/wallet
// @access  Private
const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('walletBalance name email');

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      balance: user ? (user.walletBalance || 0) : 0,
      transactions
    });
  } catch (error) {
    console.error('Error in getWalletDetails:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user wallet transaction history
// @route   GET /api/profile/wallet/transactions
// @access  Private
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Error in getWalletTransactions:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  creditWallet,
  debitWallet,
  getWalletDetails,
  getWalletTransactions
};

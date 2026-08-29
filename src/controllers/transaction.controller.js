const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const mongoose = require("mongoose");


/**
 * Check whether amount is valid
 */
const isValidAmount = (amount) => {
    return (
        amount !== undefined &&
        amount !== null &&
        !isNaN(amount) &&
        Number(amount) > 0
    );
};


/**
 * =========================================================
 * NORMAL TRANSACTION
 * =========================================================
 */
const transactionController = async (req, res) => {
    try {
        const {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey
        } = req.body;


        /**
         * 1. Validate request
         */
        if (
            !fromAccount ||
            !toAccount ||
            !isValidAmount(amount) ||
            !idempotencyKey
        ) {
            return res.status(400).json({
                message:
                    "fromAccount, toAccount, amount and idempotencyKey are required"
            });
        }


        /**
         * Convert amount to Number
         */
        const transactionAmount = Number(amount);


        /**
         * 2. Validate ObjectIds
         */
        if (
            !mongoose.Types.ObjectId.isValid(fromAccount) ||
            !mongoose.Types.ObjectId.isValid(toAccount)
        ) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            });
        }


        /**
         * 3. Prevent same account transfer
         */
        if (String(fromAccount) === String(toAccount)) {
            return res.status(400).json({
                message:
                    "fromAccount and toAccount cannot be the same"
            });
        }


        /**
         * 4. Check idempotency key
         */
        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            });


        if (existingTransaction) {

            if (existingTransaction.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: existingTransaction
                });
            }


            if (existingTransaction.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is processing",
                    transaction: existingTransaction
                });
            }


            if (existingTransaction.status === "FAILED") {
                return res.status(400).json({
                    message:
                        "Transaction attempt failed. Please use a new idempotencyKey."
                });
            }


            if (existingTransaction.status === "REVERSED") {
                return res.status(400).json({
                    message:
                        "Transaction was reversed. Please use a new idempotencyKey."
                });
            }
        }


        /**
         * 5. Find FROM account
         */
        const fromUserAccount =
            await accountModel.findById(fromAccount);


        /**
         * 6. Find TO account
         */
        const toUserAccount =
            await accountModel.findById(toAccount);


        /**
         * 7. Validate accounts
         */
        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message:
                    "Invalid fromAccount or toAccount"
            });
        }


        /**
         * 8. Check account status
         */
        if (
            fromUserAccount.status !== "ACTIVE" ||
            toUserAccount.status !== "ACTIVE"
        ) {
            return res.status(400).json({
                message:
                    "Both fromAccount and toAccount must be ACTIVE"
            });
        }


        /**
         * 9. Check balance
         */
        const balance =
            await fromUserAccount.getBalance();


        if (Number(balance) < transactionAmount) {
            return res.status(400).json({
                message:
                    `Insufficient balance. Current balance is ${balance}, requested amount is ${transactionAmount}`
            });
        }


        /**
         * =====================================================
         * 10. CREATE TRANSACTION
         * =====================================================
         *
         * IMPORTANT:
         * new transactionModel() takes an OBJECT.
         */
        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount: transactionAmount,
            idempotencyKey,
            status: "PENDING"
        });


        await transaction.save();


        /**
         * =====================================================
         * 11. CREATE DEBIT LEDGER
         * =====================================================
         */
        await ledgerModel.create({
            account: fromUserAccount._id,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "DEBIT"
        });


        /**
         * =====================================================
         * 12. CREATE CREDIT LEDGER
         * =====================================================
         */
        await ledgerModel.create({
            account: toUserAccount._id,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "CREDIT"
        });


        /**
         * =====================================================
         * 13. MARK TRANSACTION COMPLETED
         * =====================================================
         */
        transaction.status = "COMPLETED";

        await transaction.save();


        /**
         * 14. Response
         */
        return res.status(201).json({
            message:
                "Transaction completed successfully",
            transaction
        });

    } catch (error) {

        console.error(
            "Transaction error:",
            error
        );


        /**
         * If something failed after transaction creation,
         * try to mark it as FAILED.
         */
        if (error.transaction) {
            try {
                error.transaction.status = "FAILED";
                await error.transaction.save();
            } catch (saveError) {
                console.error(
                    "Failed to update transaction:",
                    saveError
                );
            }
        }


        /**
         * Duplicate idempotency key
         */
        if (error.code === 11000) {

            const existingTransaction =
                await transactionModel.findOne({
                    idempotencyKey:
                        req.body.idempotencyKey
                });


            if (existingTransaction) {
                return res.status(200).json({
                    message:
                        "Transaction already exists",
                    transaction:
                        existingTransaction
                });
            }
        }


        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        });
    }
};


/**
 * =========================================================
 * CREATE INITIAL FUNDS
 * =========================================================
 */
const createInitialFunds = async (req, res) => {
    try {

        const {
            toAccount,
            amount,
            idempotencyKey
        } = req.body;


        /**
         * 1. Validate request
         */
        if (
            !toAccount ||
            !isValidAmount(amount) ||
            !idempotencyKey
        ) {
            return res.status(400).json({
                message:
                    "toAccount, amount and idempotencyKey are required"
            });
        }


        /**
         * Convert amount to Number
         */
        const transactionAmount =
            Number(amount);


        /**
         * 2. Validate ObjectId
         */
        if (
            !mongoose.Types.ObjectId.isValid(toAccount)
        ) {
            return res.status(400).json({
                message:
                    "Invalid toAccount"
            });
        }


        /**
         * 3. Check authentication
         */
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message:
                    "Unauthorized"
            });
        }


        /**
         * 4. Check idempotency key
         */
        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            });


        if (existingTransaction) {

            if (
                existingTransaction.status ===
                "COMPLETED"
            ) {
                return res.status(200).json({
                    message:
                        "Initial funds already processed",
                    transaction:
                        existingTransaction
                });
            }


            if (
                existingTransaction.status ===
                "PENDING"
            ) {
                return res.status(200).json({
                    message:
                        "Initial funds transaction is processing",
                    transaction:
                        existingTransaction
                });
            }


            if (
                existingTransaction.status ===
                    "FAILED" ||
                existingTransaction.status ===
                    "REVERSED"
            ) {
                return res.status(400).json({
                    message:
                        "Previous transaction failed or was reversed. Please use a new idempotencyKey."
                });
            }
        }


        /**
         * 5. Find destination account
         */
        const toUserAccount =
            await accountModel.findById(toAccount);


        if (!toUserAccount) {
            return res.status(400).json({
                message:
                    "Invalid destination account"
            });
        }


        /**
         * 6. Check destination account status
         */
        if (toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message:
                    "Destination account must be ACTIVE"
            });
        }


        /**
         * 7. Find system account
         */
        const fromUserAccount =
            await accountModel.findOne({
                user: req.user._id
            });


        if (!fromUserAccount) {
            return res.status(400).json({
                message:
                    "System user account not found"
            });
        }


        /**
         * 8. Check system account status
         */
        if (fromUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message:
                    "System account must be ACTIVE"
            });
        }


        /**
         * =====================================================
         * 9. CREATE TRANSACTION
         * =====================================================
         */
        const transaction =
            new transactionModel({
                fromAccount:
                    fromUserAccount._id,

                toAccount:
                    toUserAccount._id,

                amount:
                    transactionAmount,

                idempotencyKey,

                status:
                    "PENDING"
            });


        await transaction.save();


        /**
         * =====================================================
         * 10. DEBIT SYSTEM ACCOUNT
         * =====================================================
         */
        await ledgerModel.create({
            account:
                fromUserAccount._id,

            amount:
                transactionAmount,

            transaction:
                transaction._id,

            type:
                "DEBIT"
        });


        /**
         * =====================================================
         * 11. CREDIT USER ACCOUNT
         * =====================================================
         */
        await ledgerModel.create({
            account:
                toUserAccount._id,

            amount:
                transactionAmount,

            transaction:
                transaction._id,

            type:
                "CREDIT"
        });


        /**
         * =====================================================
         * 12. MARK COMPLETED
         * =====================================================
         */
        transaction.status =
            "COMPLETED";

        await transaction.save();


        /**
         * 13. Response
         */
        return res.status(201).json({
            message:
                "Initial funds transaction completed successfully",

            transaction
        });

    } catch (error) {

        console.error(
            "Initial funds error:",
            error
        );


        /**
         * Handle duplicate idempotency key
         */
        if (error.code === 11000) {

            const existingTransaction =
                await transactionModel.findOne({
                    idempotencyKey:
                        req.body.idempotencyKey
                });


            if (existingTransaction) {
                return res.status(200).json({
                    message:
                        "Initial funds transaction already exists",

                    transaction:
                        existingTransaction
                });
            }
        }


        return res.status(500).json({
            message:
                "Initial funds transaction failed",

            error:
                error.message
        });
    }
};


module.exports = {
    transactionController,
    createInitialFunds
};
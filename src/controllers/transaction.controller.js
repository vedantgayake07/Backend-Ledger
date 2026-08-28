const transactionModel = require("../models/transaction.model")
const accountModel = require("../models/account.model")
const ledgerModel = require("../models/ledger.model")
const mongoose = require("mongoose")


const transactionController = async (req, res) => {

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    /**
     * 1. Validate request
     */
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount or idempotencyKey are required"
        })
    }

    /**
     * 2. Validate accounts
     */
    const fromUserAccount = await accountModel.findById(fromAccount)
    const toUserAccount = await accountModel.findById(toAccount)

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 3. Validate idempotency key
     */
    const isExistingTransaction = await transactionModel.findOne({
        idempotencyKey
    })

    if (isExistingTransaction) {

        if (isExistingTransaction.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isExistingTransaction
            })
        }

        if (isExistingTransaction.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is processing"
            })
        }

        if (isExistingTransaction.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction attempt failed, please try again"
            })
        }

        if (isExistingTransaction.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 4. Check account status
     */
    if (
        fromUserAccount.status !== "ACTIVE" ||
        toUserAccount.status !== "ACTIVE"
    ) {
        return res.status(400).json({
            message: "Both FromAccount and ToAccount must be Active to process the transaction"
        })
    }

    /**
     * 5. Check balance
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}, and requested amount is ${amount}`
        })
    }

    /**
     * 6. Start MongoDB transaction
     */
    const session = await mongoose.startSession()

    try {

        session.startTransaction()

        /**
         * 7. Create transaction
         */
        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session })

        /**
         * 8. Create debit ledger entry
         */
        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        /**
         * 9. Create credit ledger entry
         */
        await ledgerModel.create([{
            account: toUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        /**
         * 10. Mark transaction completed
         */
        transaction.status = "COMPLETED"

        await transaction.save({ session })

        /**
         * 11. Commit transaction
         */
        await session.commitTransaction()

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction
        })

    } catch (error) {

        await session.abortTransaction()

        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        })

    } finally {

        await session.endSession()

    }
}


const createInitialFunds = async (req, res) => {

    const { toAccount, amount, idempotencyKey } = req.body

    /**
     * 1. Validate request
     */
    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    /**
     * 2. Find destination account
     */
    const toUserAccount = await accountModel.findById(toAccount)

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid account"
        })
    }

    /**
     * 3. Find system user's account
     */
    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    /**
     * 4. Start MongoDB transaction
     */
    const session = await mongoose.startSession()

    try {

        session.startTransaction()

        /**
         * 5. Create transaction
         */
        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session })

        /**
         * 6. Debit system account
         */
        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        /**
         * 7. Credit user account
         */
        await ledgerModel.create([{
            account: toUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        /**
         * 8. Mark transaction completed
         */
        transaction.status = "COMPLETED"

        await transaction.save({ session })

        /**
         * 9. Commit transaction
         */
        await session.commitTransaction()

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction
        })

    } catch (error) {

        await session.abortTransaction()

        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: error.message
        })

    } finally {

        await session.endSession()

    }
}


module.exports = {
    transactionController,
    createInitialFunds
}


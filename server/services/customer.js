const CustomerModel = require('../models/customer');

// ─── Basic CRUD ───────────────────────────────────────────────────────────────

const create = (postData) => CustomerModel.create(postData);

const getAll = (filter) => CustomerModel.find(filter).lean();

const getOne = (filter) => CustomerModel.findOne(filter).lean();

const getById = (id) => CustomerModel.findById(id).lean();

const updateById = (id, payload) =>
    CustomerModel.findByIdAndUpdate(id, payload, { new: true }).lean();

// ─── Business Logic ───────────────────────────────────────────────────────────

/**
 * Generate a Diamante keypair, activate via Friendbot (best-effort),
 * then persist the customer record.
 */
const createWithWallet = async (data) => {
    const { Keypair } = require('diamante-base');

    const keypair = Keypair.random();
    const pkey = keypair.publicKey();
    const skey = keypair.secret();

    try {
        const fetch = await import('node-fetch').then((mod) => mod.default);
        const response = await fetch(`https://friendbot.diamcircle.io/?addr=${pkey}`);
        if (response.ok) {
            await response.json();
        } else {
            console.warn(
                `Friendbot unavailable for ${pkey}: ${response.statusText} — skipping activation`,
            );
        }
    } catch (err) {
        console.warn(`Friendbot request failed: ${err.message} — skipping activation`);
    }

    return CustomerModel.create({
        name: data.name,
        email: data.companyEmail,
        walletAddress: data.walletAddress,
        type: 'user',
        pkey,
        skey,
    });
};

/**
 * Send an OTP to the given email address via nodemailer/Gmail SMTP.
 */
const sendOTPEmail = async (email, otp) => {
    const nodemailer = require('nodemailer');
    const config = require('../config/config');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: config.server.smtpMail, pass: config.server.smtpPassword },
        tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
        from: config.server.smtpMail,
        to: email,
        subject: 'SupplyX Have just delivered your OTP!',
        html: `
        <body>
            <h3 style="font-family:Sans-Serif;color:#190482;">
               Your OTP IS: ${otp},<br/><br/>
               If you did not request this OTP, please ignore this email and do not share the OTP with anybody else.
            </h3>
        </body>`,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email send error:', error);
                reject(error);
            } else {
                console.log(`Email sent: ${info.response}`);
                resolve(info);
            }
        });
    });
};

/**
 * Load the Diamante account balances for a given public key.
 */
const fetchBalance = async (pkey) => {
    const { Horizon } = require('diamante-sdk-js');
    const server = new Horizon.Server('https://diamtestnet.diamcircle.io/');
    const account = await server.loadAccount(pkey);
    return account.balances.map((b) => ({
        asset_type: b.asset_type,
        balance: b.balance,
    }));
};

/**
 * Execute a payment of 1 DIAM from the platform sender account to a destination key.
 */
const executePayment = async (destinationKey) => {
    const { Keypair, TransactionBuilder, Operation, Networks } = require('diamante-base');
    const { Horizon, Asset } = require('diamante-sdk-js');

    const senderSecret =
        process.env.SENDER_SECRET_KEY || 'SBBXMWUSGQDDH73N3NICSCFH3B5NQA3QF6PZ7KRIZPNFIOCE7JI4NGZ3';
    const amount = '1';

    const server = new Horizon.Server('https://diamtestnet.diamcircle.io/');
    const senderKeypair = Keypair.fromSecret(senderSecret);
    const senderPublicKey = senderKeypair.publicKey();

    const account = await server.loadAccount(senderPublicKey);
    const transaction = new TransactionBuilder(account, {
        fee: await server.fetchBaseFee(),
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(
            Operation.payment({
                destination: destinationKey,
                asset: Asset.native(),
                amount,
            }),
        )
        .setTimeout(30)
        .build();

    transaction.sign(senderKeypair);
    await server.submitTransaction(transaction);
    console.log(`Payment of ${amount} DIAM sent from ${senderPublicKey} to ${destinationKey}`);
    return { amount, destination: destinationKey, sender: senderPublicKey };
};

const CustomerService = {
    create,
    getAll,
    getOne,
    getById,
    updateById,
    createWithWallet,
    sendOTPEmail,
    fetchBalance,
    executePayment,
};

module.exports = CustomerService;

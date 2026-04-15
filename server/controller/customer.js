const nodemailer = require('nodemailer');
const { Keypair, TransactionBuilder, Operation, Networks } = require('diamante-base');
const { Horizon, Asset } = require('diamante-sdk-js');
const { wrapAsync } = require('../lib/wrapAsync');
const { sendSuccess } = require('../lib/response');
const config = require('../config/config');
const CustomerService = require('../services/customer');

const smtpUser = config.server.smtpMail;
const smtpPass = config.server.smtpPassword;

async function sendOTPViaEmail(emailed, otp) {
    console.log('EMAIL DATA: ' + emailed + ' ' + otp);

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
        });

        const mailOptions = {
            from: smtpUser,
            to: emailed,
            subject: 'SupplyX Have just delivered your OTP!',
            html: `
            <body>
                <h3 style="font-family:Sans-Serif;color:#190482;">
                   Your OTP IS: ${otp},<br/><br/>
                   If you did not request this OTP, please ignore this email and do not share the OTP with anybody else.
                </h3>
            </body>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log(`Email sent: ${info.response}`);
            }
        });
    } catch (err) {
        console.log(err);
    }
}

const createCustomer = async (req, res) => {
    const { name, companyEmail, walletAddress } = req.body;

    if (!name || !companyEmail || !walletAddress) {
        const err = new Error('Missing required fields: name, companyEmail, walletAddress');
        err.statusCode = 400;
        throw err;
    }

    const keypair = Keypair.random();
    console.log('Keypair created:', keypair.publicKey(), keypair.secret());
    const pkey = keypair.publicKey();
    const skey = keypair.secret();

    try {
        const fetch = await import('node-fetch').then((mod) => mod.default);
        const response = await fetch(`https://friendbot.diamcircle.io/?addr=${pkey}`);
        if (response.ok) {
            const result = await response.json();
            console.log(`Account ${pkey} activated`, result);
        } else {
            console.warn(`Friendbot unavailable for ${pkey}: ${response.statusText} — skipping activation`);
        }
    } catch (friendbotErr) {
        console.warn(`Friendbot request failed: ${friendbotErr.message} — skipping activation`);
    }

    await CustomerService.create({
        name,
        email: companyEmail,
        walletAddress,
        type: 'user',
        pkey,
        skey,
    });

    return sendSuccess(res, { message: 'Signup successful!', statusCode: 201 });
};

const loginCustomer = async (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        const err = new Error('walletAddress is required');
        err.statusCode = 400;
        throw err;
    }

    const user = await CustomerService.getOne({ walletAddress });

    if (!user) {
        const err = new Error('Wallet address not found. Please sign up first.');
        err.statusCode = 401;
        throw err;
    }

    return sendSuccess(res, { message: 'Login successful!', data: user });
};

const sendOtp = async (req, res) => {
    const { email, otp } = req.body;
    sendOTPViaEmail(email, otp);
    return sendSuccess(res, { message: 'OTP sent successfully!' });
};

const getBalance = async (req, res) => {
    const pkey = req.query.pkey;
    const server = new Horizon.Server('https://diamtestnet.diamcircle.io/');
    const account = await server.loadAccount(pkey);
    console.log('Balances for account: ' + pkey);

    const balances = account.balances.map((b) => ({
        asset_type: b.asset_type,
        balance: b.balance,
    }));

    return sendSuccess(res, { message: 'Balance fetched', data: { balances } });
};

const sendMoney = async (req, res) => {
    const senderSecret = process.env.SENDER_SECRET_KEY || 'SBBXMWUSGQDDH73N3NICSCFH3B5NQA3QF6PZ7KRIZPNFIOCE7JI4NGZ3';
    const amount = '1';
    const { key } = req.body;

    console.log(`Received request to make payment from sender to ${key} with amount ${amount}`);

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
                destination: key,
                asset: Asset.native(),
                amount,
            }),
        )
        .setTimeout(30)
        .build();

    transaction.sign(senderKeypair);
    await server.submitTransaction(transaction);
    console.log(`Payment made from ${senderPublicKey} to ${key} with amount ${amount}`);

    return sendSuccess(res, { message: `Payment of ${amount} DIAM made to ${key} successfully` });
};

const getAll = async (req, res) => {
    const customers = await CustomerService.getAll();
    return sendSuccess(res, { message: 'Customers fetched', data: customers });
};

const CustomerController = {
    createCustomer: wrapAsync(createCustomer),
    loginCustomer: wrapAsync(loginCustomer),
    sendOtp: wrapAsync(sendOtp),
    sendMoney: wrapAsync(sendMoney),
    getBalance: wrapAsync(getBalance),
    getAll: wrapAsync(getAll),
};

module.exports = CustomerController;

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { CREDIT_PACKS, PLAN_IDS } = require('../constants/payments');
const Users = require('../model/Users');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentController = {
    createOrder: async (req, res) => {
        try {
            const { credits } = req.body;

            if (!CREDIT_PACKS[credits]) {
                return res.status(400).json({ message: 'Unsupported credit value' });
            }

            const amount = CREDIT_PACKS[credits] * 100;

            const order = await razorpay.orders.create({
                amount,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
            });

            res.json({ order });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    verifyOrder: async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits } = req.body;

            const body = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ message: 'Signature verification failed' });
            }

            const user = await Users.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.credits += Number(credits);
            await user.save();

            res.json({ user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    createSubscription: async (req, res) => {
        try {
            const { plan_name } = req.body;

            if (!PLAN_IDS[plan_name]) {
                return res.status(400).json({ message: 'Invalid plan id' });
            }

            const plan = PLAN_IDS[plan_name];

            const subscription = await razorpay.subscriptions.create({
                plan_id: plan.id,
                customer_notify: 1,
                total_count: plan.totalBillingCycleCount,
                notes: {
                    email: req.user.username,
                    userId: req.user.id
                }
            });

            res.json({ subscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    verifySubscription: async (req, res) => {
        try {
            const { subscription_id } = req.body;

            const subscription = await razorpay.subscriptions.fetch(subscription_id);
            const user = await Users.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.subscription = {
                id: subscription.id,
                plan_id: subscription.plan_id,
                status: subscription.status,
                start: subscription.current_start ? new Date(subscription.current_start * 1000) : null,
                end: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
            };

            await user.save();

            res.json({ user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    handleWebhookEvent: async (req, res) => {
        try {
            const signature = req.headers['x-razorpay-signature'];
            const bodyBuffer = req.body; // req.body is a Buffer when using express.raw

            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(bodyBuffer)
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).send('Invalid signature');
            }

            const payload = JSON.parse(bodyBuffer.toString());
            const event = payload.event;
            const subscriptionData = payload.payload.subscription.entity;

            const razorpaySubscriptionId = subscriptionData.id;
            const userId = subscriptionData.notes?.userId;

            if (!userId) {
                return res.status(400).send('UserId not found via notes');
            }

            let newStatus = '';
            switch (event) {
                case 'subscription.activated':
                    newStatus = 'active';
                    break;
                case 'subscription.pending':
                    newStatus = 'pending';
                    break;
                case 'subscription.cancelled':
                    newStatus = 'cancelled';
                    break;
                case 'subscription.completed':
                    newStatus = 'completed';
                    break;
                default:
                    console.log('Unhandled event: ', event);
                    return res.status(200).send('Unhandled event');
            }

            const user = await Users.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        'subscription.id': razorpaySubscriptionId,
                        'subscription.status': newStatus,
                        'subscription.start': subscriptionData.start_at ? new Date(subscriptionData.start_at * 1000) : null,
                        'subscription.end': subscriptionData.end_at ? new Date(subscriptionData.end_at * 1000) : null,
                        'subscription.lastBillDate': subscriptionData.current_start ? new Date(subscriptionData.current_start * 1000) : null,
                        'subscription.nextBillDate': subscriptionData.current_end ? new Date(subscriptionData.current_end * 1000) : null,
                        'subscription.paymentMade': subscriptionData.paid_count,
                        'subscription.paymentsRemaining': subscriptionData.remaining_count
                    }
                },
                { new: true }
            );

            if (!user) {
                return res.status(404).send('User not found');
            }
            console.log("Webhook Event Received:", req.body.event);

            console.log(`Updated subscription for user ${userId} to ${newStatus}`);
            return res.status(200).send('Event processed');

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    cancelSubscription: async (req, res) => {
        try {
            const { subscription_id } = req.body;

            if (!subscription_id) {
                return res.status(400).json({ message: 'Subscription ID is required to cancel' });
            }

            const result = await razorpay.subscriptions.cancel(subscription_id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = paymentController;

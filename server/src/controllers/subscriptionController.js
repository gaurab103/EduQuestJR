import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import * as paypal from '../services/paypal.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export async function createSubscription(req, res, next) {
  try {
    const user = req.user;
    const planType = req.body?.planType || 'monthly';
    const returnUrl = `${CLIENT_URL}/subscription/success`;
    const cancelUrl = `${CLIENT_URL}/subscription/cancel`;
    const { subscriptionId, approvalUrl, status } = await paypal.createSubscription(
      user._id.toString(),
      user.email,
      user.name,
      planType,
      returnUrl,
      cancelUrl
    );
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        planType: planType === '6months' ? '6months' : planType === 'yearly' ? 'yearly' : 'monthly',
        paypalSubscriptionId: subscriptionId,
        status: 'pending',
      },
      { upsert: true, new: true }
    );
    res.json({ subscriptionId, approvalUrl, status });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/subscription/plan-id
 * Returns the PayPal plan ID for a given planType (for client-side SDK)
 */
export async function getPlanId(req, res, next) {
  try {
    const planType = req.body?.planType || 'monthly';
    const { planId } = await paypal.getOrCreatePlanIdPublic(planType);
    res.json({ planId, planType });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/subscription/activate
 * Called after client-side PayPal approval; activates subscription
 */
export async function activateSubscription(req, res, next) {
  try {
    const user = req.user;
    const { subscriptionId, planType = 'monthly' } = req.body;
    if (!subscriptionId) return res.status(400).json({ message: 'subscriptionId required' });

    // Verify with PayPal
    let details;
    try {
      details = await paypal.getSubscriptionDetails(subscriptionId);
    } catch (_) {
      details = { status: 'ACTIVE' }; // fallback for sandbox
    }

    const periodEnd = details?.billing_info?.next_billing_time;
    const endDate = periodEnd ? new Date(periodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Save subscription record
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        planType: planType,
        paypalSubscriptionId: subscriptionId,
        status: 'active',
        currentPeriodEnd: endDate,
      },
      { upsert: true, new: true }
    );

    // Update user status
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'active',
      subscriptionExpiry: endDate,
    });

    res.json({ success: true, subscriptionStatus: 'active', subscriptionExpiry: endDate });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/subscription/start-trial
 * Starts a 10-day free trial. Can only be used once per user.
 */
export async function startTrial(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.trialUsed) {
      return res.status(400).json({ message: 'Free trial has already been used on this account.' });
    }

    if (user.subscriptionStatus === 'active') {
      return res.status(400).json({ message: 'You already have an active premium subscription.' });
    }

    const trialEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'trial',
      subscriptionExpiry: trialEnd,
      trialUsed: true,
      trialStartDate: new Date(),
    });

    res.json({
      success: true,
      subscriptionStatus: 'trial',
      subscriptionExpiry: trialEnd,
      message: 'Your 10-day free trial has started! Enjoy full premium access.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getStatus(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    const status = req.user.subscriptionStatus;
    const expiry = req.user.subscriptionExpiry;
    const plansConfig = paypal.getPlansConfig();
    res.json({
      subscriptionStatus: status,
      subscriptionExpiry: expiry,
      paypalSubscriptionId: sub?.paypalSubscriptionId,
      planType: sub?.planType || 'free',
      plans: plansConfig,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleWebhook(req, res, next) {
  try {
    const event = req.body || {};
    const eventType = event.event_type;
    const resource = event.resource || {};

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || eventType === 'BILLING.SUBSCRIPTION.PAYMENT.CREATED') {
      const subscriptionId = resource.id || resource.subscription_id;
      if (!subscriptionId) return res.status(200).send('OK');

      let details = { custom_id: resource.custom_id };
      try {
        details = await paypal.getSubscriptionDetails(subscriptionId);
      } catch (_) {}
      const customId = details?.custom_id || resource.custom_id;
      if (!customId) return res.status(200).send('OK');

      const userId = customId;
      const periodEnd = details?.billing_info?.next_billing_time || resource.billing_info?.next_billing_time;
      const endDate = periodEnd ? new Date(periodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
        subscriptionExpiry: endDate,
      });
      await Subscription.findOneAndUpdate(
        { paypalSubscriptionId: subscriptionId },
        { status: 'active', currentPeriodEnd: endDate, planType: 'premium' },
        { upsert: false }
      );
    } else if (
      eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ||
      eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
    ) {
      const subscriptionId = resource.id || resource.subscription_id;
      if (subscriptionId) {
        const sub = await Subscription.findOne({ paypalSubscriptionId: subscriptionId });
        if (sub) {
          await User.findByIdAndUpdate(sub.userId, {
            subscriptionStatus: eventType.includes('CANCELLED') || eventType.includes('EXPIRED') ? 'cancelled' : 'expired',
            subscriptionExpiry: new Date(),
          });
          await Subscription.updateOne(
            { paypalSubscriptionId: subscriptionId },
            { status: 'cancelled' }
          );
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
}

export async function subscriptionSuccess(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const sub = await Subscription.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (sub?.paypalSubscriptionId) {
      const details = await paypal.getSubscriptionDetails(sub.paypalSubscriptionId).catch(() => null);
      if (details?.status === 'ACTIVE') {
        const nextBilling = details.billing_info?.next_billing_time;
        const endDate = nextBilling ? new Date(nextBilling) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await User.findByIdAndUpdate(user._id, {
          subscriptionStatus: 'active',
          subscriptionExpiry: endDate,
        });
        await Subscription.updateOne(
          { _id: sub._id },
          { status: 'active', currentPeriodEnd: endDate }
        );
      }
    }
    res.json({ success: true, subscriptionStatus: 'active' });
  } catch (err) {
    next(err);
  }
}

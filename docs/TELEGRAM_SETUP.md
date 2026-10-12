# Telegram order alerts

You get a Telegram message for every new order, every "I've sent the payment" report, every canceled order, and a reminder for orders that have waited too long. Each alert has two buttons:

- **📋 View Order** opens the order in your dashboard.
- **💬 WhatsApp Customer** opens a WhatsApp chat with the customer, with a friendly message already typed. Just tap send. You don't need to save their number.

It takes about 5 minutes and is free.

## 1. Create the bot

1. In Telegram, open **@BotFather** (the one with the blue check mark).
2. Send `/newbot`.
3. Give it a name (e.g. *Jordi Orders*) and a username ending in `bot` (e.g. `jordi_orders_bot`).
4. BotFather replies with a **token** like `7123456789:AAH...`. This is `TELEGRAM_BOT_TOKEN`.

   Treat it like a password. If it ever leaks, send `/revoke` to BotFather and update the variable.

## 2. Find your chat ID

1. Open your new bot in Telegram and press **Start** (or send it "hi").
2. In a browser, open (with your token pasted in):
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789,...}`. That number is `TELEGRAM_CHAT_ID`.

**Want alerts in a group** (e.g. you and a helper)? Add the bot to the group, send a message in the group, and use the group's chat ID from the same page. Group IDs start with `-`.

Messages only ever go to this one chat ID. Customers can't trigger messages to anyone else.

## 3. Add the variables

In **Vercel → Project → Settings → Environment Variables**, add:

```
TELEGRAM_BOT_TOKEN=7123456789:AAH...
TELEGRAM_CHAT_ID=123456789
```

Then **redeploy** (Deployments → ⋯ → Redeploy). The token stays on the server and is never sent to browsers.

Make sure `NEXT_PUBLIC_SITE_URL` is your public `https://` address. Telegram only accepts public links, so the **View Order** button is left out until it is.

## 4. Test it

Dashboard → **Notifications → Send Test Notification**. You should get a message within seconds.

Then place a test order on the website. The alert looks like:

```
🍩 NEW JORDI ORDER

Order: #JP-000105
Customer: Ahmed
Phone: +20 10 1234 5678

Products:
• 2 × Chocolate Donut
• 1 × Box of 6: 3× Glazed, 3× Pistachio Cream

Total: EGP 350

Payment: InstaPay
Payment Status: Pending Payment
Delivery: Zone A, 12 Street, Building 4
[📋 View Order]  [💬 WhatsApp Customer]
```

## If something goes wrong

- An order is **always saved**, even if Telegram is down or not set up yet.
- Failed messages show on **Notifications** (with the error) and as a badge in the menu. Tap **Retry** or **Retry all**.
- "Unauthorized" means the token is wrong. "chat not found" means the chat ID is wrong, or you never pressed **Start** in the bot.
- Each order sends each alert once, so retries never duplicate a message that already went through.

/* WISE Game — Episode content: Devon, "Make It Through the Month"
   WISE Dimension 1 • Unit 1 • Lesson 1.1 (Introduction to Budgeting)
   Canonical numbers locked in WISE_Game_World_Bible_v1_0.md §21 — do not change
   without updating the source-of-truth doc. Everything else here (event
   amounts, dialogue, character voice) is original game-design content. */

window.WISE_CONTENT = window.WISE_CONTENT || {};

/* Spend against a named budget (groceries/fun) first; anything over that
   budget spills into flexible cash — realistic "went over the plan"
   behavior instead of a second, disconnected deduction. */
function wiseSpend(s, category, amount) {
  var have = s.budgets[category] || 0;
  var fromBudget = Math.min(have, amount);
  s.budgets[category] = have - fromBudget;
  s.balance -= (amount - fromBudget);
}

window.WISE_CONTENT["devon-1"] = {
  meta: {
    id: "devon-1",
    character: "Devon",
    title: "Make It Through the Month",
    hook: "You got paid. Rent is coming. And the month has other plans.",
    wiseConnection: "WISE Dimension 1 • Unit 1 • Lesson 1.1",
    skills: [
      "Budgeting",
      "Income",
      "Fixed vs. variable expenses",
      "Pay Yourself First",
      "Recovering from a shortfall"
    ],
    estimatedTime: "8–12 minutes",
    discussionPrompts: [
      "Which strategy did you pick — pay yourself first, or pay bills first? What changed because of that choice?",
      "When the unexpected cost showed up, what did you decide — and what did it cost you?",
      "If you played this again, what would you do differently, and why?"
    ]
  },

  income: 950,
  fixed: { rent: 300, phone: 50 },
  savingsGoal: 100,

  planningPresets: {
    "pay-yourself-first": { groceries: 250, fun: 100 },
    "bills-first": { groceries: 250, fun: 150 }
  },

  scenes: {

    intro: {
      type: "story",
      day: 1,
      heading: "Payday.",
      body: [
        "📱 iKandy Bank: Deposit posted — $950.00",
        "Devon shares a two-bedroom apartment with a roommate, works part-time, and has been saving up for a laptop for school. Rent is due in three days."
      ],
      choices: [
        { id: "start-plan", label: "See the month ahead", next: "planning" }
      ]
    },

    planning: {
      type: "planning",
      day: 1,
      heading: "Plan the month",
      intro: "Rent ($300) and the phone bill ($50) are already spoken for. That leaves $600 for everything else — including the $100 Devon wants to put toward the laptop.",
      next: "event-groceries"
    },

    "event-groceries": {
      type: "story",
      day: 5,
      heading: "Day 5 — the fridge is empty",
      body: ["📱 Roommate: “we are OUT of everything 😩 groceries tonight?”"],
      choices: [
        {
          id: "stock-up", label: "Stock up properly", sublabel: "−$70 — a full cart, less to worry about later",
          effects: function (s) { wiseSpend(s, "groceries", 70); s.flags.groceryStock = "full"; },
          next: "event-social"
        },
        {
          id: "basics", label: "Grab the basics", sublabel: "−$45 — covers the week, nothing extra",
          effects: function (s) { wiseSpend(s, "groceries", 45); s.flags.groceryStock = "basic"; },
          next: "event-social"
        },
        {
          id: "defer", label: "Order takeout tonight, shop later", sublabel: "−$25 now",
          effects: function (s) { wiseSpend(s, "groceries", 25); s.flags.deferredGroceries = true; },
          next: "event-groceries-again"
        }
      ]
    },

    "event-groceries-again": {
      type: "story",
      day: 8,
      heading: "Day 8 — still nothing in the fridge",
      body: ["The takeout habit caught up. The kitchen is still empty, and it’s time to actually shop."],
      choices: [
        {
          id: "shop-properly", label: "Shop properly this time", sublabel: "−$35",
          effects: function (s) { wiseSpend(s, "groceries", 35); },
          next: "event-social"
        },
        {
          id: "more-takeout", label: "Order takeout again", sublabel: "−$50 — roommate is not thrilled",
          effects: function (s) { wiseSpend(s, "groceries", 50); s.flags.roommateAnnoyed = true; },
          next: "event-social"
        }
      ]
    },

    "event-social": {
      type: "story",
      day: 12,
      heading: "Day 12 — Marcus is playing a show",
      body: ["📱 Marcus: “small set downtown tonight, $15 cover + food, you in?”"],
      choices: [
        {
          id: "go-full", label: "Go all in", sublabel: "−$40 total",
          effects: function (s) { wiseSpend(s, "fun", 40); s.flags.wentOut = true; },
          next: "event-price-change"
        },
        {
          id: "skip", label: "Skip this one", sublabel: "$0 — save it",
          effects: function () {},
          next: "event-price-change"
        },
        {
          id: "go-cheap", label: "Go, but keep it cheap", sublabel: "−$15 — eat at home first",
          effects: function (s) { wiseSpend(s, "fun", 15); s.flags.wentOutCheap = true; },
          next: "event-price-change"
        }
      ]
    },

    "event-price-change": {
      type: "story",
      day: 16,
      heading: "Day 16 — a notice from the carrier",
      body: ["📱 Carrier: “Your plan price is increasing $8/mo next cycle — switch to Basic Data today to keep your rate.”"],
      choices: [
        {
          id: "switch-plan", label: "Switch to Basic Data", sublabel: "Keeps the bill at $50 — slower data",
          effects: function (s) { s.flags.planSwitched = true; },
          next: function (s) { return s.replayVariant === "B" ? "event-unexpected-b" : "event-unexpected-a"; }
        },
        {
          id: "keep-plan", label: "Keep the current plan", sublabel: "−$8 this cycle",
          effects: function (s) { s.balance -= 8; },
          next: function (s) { return s.replayVariant === "B" ? "event-unexpected-b" : "event-unexpected-a"; }
        }
      ]
    },

    "event-unexpected-a": {
      type: "story",
      day: 22,
      heading: "Day 22 — your roommate needs a favor",
      body: ["📱 Roommate: “ugh I totally forgot to save for the internet bill this month… any chance you could cover $45? I’ll pay you back next paycheck, promise.”"],
      choices: [
        {
          id: "cover-full", label: "Cover the full $45", sublabel: "Takes it off your plate — and off theirs",
          effects: function (s) { s.balance -= 45; s.flags.coveredRoommate = true; },
          next: "day28-savings"
        },
        {
          id: "cover-half", label: "Cover half now", sublabel: "−$25 now, the rest is on them",
          effects: function (s) { s.balance -= 25; s.flags.partialCover = true; },
          next: "day28-savings"
        },
        {
          id: "extra-shift", label: "Pick up an extra shift, then cover it", sublabel: "+$60 from work, −$45 to roommate — skips movie night with Marcus",
          effects: function (s) { s.balance += 60; s.balance -= 45; s.flags.pickedExtraShift = true; },
          next: "day28-savings"
        },
        {
          id: "decline", label: "Say no this time", sublabel: "$0 — keeps your cash, but it’s awkward",
          effects: function (s) { s.flags.declinedRoommate = true; },
          next: "day28-savings"
        }
      ]
    },

    "event-unexpected-b": {
      type: "story",
      day: 22,
      heading: "Day 22 — the bus pass expired",
      body: ["📱 Transit App: “Your monthly pass has expired. A new pass is $55. You’re scheduled for three shifts this week.”"],
      choices: [
        {
          id: "buy-pass", label: "Buy the new pass", sublabel: "−$55 now, gets you to every shift",
          effects: function (s) { s.balance -= 55; s.flags.boughtPass = true; },
          next: "day28-savings"
        },
        {
          id: "borrow-rides", label: "Borrow rides this week", sublabel: "$0 now — buy the pass on the next payday",
          effects: function (s) { s.flags.borrowedRides = true; },
          next: "day28-savings"
        },
        {
          id: "extra-shift-b", label: "Pick up an extra shift, then buy it", sublabel: "+$60 from work, −$55 for the pass",
          effects: function (s) { s.balance += 60; s.balance -= 55; s.flags.pickedExtraShift = true; },
          next: "day28-savings"
        }
      ]
    },

    "day28-savings": {
      type: "auto",
      day: 28,
      resolve: function (s) {
        s.balance += (s.budgets.groceries || 0) + (s.budgets.fun || 0);
        s.budgets.groceries = 0;
        s.budgets.fun = 0;
        if (s.strategy === "bills-first") {
          var transfer = Math.max(0, Math.min(s.savingsGoalAmount, s.balance));
          s.balance -= transfer;
          s.laptopSaved += transfer;
          s.history.push({
            day: 28,
            label: "Automatic savings transfer",
            note: transfer === s.savingsGoalAmount
              ? "Moved the full $" + transfer + " to savings."
              : "Only $" + transfer + " was left to move — the goal fell short this month."
          });
        } else {
          s.history.push({
            day: 28,
            label: "Savings check-in",
            note: "The $" + s.savingsGoalAmount + " set aside on day 1 was never touched."
          });
        }
      },
      next: "day30-outcome"
    },

    "day30-outcome": { type: "outcome", day: 30 }
  }
};

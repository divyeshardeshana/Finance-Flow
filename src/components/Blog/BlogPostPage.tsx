import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import SEOHead from '../SEO/SEOHead';
import { sanitizeHtml } from '../../lib/sanitize';
import { gtm } from '../../lib/gtm';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  published_at: string;
  tags: string[];
  view_count: number;
  blog_categories: BlogCategory;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string;
  published_at: string;
  blog_categories: BlogCategory;
}

interface BlogPostPageProps {
  slug: string;
  onBack: () => void;
  onPostClick?: (slug: string) => void;
  onNavigate?: (view: PublicView) => void;
  onSignIn?: () => void;
}

const STATIC_RELATED: RelatedPost[] = [
  {
    id: '5',
    title: 'The 50/30/20 Rule: A Simple Framework for Financial Planning',
    slug: '50-30-20-rule-guide',
    excerpt: 'Understand how splitting your income into needs, wants, and savings can simplify your entire financial life and help you reach major milestones faster.',
    featured_image_url: 'https://images.pexels.com/photos/7567529/pexels-photo-7567529.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-22T09:00:00Z',
    blog_categories: { id: 'financial-planning', name: 'Financial Planning', slug: 'financial-planning', color: '#F59E0B' },
  },
  {
    id: '6',
    title: 'Emergency Fund Essentials: How Much Is Enough?',
    slug: 'emergency-fund-guide',
    excerpt: 'Building an emergency fund is the single most impactful thing you can do for your financial security. Find out exactly how much you need and the fastest way to get there.',
    featured_image_url: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-17T09:00:00Z',
    blog_categories: { id: 'saving-money', name: 'Saving Money', slug: 'saving-money', color: '#10B981' },
  },
  {
    id: '4',
    title: 'How to Start Investing with Just $100 a Month',
    slug: 'start-investing-100-month',
    excerpt: 'You do not need a large portfolio to start building wealth through investments. Learn how index funds, fractional shares, and dollar-cost averaging can work for you.',
    featured_image_url: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-28T09:00:00Z',
    blog_categories: { id: 'investing', name: 'Investing', slug: 'investing', color: '#3B82F6' },
  },
];

const STATIC_POSTS_MAP: Record<string, BlogPost> = {
  'personal-finance-101': {
    id: '1',
    title: 'Personal Finance 101: Build Wealth Even on a Small Income',
    slug: 'personal-finance-101',
    excerpt: 'Discover the fundamental principles that allow anyone, regardless of income level, to steadily build wealth, eliminate bad debt, and create a lasting financial foundation.',
    featured_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-03-10T09:00:00Z',
    tags: ['budgeting', 'wealth', 'personal finance', 'beginners'],
    view_count: 0,
    blog_categories: { id: 'personal-finance', name: 'Personal Finance', slug: 'personal-finance', color: '#3B82F6' },
    content: `## Introduction

Personal finance is the foundation upon which every financial goal rests. Whether you want to retire early, buy a home, travel the world, or simply stop living paycheck to paycheck, the path begins with understanding how money flows in and out of your life.

The good news? **You don't need a high income to build wealth.** Wealth is built through habits, consistency, and smart decision-making - not through earning a windfall. Many people with average salaries have accumulated significant net worth simply by following a set of proven principles.

This guide breaks down those principles in plain, actionable language so you can start making meaningful progress today.

## Understanding Personal Finance

Personal finance refers to the management of your own financial resources - including income, spending, saving, investing, and planning for the future. It encompasses every financial decision you make, from the coffee you buy each morning to the retirement account you contribute to each month.

At its core, personal finance answers three fundamental questions:

1. How much money is coming in?
2. Where is that money going?
3. How can you keep more of it and make it grow?

Most people never formally answer these questions, which is why so many struggle financially despite earning reasonable incomes. The first step toward financial health is awareness.

## Money Management Skills

Strong money management doesn't happen overnight - it's a collection of skills developed over time. Below are the four most critical areas to master.

### Budgeting

A budget is your financial blueprint. It tells your money where to go instead of wondering where it went. The most effective budgets are realistic, flexible, and reviewed regularly.

Start by listing all sources of income after tax. Then categorize your expenses into fixed costs (rent, car payment, insurance) and variable costs (groceries, dining, entertainment). The goal is to ensure your income exceeds your expenses - and that the surplus is directed intentionally.

**Popular budgeting methods include:**

- The 50/30/20 rule: 50% to needs, 30% to wants, 20% to savings and debt
- Zero-based budgeting: assign every dollar a job so your income minus expenses equals zero
- Envelope method: allocate physical or digital envelopes for each spending category

### Saving

Saving money is about building your capacity to handle both opportunity and emergency. Financial experts recommend maintaining at least three to six months of living expenses in an accessible savings account.

Beyond the emergency fund, saving should be automated. Set up an automatic transfer to your savings account on the day you receive your paycheck. Remove the temptation to spend first and save what's left - instead, save first and spend what remains.

**Key saving principles:**

- Pay yourself first: automate your savings before you spend
- Keep your emergency fund in a high-yield savings account
- Separate your savings goals into distinct accounts (emergency, vacation, home purchase)
- Avoid lifestyle inflation as your income grows

### Investing

Saving keeps your money safe. Investing makes your money grow. Over long time horizons, investing is the most powerful tool available for building wealth - primarily due to the compounding of returns.

Even small amounts invested consistently can grow into substantial sums over decades. A $200 monthly investment earning an average 8% annual return grows to over $700,000 in 40 years.

**Core investing principles for beginners:**

- Start as early as possible - time is your greatest asset
- Take advantage of employer 401(k) matching - it's free money
- Diversify through low-cost index funds and ETFs
- Invest consistently regardless of market conditions (dollar-cost averaging)
- Keep fees low - even a 1% difference in fees can cost tens of thousands over time

### Reducing Expenses

Cutting unnecessary expenses doesn't mean living like a monk. It means making deliberate choices about what truly adds value to your life versus what drains your resources without much return.

Conduct a monthly audit of your subscriptions, habits, and recurring charges. Cancel services you don't use. Negotiate bills like car insurance, internet, and phone plans. Cook at home more often. These changes, while individually small, accumulate to hundreds or thousands of dollars per year.

## Financial Planning for Beginners

Financial planning is the process of setting goals and creating a roadmap to achieve them. It encompasses everything from this month's budget to your 30-year retirement strategy.

Here is a step-by-step framework to get started:

1. Set clear financial goals
2. Create a monthly budget that supports those goals
3. Build a fully funded emergency fund of 3–6 months of expenses
4. Eliminate high-interest debt, starting with credit cards
5. Start investing in tax-advantaged accounts (401k, IRA, Roth IRA)
6. Increase income through career advancement, side income, or skills development
7. Protect your assets with appropriate insurance coverage
8. Review and adjust your financial plan at least once per year

The order matters. Trying to invest aggressively while carrying high-interest debt, for example, is mathematically counterproductive. Follow the sequence, and progress compounds naturally.

## Conclusion

Building wealth on any income is a realistic goal - but it requires intention, patience, and the willingness to delay gratification in the short term for long-term gain.

The principles outlined in this guide are not secrets. They are the same fundamentals practiced by virtually every financially successful person: spend less than you earn, save consistently, invest early, and plan deliberately.

**The best time to start was ten years ago. The second best time is today.**

Open a budgeting app. Review your last month of spending. Set one financial goal. The first step is always the hardest - but it sets everything else in motion.`,
  },

  'debt-management-plan': {
    id: '2',
    title: 'Debt Management Made Easy: Step-by-Step Plan to Become Debt Free',
    slug: 'debt-management-plan',
    excerpt: 'A clear, actionable roadmap for tackling every kind of debt - from credit cards to student loans - using proven payoff strategies like the avalanche and snowball methods.',
    featured_image_url: 'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-03-07T09:00:00Z',
    tags: ['debt', 'freedom', 'payoff', 'credit cards'],
    view_count: 0,
    blog_categories: { id: 'debt-management', name: 'Debt Management', slug: 'debt-management', color: '#EF4444' },
    content: `## Introduction

Debt is one of the most significant obstacles standing between most people and financial freedom. Whether it's credit card balances, student loans, medical bills, or a car payment, carrying debt costs you money every single month - money that could otherwise be building your future.

The good news is that getting out of debt is entirely achievable. It requires a clear plan, consistent execution, and the psychological fortitude to stay the course. This guide gives you exactly that.

## Understanding Your Debt

Before you can pay off debt, you need to know exactly what you're dealing with. Many people avoid looking at their full debt picture because it feels overwhelming. But clarity is power.

Create a complete inventory of every debt you owe:

1. Creditor name and account type
2. Current outstanding balance
3. Interest rate (APR)
4. Minimum monthly payment
5. Payoff timeline at minimum payments

This exercise is often a wake-up call. Seeing the total interest you'll pay over time - often two to three times the original balance on credit cards - is a powerful motivator to accelerate repayment.

## The Two Core Payoff Strategies

There are two widely used strategies for paying off multiple debts simultaneously. Each has genuine advantages depending on your personality and financial situation.

### The Debt Avalanche Method

The avalanche method prioritizes debts by interest rate, paying off the highest-rate debt first while making minimum payments on all others. Once the highest-rate debt is cleared, you redirect that payment to the next highest-rate debt, creating a cascading effect.

**Why it works:** The avalanche method minimizes the total interest you pay over the life of your debt. It is mathematically the most efficient approach.

**Best for:** People who are motivated by numbers and long-term optimization rather than quick wins.

### The Debt Snowball Method

The snowball method, popularized by financial author Dave Ramsey, prioritizes debts by balance size - smallest to largest - regardless of interest rate. You put all extra money toward the smallest debt first, then roll that payment into the next smallest once it's paid off.

**Why it works:** Paying off a debt completely, even a small one, creates a tangible psychological win. This momentum keeps many people motivated through the longer journey.

**Best for:** People who struggle with motivation and need early wins to maintain momentum.

## Practical Steps to Become Debt Free

Choosing a strategy is only step one. Here is the complete execution plan:

1. List all debts in your chosen order (avalanche or snowball)
2. Find extra money in your budget - cut discretionary spending ruthlessly
3. Apply all extra money to your target debt every month without exception
4. Do not accumulate new debt during the payoff period
5. Celebrate each payoff milestone - it matters for motivation
6. Roll the freed-up payment into the next debt immediately
7. Keep going until every debt is eliminated

## Negotiating With Creditors

Many people don't realize that creditors are often willing to negotiate - especially if you're behind on payments or at risk of default.

**What you can negotiate:**

- Lower interest rates, particularly on credit cards (a simple phone call works surprisingly often)
- Hardship programs that temporarily reduce or defer payments
- Settlement offers for less than the full balance on older delinquent accounts
- Removal of late fees and penalties

If you have multiple accounts in collections, consider consulting a nonprofit credit counseling agency. They can negotiate on your behalf and set up a debt management plan with reduced rates across all enrolled accounts.

## Avoiding Common Debt Traps

Getting out of debt is only half the battle. Staying out requires understanding why people fall back into debt:

- **Lifestyle inflation:** As income rises, spending rises proportionally, leaving no room for savings or debt payoff
- **Minimum payment mentality:** Paying only minimums on credit cards can keep you in debt for a decade or more
- **Emergency unpreparedness:** Without an emergency fund, any unexpected expense goes back on a credit card
- **Emotional spending:** Stress, boredom, and social pressure drive significant unplanned purchases

## Conclusion

Becoming debt free is one of the most transformative financial achievements possible. It eliminates the mental weight of owing money, reduces monthly obligations, and frees up cash flow for building wealth.

**Pick your strategy, build your list, and make your first extra payment this month.** The path is simple, even if it isn't always easy. Every payment brings you closer to the financial freedom you're working toward.`,
  },

  'practical-budgeting-tips': {
    id: '3',
    title: '10 Practical Budgeting Tips to Take Control of Your Money',
    slug: 'practical-budgeting-tips',
    excerpt: 'Ten proven tactics that help you cut unnecessary spending, automate your savings, and make your budget work for you - not the other way around.',
    featured_image_url: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-03-04T09:00:00Z',
    tags: ['budgeting', 'savings', 'money management'],
    view_count: 0,
    blog_categories: { id: 'saving-money', name: 'Saving Money', slug: 'saving-money', color: '#10B981' },
    content: `## Introduction

A budget is not a restriction - it's permission. Permission to spend on the things that matter most, with the confidence that your essential needs and future goals are already covered. The problem is that most people find budgeting tedious, complicated, or simply ineffective.

These ten tips cut through the noise and give you practical, field-tested tactics that actually work.

## 1. Track Every Dollar for One Month Before Budgeting

Before you can build a realistic budget, you need data. Spend one full month tracking every single purchase - coffee, groceries, subscriptions, impulse buys - without changing your behavior. This baseline reveals exactly where your money is going and exposes spending patterns you never knew existed.

Most people are genuinely surprised. Common discoveries include hundreds of dollars in forgotten subscriptions, food and dining costs two to three times higher than estimated, and convenience spending that adds up to significant monthly totals.

## 2. Use the 50/30/20 Rule as Your Starting Framework

If you're new to budgeting, the 50/30/20 rule is the most accessible framework available. Allocate 50% of your after-tax income to needs (housing, food, utilities, transportation), 30% to wants (dining out, entertainment, hobbies), and 20% to savings and debt repayment.

This isn't a rigid formula, but it gives you a starting structure. Adjust the percentages based on your cost of living, financial goals, and debt obligations.

## 3. Automate Your Savings Before You Spend

The single most effective budgeting habit is paying yourself first. Set up an automatic transfer to your savings account on payday - before you have a chance to spend the money. Start with whatever amount feels manageable, even $25 or $50.

:: Automating savings removes the decision entirely. You never see the money, so you never miss it.

## 4. Create Separate Accounts for Separate Goals

Mixing all your savings into one account makes it easy to raid your emergency fund for a vacation or dip into your down payment savings for an impulse purchase. Open separate savings accounts for each goal: emergency fund, vacation, home purchase, car replacement.

Many online banks offer free multiple savings accounts with no minimums. Giving each account a specific name and purpose makes your goals tangible and harder to abandon.

## 5. Review Subscriptions Every Three Months

The average household pays for 4 to 5 streaming services, software subscriptions, gym memberships, and app fees - many of which go largely unused. Set a quarterly calendar reminder to audit every recurring charge on your bank and credit card statements.

Cancel anything you haven't used in the past 30 days. Negotiate or switch providers on services you want to keep. This exercise routinely saves $50 to $150 per month for most households.

## 6. Implement a 48-Hour Rule for Non-Essential Purchases

Impulse purchases are one of the biggest budget killers. Before buying anything that isn't a planned expense and costs more than $30, wait 48 hours. Add the item to a wish list instead of your cart.

Most impulse desires fade entirely within 48 hours. If you still want the item after two days, you can make a deliberate choice to buy it. This simple rule alone can save hundreds of dollars per month.

## 7. Budget by Paycheck, Not by Month

If you're paid bi-weekly, a monthly budget can feel disconnected from reality. Try zero-based budgeting by paycheck instead - assign every dollar of each paycheck to a specific category before you spend a cent. This keeps you tightly connected to your finances throughout the month rather than discovering problems at month-end.

## 8. Build a Buffer Category Into Your Budget

Every budget needs a "miscellaneous" or "buffer" category - typically $50 to $150 per month - to absorb small unexpected expenses without derailing the entire plan. Car registration, a dental co-pay, a birthday gift: these aren't true emergencies, but they're also not predictable line items.

Without a buffer, every minor surprise requires raiding another budget category, which leads to frustration and budget abandonment.

## 9. Make Dining Out a Conscious Choice

Dining and food delivery is consistently the top area of overspending in most budgets. Rather than eliminating restaurants entirely, make it a deliberate, planned category. Set a monthly limit, track it actively, and treat dining out as a leisure activity you're choosing to prioritize - not a default habit.

Meal planning for four to five weeknights per week while allowing one or two intentional restaurant meals is a sustainable balance most people can maintain long-term.

## 10. Review Your Budget at the Same Time Every Month

A budget only works if you actually look at it. Set a recurring monthly date - the first Sunday of each month is a popular choice - to review the previous month's spending, identify where you went over or under, and adjust the following month's budget accordingly.

This review session doesn't need to take more than 15 to 20 minutes. Over time, it becomes a powerful ritual that keeps your financial life on track.

## Conclusion

Budgeting is not about perfection. It's about progress and awareness. Each of these ten habits, applied consistently, compounds over time into a dramatically healthier financial life.

**Start with one or two of these tips this week.** Track your spending. Automate one savings transfer. Cancel one unused subscription. Small actions, repeated consistently, create lasting change.`,
  },

  'start-investing-100-month': {
    id: '4',
    title: 'How to Start Investing with Just $100 a Month',
    slug: 'start-investing-100-month',
    excerpt: 'You do not need a large portfolio to start building wealth through investments. Learn how index funds, fractional shares, and dollar-cost averaging can work for you from day one.',
    featured_image_url: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-02-28T09:00:00Z',
    tags: ['investing', 'beginners', 'index funds', 'ETF'],
    view_count: 0,
    blog_categories: { id: 'investing', name: 'Investing', slug: 'investing', color: '#8B5CF6' },
    content: `## Introduction

One of the most persistent myths about investing is that you need a large sum of money to get started. In reality, the most powerful force in investing - compound interest - works just as well with $100 as it does with $100,000. The key variable isn't how much you start with. It's how early you start and how consistently you continue.

This guide shows you exactly how to begin investing with $100 per month, what to invest in, and how to build a strategy that grows significantly over time.

## Why $100 a Month Is More Powerful Than You Think

Let's look at the math. If you invest $100 per month starting at age 25, earning an average annual return of 8%, you will have approximately $349,000 by age 65. That's from $48,000 in total contributions.

Start the same investment at age 35 instead, and you end up with roughly $150,000 - less than half, despite only a 10-year difference in start time. **Time is the most valuable input in the investing equation.**

The earlier you start, the less money you actually need to contribute to reach the same outcome.

## Step 1: Open the Right Account First

Before choosing what to invest in, choose where to invest. Account type matters enormously because of tax treatment.

### Tax-Advantaged Accounts (Start Here)

- **401(k) or 403(b):** If your employer offers a retirement plan with matching contributions, this is your first priority. Employer matching is an immediate 50–100% return on your contribution - nothing else comes close.
- **Roth IRA:** Contributions are made with after-tax dollars, but all future growth and withdrawals are completely tax-free. Ideal for anyone who expects to be in a higher tax bracket in retirement. Contribution limit is $7,000 per year (2024).
- **Traditional IRA:** Contributions may be tax-deductible, and growth is tax-deferred until withdrawal. Useful if you expect a lower tax bracket in retirement.

### Taxable Brokerage Account

Once you've maximized tax-advantaged accounts, a standard brokerage account offers complete flexibility - no contribution limits, no withdrawal restrictions, no penalties. Growth is subject to capital gains tax, but this is manageable with the right investment choices.

## Step 2: Choose Your Investments

For most beginning investors, three types of investments make up the ideal simple portfolio:

### Total Market Index Funds

A total market index fund holds a tiny slice of every publicly traded company in the US. It's instant diversification across thousands of companies with a single purchase. Look for funds tracking the CRSP US Total Market Index or similar broad benchmarks.

**Why they work:** Low fees (often 0.03–0.05%), automatic diversification, and historically strong long-term returns that mirror overall market performance.

### S&P 500 Index Funds

These funds track the 500 largest US companies. They're slightly less diversified than total market funds but extremely battle-tested and widely available in most retirement plans.

### International Index Funds

Adding exposure to international markets - Europe, Asia, emerging markets - provides additional diversification. A simple allocation is 80% US total market, 20% international total market.

## Step 3: Use Dollar-Cost Averaging

Dollar-cost averaging means investing the same fixed amount on the same schedule, regardless of what the market is doing. When markets are up, your $100 buys fewer shares. When markets are down, it buys more.

Over time, this approach results in an average cost per share that is lower than the average price per share - a mathematically provable advantage over trying to time the market.

**Practical setup:** Automate a $100 transfer to your investment account on the same day each month. Most brokerages allow automatic recurring investments into specific funds.

## Step 4: Keep Fees as Low as Possible

Investment fees are silent wealth destroyers. A fund with a 1% annual expense ratio versus a 0.05% ratio seems like a minor difference, but over 30 years on a $100/month investment, that fee difference can cost over $50,000.

Always check the expense ratio before investing in any fund. Anything above 0.20% for an index fund is too high. Target 0.10% or lower.

## Step 5: Never Stop During Market Downturns

The single biggest mistake new investors make is stopping contributions - or selling - when markets decline. Market downturns are not disasters for long-term investors. They are sales.

When the market drops 20%, your $100 monthly investment buys 25% more shares than it did at the previous price. Those extra shares compound for decades. Investors who stayed the course during every major downturn - 2008, 2020, and others - experienced dramatically better outcomes than those who sold.

## Conclusion

Investing $100 per month is not a compromise or a placeholder until you can "really" invest. It is a legitimate, powerful wealth-building strategy that, if started early and maintained consistently, produces life-changing results.

**Open an account this week. Set up one automatic investment. Then leave it alone and let time do the heavy lifting.**

The best investment portfolio is one you can maintain - simple, low-cost, and consistent for decades.`,
  },

  '50-30-20-rule-guide': {
    id: '5',
    title: 'The 50/30/20 Rule: A Simple Framework for Financial Planning',
    slug: '50-30-20-rule-guide',
    excerpt: 'Understand how splitting your income into needs, wants, and savings can simplify your entire financial life and help you reach major milestones faster.',
    featured_image_url: 'https://images.pexels.com/photos/7567529/pexels-photo-7567529.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-02-22T09:00:00Z',
    tags: ['planning', 'budgeting', '50/30/20', 'framework'],
    view_count: 0,
    blog_categories: { id: 'financial-planning', name: 'Financial Planning', slug: 'financial-planning', color: '#F59E0B' },
    content: `## Introduction

Financial planning doesn't need to be complicated. While there are dozens of budgeting methods, most people do best with a simple, memorable framework they can actually apply. The 50/30/20 rule - popularized by U.S. Senator and bankruptcy expert Elizabeth Warren in her book *All Your Worth* - is exactly that: a clean, intuitive system for allocating your income that works across a wide range of financial situations.

## What the Rule Says

The 50/30/20 rule divides your after-tax income into three categories:

- **50% to Needs:** Essential expenses you cannot reasonably avoid
- **30% to Wants:** Discretionary spending that improves your quality of life
- **20% to Savings and Debt Repayment:** Building financial security and reducing obligations

That's it. Three numbers that, applied consistently, create a financially healthy life.

## The 50% - Needs

Needs are expenses that are truly non-negotiable. If you didn't pay them, serious consequences would follow. This category includes:

- Housing (rent or mortgage, property taxes, renter's insurance)
- Utilities (electricity, water, gas, internet)
- Groceries and essential household supplies
- Transportation (car payment, insurance, gas, public transit)
- Minimum debt payments (credit cards, student loans, personal loans)
- Health insurance and essential medical care

**The 50% ceiling is a discipline check.** If your needs consume more than half your income, you have a structural problem - likely housing or transportation costs - that needs to be addressed before other financial goals are achievable.

Common adjustments include moving to a less expensive area, getting a roommate, downsizing a car, or pursuing income growth.

## The 30% - Wants

Wants are the choices that add enjoyment and meaning to your life but could be reduced without genuine hardship. This is the most subjective category:

- Dining out and food delivery
- Streaming services, subscriptions, and entertainment
- Travel and vacations
- Clothing and accessories beyond the basics
- Gym memberships and hobbies
- Upgrades (a nicer car than necessary, a larger apartment)

The 30% allocation for wants is notably generous. It recognizes that a financially healthy life should still be an enjoyable one. **The goal is not deprivation - it's intentionality.**

If you're spending significantly more than 30% on wants, you're likely trading future security for present comfort. If you're spending significantly less, you have additional room to accelerate your savings and debt payoff.

## The 20% - Savings and Debt Repayment

This is the most powerful category - the one that actually builds your future. The 20% is split across:

### Emergency Fund

Before anything else, build three to six months of essential expenses in a liquid savings account. This is your financial immune system. Without it, every unexpected expense becomes a debt.

### Retirement Contributions

Contribute at minimum enough to capture any employer 401(k) match. Beyond that, maximize Roth IRA contributions if eligible, then continue building 401(k) contributions.

### Debt Repayment Above Minimums

Minimum payments on debt belong in the Needs category. Any extra payment - the actual debt-elimination effort - comes from the 20%.

### Additional Goals

Once debt is managed and retirement is funded, this category expands to include a home down payment, children's education, or any other major financial milestone.

## Adapting the Rule to Your Situation

The 50/30/20 rule is a framework, not a law. High-cost-of-living cities may push your housing costs above 30% alone, forcing a different breakdown. High earners may find 30% for wants far more than they want to spend. Recent graduates with heavy student loan debt may need to allocate more aggressively to the 20% bucket.

**The principle that matters:** Always know how much is going to needs, wants, and future. The specific percentages flex; the awareness doesn't.

## Putting It Into Practice

1. Calculate your monthly after-tax income
2. Multiply by 0.50, 0.30, and 0.20 to find your target allocations
3. Compare against your actual current spending from last month
4. Identify the largest gaps
5. Make one or two targeted adjustments to move closer to the targets
6. Automate your savings allocation on payday

## Conclusion

The 50/30/20 rule works because it's simple enough to remember and flexible enough to apply to almost any income level. It doesn't eliminate financial complexity entirely, but it gives you a reliable compass for every spending decision.

**If you don't have a budget today, start with the 50/30/20 rule.** Calculate your three numbers. See where you stand. Then make one change. Simplicity, consistently applied, beats complexity that gets abandoned.`,
  },

  'emergency-fund-guide': {
    id: '6',
    title: 'Emergency Fund Essentials: How Much Is Enough?',
    slug: 'emergency-fund-guide',
    excerpt: 'Building an emergency fund is the single most impactful thing you can do for your financial security. Find out exactly how much you need and the fastest way to get there.',
    featured_image_url: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-02-17T09:00:00Z',
    tags: ['emergency', 'savings', 'financial security'],
    view_count: 0,
    blog_categories: { id: 'saving-money', name: 'Saving Money', slug: 'saving-money', color: '#10B981' },
    content: `## Introduction

An emergency fund is the single most important financial safety net you can build. It stands between you and a financial crisis when life does what it inevitably does: surprise you. A job loss, a medical bill, a car breakdown, a roof repair - without an emergency fund, each of these events forces you into debt. With one, they become manageable inconveniences.

Despite its importance, surveys consistently show that a significant portion of adults cannot cover an unexpected $400 expense without borrowing. Building an emergency fund is the first, most foundational step in any serious financial plan.

## How Much Do You Actually Need?

The standard recommendation is three to six months of essential living expenses. But the right number for you depends on several factors:

### Lean Toward Three Months If:

- You have a highly stable job with low layoff risk
- You have a dual-income household
- You have excellent job marketability and could find work quickly
- You have no dependents
- You have flexible expenses that could be reduced significantly in a crisis

### Lean Toward Six Months (or More) If:

- You are self-employed or have variable income
- You work in a volatile or seasonal industry
- You are the sole income earner for your household
- You have significant health expenses or chronic conditions
- You support dependents (children, aging parents)
- You have a specialized skill set with a longer job search timeline

### Calculating Your Number

Add up only your essential monthly expenses - housing, utilities, groceries, insurance, transportation, and minimum debt payments. Do not include wants. Multiply by 3 or 6 depending on the factors above.

If your essential expenses are $2,500 per month, your target emergency fund is $7,500 to $15,000.

## Where to Keep Your Emergency Fund

Your emergency fund has two requirements: it must be **accessible** (available within a day or two) and **separate** from your everyday checking account (so you don't accidentally spend it).

**High-yield savings accounts (HYSA)** are the ideal home for emergency funds. They offer:

- FDIC insurance up to $250,000
- Easy transfers to your checking account within 1–2 business days
- Interest rates significantly higher than traditional savings accounts
- No market risk - your balance doesn't fluctuate

Do not invest your emergency fund in stocks, bonds, or any market-linked account. The entire point is stability and guaranteed availability. The marginal return you might earn in the market is not worth the risk of needing the funds during a market downturn when your balance might be 20% lower.

## How to Build It Faster

### Make It Automatic

Set up a recurring transfer from your checking account to your emergency savings account on payday - even $50 or $100 per month. Automation removes willpower from the equation entirely.

### Direct Windfalls Here First

Tax refunds, work bonuses, birthday money, and any other lump sums should go directly to your emergency fund until it's fully funded. A single tax refund can often cover several months of contributions.

### Temporarily Increase Income

Consider picking up overtime, a weekend side gig, or selling unused items around your home. Even a short-term income boost of $300 to $500 per month, directed entirely to savings, can fully fund an emergency fund within a few months.

### Temporarily Cut One Major Expense

Reducing dining out, pausing a subscription, or finding a lower insurance rate can free up $100 to $300 per month. Direct that entire amount to savings until the fund is complete.

## What Counts as an Emergency?

A fully funded emergency fund only stays functional if you use it correctly. Not everything unexpected qualifies as an emergency.

**Genuine emergencies:**
- Job loss or significant income reduction
- Medical or dental expenses not covered by insurance
- Critical car repairs needed to maintain transportation to work
- Essential home repairs (broken furnace in winter, roof leak)

**Not emergencies:**
- Planned expenses you failed to plan for (annual insurance renewal, holiday gifts)
- A sale on something you want
- Travel or entertainment
- Predictable irregular expenses (these belong in a sinking fund)

## Replenishing After Use

If you draw from your emergency fund, replenishing it becomes your top financial priority before resuming any other savings or investment goals. Treat the replenishment exactly like building it the first time: automate a transfer and redirect any windfalls until the balance is restored.

## Conclusion

An emergency fund transforms your relationship with financial risk. Instead of dreading unexpected expenses, you face them from a position of strength. That peace of mind - the ability to handle life's surprises without panic - is genuinely priceless.

**Calculate your target number today. Open a high-yield savings account if you don't have one. Set up your first automatic transfer.** Three to six months from now, you'll have one of the most important financial foundations in place.`,
  },

  'credit-score-improvement': {
    id: '7',
    title: 'Understanding Your Credit Score and How to Improve It Fast',
    slug: 'credit-score-improvement',
    excerpt: 'Your credit score affects everything from loan rates to apartment approvals. Learn which factors matter most and the exact steps to raise your score by 50–100 points.',
    featured_image_url: 'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-02-11T09:00:00Z',
    tags: ['credit', 'score', 'loans', 'FICO'],
    view_count: 0,
    blog_categories: { id: 'personal-finance', name: 'Personal Finance', slug: 'personal-finance', color: '#3B82F6' },
    content: `## Introduction

Your credit score is one of the most consequential numbers in your financial life, yet most people have only a vague understanding of what drives it. A score of 760 versus 660 can mean the difference between qualifying for a mortgage and being denied, between a 6% and an 8% interest rate, between paying $200,000 and $250,000 for the same loan over its lifetime.

Understanding your credit score and the levers that control it gives you the power to improve it deliberately and quickly.

## How Credit Scores Work

The most widely used credit scoring model is FICO, which scores on a scale from 300 to 850. Scores break down into five ranges:

- **800–850: Exceptional** - Qualifies for the best rates on any loan
- **740–799: Very Good** - Qualifies for near-best rates
- **670–739: Good** - Qualifies for most loans at standard rates
- **580–669: Fair** - May face higher rates or require larger down payments
- **Below 580: Poor** - Limited access to credit; high rates when approved

Your FICO score is calculated from five factors, each weighted differently:

1. **Payment history (35%)** - Whether you pay on time, every time
2. **Credit utilization (30%)** - How much of your available credit you're using
3. **Length of credit history (15%)** - How long your accounts have been open
4. **Credit mix (10%)** - Variety of account types (credit cards, loans, mortgage)
5. **New credit (10%)** - Recent applications for new credit

## The Fastest Ways to Improve Your Score

### 1. Pay Every Bill On Time (Payment History: 35%)

A single missed payment can drop a good credit score by 50 to 100 points. Set up automatic minimum payments on every account to ensure you're never late - even if you pay the full balance manually afterward.

If you have past late payments, the impact diminishes over time. Recent payment history carries more weight than older history. Consistent on-time payments for 12 to 24 months significantly offset previous missed payments.

### 2. Reduce Your Credit Utilization (Credit Utilization: 30%)

Credit utilization is the ratio of your current credit card balances to your total credit limits. If your combined credit limit is $10,000 and your current balances total $3,500, your utilization is 35%.

**Aim for under 30% total utilization, and under 10% for the fastest improvement.**

Strategies to reduce utilization:
- Pay balances down before the statement closing date (not the due date)
- Request credit limit increases on existing cards (without increasing spending)
- Spread balances across multiple cards rather than maxing one
- Make multiple payments per month to keep the running balance lower

### 3. Don't Close Old Accounts

Closing a credit card account reduces your total available credit, which immediately raises your utilization ratio. It also shortens your average credit history over time.

Keep old accounts open, even if you rarely use them. If a card has an annual fee you want to avoid, ask the issuer to downgrade it to a no-fee version of the same card.

### 4. Limit Hard Inquiries

When you apply for new credit - a credit card, car loan, mortgage - the lender pulls a hard inquiry that temporarily reduces your score by 5 to 10 points. Multiple inquiries in a short period amplify the effect.

Avoid applying for new credit in the 3 to 6 months before you need a major loan (mortgage, car loan). When shopping for auto or mortgage rates, do all applications within a 14-day window - credit bureaus count multiple mortgage or auto inquiries in a short period as a single inquiry.

### 5. Dispute Errors on Your Credit Report

One in five credit reports contains an error significant enough to affect the score. Errors can include:
- Accounts that don't belong to you (identity theft or mix-up)
- Incorrect late payment records
- Duplicate accounts
- Incorrect balances or credit limits

Get your free credit reports from all three bureaus (Equifax, Experian, TransUnion) at AnnualCreditReport.com. Dispute any errors directly with the bureau online. Errors are often resolved within 30 days and can produce immediate score improvements.

## Timeline for Score Improvement

- **Immediate (0–30 days):** Pay down credit card balances, dispute errors
- **Short-term (1–3 months):** Consistently on-time payments begin showing impact, utilization ratios update
- **Medium-term (6–12 months):** 50–100 point improvements are realistic with consistent action
- **Long-term (2+ years):** Damaged credit from late payments or collections significantly rebuilds

## Conclusion

Your credit score is not fixed. It is a dynamic number that responds - sometimes quickly - to deliberate actions. The two highest-impact moves are always the same: **pay every bill on time** and **keep your credit utilization below 30%.**

Start there. Check your credit report for errors. Keep old accounts open. Over 6 to 12 months of consistent financial behavior, most people can meaningfully improve their score and gain access to significantly better rates and terms.`,
  },

  'retirement-planning-30s': {
    id: '8',
    title: 'Retirement Planning in Your 30s: Start Early, Retire Rich',
    slug: 'retirement-planning-30s',
    excerpt: 'Compound interest is your greatest ally. A comprehensive guide to maximizing your 401(k), opening a Roth IRA, and building a retirement nest egg that actually lasts.',
    featured_image_url: 'https://images.pexels.com/photos/8297031/pexels-photo-8297031.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-02-05T09:00:00Z',
    tags: ['retirement', 'planning', '401k', 'Roth IRA'],
    view_count: 0,
    blog_categories: { id: 'financial-planning', name: 'Financial Planning', slug: 'financial-planning', color: '#F59E0B' },
    content: `## Introduction

Your 30s are the decade where retirement planning transforms from a distant concept into a concrete priority. You likely have meaningful income for the first time, perhaps a stable career trajectory, and - critically - 30 or more years of compound growth ahead of you.

The decisions you make in your 30s about retirement savings will matter more than almost anything you do in your 40s and 50s. This guide shows you exactly what to do, in what order, and why the math is so compelling.

## Why Your 30s Are the Critical Window

Compound interest is the mechanism by which money grows on top of previous growth. The longer it has to compound, the more dramatic the results.

Consider two people:

- **Alex** starts investing $500/month at age 30 and continues until age 65 (35 years)
- **Jordan** waits until age 40 and invests $1,000/month until age 65 (25 years)

At an 8% average annual return:
- Alex ends with approximately **$1.03 million** from $210,000 in contributions
- Jordan ends with approximately **$950,000** from $300,000 in contributions

Alex invested less money and ended up with more - purely because of the extra 10 years of compound growth. **Time is the most valuable input in retirement planning, and you still have it.**

## Step 1: Capture Every Dollar of Employer Matching

If your employer offers a 401(k) match, contributing enough to capture the full match is the single highest-return investment available to you - anywhere. A 100% match on the first 3% of salary is literally a 100% instant return on those dollars before any market gains.

This is your first priority before any other investment or savings goal except your emergency fund.

## Step 2: Build and Maximize Your Roth IRA

After capturing your full employer match, the next priority for most people in their 30s is a Roth IRA.

**Why Roth over Traditional in your 30s:**

- Contributions are made with after-tax dollars, but all growth and withdrawals in retirement are completely tax-free
- Your 30s are typically your lower-earning years compared to peak career income - paying taxes now at lower rates to avoid taxes later at higher rates is mathematically favorable
- Roth IRAs have no required minimum distributions (RMDs), giving you complete control over withdrawals in retirement
- Contributions (not earnings) can be withdrawn at any time without penalty, providing a secondary emergency backstop

The 2024 contribution limit is $7,000 per year ($583/month). If you can't max it immediately, start with whatever you can and increase contributions with every raise.

## Step 3: Maximize Your 401(k)

Once you're capturing the full employer match and contributing to a Roth IRA, the next step is maximizing your 401(k) contributions. The 2024 contribution limit is $23,000.

Maxing both a Roth IRA ($7,000) and a 401(k) ($23,000) requires $30,000 per year in retirement contributions - $2,500 per month. This isn't achievable for everyone in their 30s, but it represents the ideal target to work toward.

**Work toward it incrementally:** increase your 401(k) contribution percentage by 1% each year, or every time you receive a raise. You won't miss money you never had in your paycheck.

## Investment Strategy Inside Your Retirement Accounts

With 30+ years until retirement, you can afford - and should embrace - an aggressive equity-heavy allocation:

- **Ages 30–40:** 90–100% stocks (index funds), 0–10% bonds
- **Ages 40–50:** 80–90% stocks, 10–20% bonds
- **Ages 50–60:** 70% stocks, 30% bonds

**Recommended simple portfolio:**
- 60% US total market index fund
- 30% international total market index fund
- 10% US bond index fund

Adjust toward bonds as you age to reduce volatility as retirement approaches. Most target-date retirement funds do this automatically - they're a completely acceptable hands-off option.

## How Much Should You Have Saved?

A common benchmark, popularized by Fidelity Investments:

- By age 30: 1x your annual salary saved
- By age 35: 2x your annual salary
- By age 40: 3x your annual salary
- By age 45: 4x your annual salary
- By age 50: 6x your annual salary

If you're behind these benchmarks, don't despair - increase your savings rate aggressively, reduce lifestyle inflation, and let time continue working for you.

## The 4% Rule: How Much Is "Enough"?

The 4% rule, derived from the Trinity Study, states that a retiree can withdraw 4% of their portfolio annually and have a very high probability of not running out of money over a 30-year retirement.

To find your retirement number: **multiply your desired annual retirement income by 25.**

If you want $60,000/year in retirement income: $60,000 × 25 = **$1,500,000 target portfolio.**

## Conclusion

Retirement planning in your 30s is not about sacrifice - it's about capturing the extraordinary power of time and compound interest before it slips away. The habits you build now, the accounts you open, the automatic contributions you set up, create a foundation that grows for three decades before you need it.

**If you do nothing else this week, increase your 401(k) contribution by 1% and open a Roth IRA if you don't already have one.** Your future self will thank you in ways that are genuinely difficult to overstate.`,
  },

  'index-funds-vs-etfs': {
    id: '9',
    title: 'Index Funds vs. ETFs: Which One Should You Choose?',
    slug: 'index-funds-vs-etfs',
    excerpt: 'Both offer low-cost, diversified exposure to the market - but subtle differences in structure, tax efficiency, and trading flexibility matter. Here is what to know before you invest.',
    featured_image_url: 'https://images.pexels.com/photos/6801874/pexels-photo-6801874.jpeg?auto=compress&cs=tinysrgb&w=1200',
    published_at: '2026-01-30T09:00:00Z',
    tags: ['investing', 'ETF', 'index funds', 'portfolio'],
    view_count: 0,
    blog_categories: { id: 'investing', name: 'Investing', slug: 'investing', color: '#8B5CF6' },
    content: `## Introduction

If you've started exploring low-cost investing, you've almost certainly encountered both index funds and ETFs (Exchange-Traded Funds). Both are championed by financial experts, both track market indexes, and both offer dramatically lower fees than actively managed funds. So what's actually different between them - and which one should you choose?

The answer, like most things in personal finance, depends on your specific situation. This guide breaks down everything you need to know to make an informed decision.

## What They Have in Common

Before diving into differences, it's worth recognizing the very significant overlap:

- **Both track indexes:** Both index mutual funds and index ETFs are designed to replicate the performance of a specific market index (S&P 500, total market, international markets, etc.)
- **Both offer instant diversification:** A single fund gives you exposure to hundreds or thousands of companies
- **Both have low expense ratios:** Compared to actively managed funds (typical expense ratio: 0.5–1.5%), index funds and ETFs often charge 0.03–0.20%
- **Both outperform most active managers:** Decades of data show that low-cost index investing beats the majority of actively managed strategies over long time horizons

If you invest in a total market index ETF or a total market index mutual fund from the same provider (say, Vanguard), your returns will be virtually identical. **The differences are structural, not performance-based.**

## The Key Differences

### How They Trade

This is the most fundamental structural difference:

**ETFs** trade throughout the day on stock exchanges, just like individual stocks. You can buy or sell an ETF at 10:17 AM or 3:42 PM at whatever price it's trading at that moment.

**Index mutual funds** only trade once per day, at the closing price (NAV - Net Asset Value) after markets close. If you submit a buy order at 10:17 AM, it executes at 4:00 PM at that day's closing price.

For long-term investors, this distinction rarely matters. Intraday trading flexibility is primarily relevant for traders, not buy-and-hold investors.

### Minimum Investment

**ETFs** typically have no minimum investment beyond the price of a single share. With fractional shares now available through most major brokerages, you can invest as little as $1.

**Index mutual funds** often have minimum investments, commonly $1,000 to $3,000 for Admiral Shares at Vanguard, though many brokerages now offer their own index mutual funds with no minimums (Fidelity's ZERO funds, for example).

### Tax Efficiency

**ETFs** have a structural advantage in taxable brokerage accounts due to the "in-kind creation and redemption" mechanism. This process allows large institutional investors to exchange ETF shares for the underlying stocks without triggering a taxable event. As a result, ETFs rarely distribute capital gains to shareholders.

**Index mutual funds** can distribute capital gains to all shareholders when the fund manager must sell securities to meet redemptions - even if you personally didn't sell anything. In tax-advantaged accounts (401k, IRA), this distinction is irrelevant. In a taxable brokerage account, ETFs generally have a meaningful tax efficiency advantage.

### Automatic Investment and Dividend Reinvestment

**Index mutual funds** often allow fully automatic periodic investing (e.g., invest $200 on the 15th of every month) and automatic dividend reinvestment with exact dollar amounts. This is seamlessly integrated into most brokerage platforms.

**ETFs** require slightly more manual management for automatic investing in many platforms, though this gap is closing. Dividend reinvestment with ETFs sometimes results in fractional shares or a small cash balance depending on the platform.

## Which Should You Choose?

### Choose an ETF If:

- You're investing in a **taxable brokerage account** and want maximum tax efficiency
- You want to invest with **very small amounts** (under $1,000) through fractional shares
- You prefer flexibility to **trade throughout the day** (though rarely necessary for long-term investors)
- You want access to **specific narrow market segments** (sector ETFs, international, bonds)

### Choose an Index Mutual Fund If:

- You're investing inside a **401(k)** where ETF trading may not be available and mutual funds are the norm
- You want **fully automated investing** with exact dollar amounts on a set schedule
- You value the **simplicity of automatic dividend reinvestment** without tracking fractional shares
- You prefer **not to think about share prices** and simply invest a dollar amount

### The Bottom Line

For most long-term investors in tax-advantaged accounts (IRA, 401k), the choice between index ETFs and index mutual funds is largely irrelevant. Pick the one your brokerage makes easiest to use with the lowest expense ratio.

For taxable brokerage accounts, ETFs have a genuine tax efficiency edge worth considering.

## Recommended Options to Consider

**For broad US market exposure:**
- Vanguard Total Stock Market ETF (VTI) - expense ratio 0.03%
- Fidelity ZERO Total Market Index Fund (FZROX) - expense ratio 0.00%
- Schwab Total Stock Market Index Fund (SWTSX) - expense ratio 0.03%

**For S&P 500 exposure:**
- SPDR S&P 500 ETF Trust (SPY) - expense ratio 0.0945%
- iShares Core S&P 500 ETF (IVV) - expense ratio 0.03%
- Vanguard 500 Index Fund Admiral Shares (VFIAX) - expense ratio 0.04%

## Conclusion

The index fund versus ETF debate is ultimately less important than the decision to index-invest in the first place. Both vehicles, chosen from low-cost providers, will deliver market returns at minimal cost - and that combination beats the majority of professional fund managers over any 10+ year period.

**Pick the option that makes automatic, consistent investing easiest for you - then ignore the day-to-day fluctuations and let time compound your returns.**`,
  },
};

function useScrollInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return { ref, isInView };
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

type ContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; html: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; html: string }
  | { type: 'blockquote'; html: string };

function parseContent(text: string): ContentBlock[] {
  const lines = text.split('\n');
  const blocks: ContentBlock[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      blocks.push({ type: listType, items: [...listItems] });
      listItems = [];
      listType = null;
    }
  };

  const formatInline = (line: string) =>
    line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: line.replace('## ', '') });
    } else if (line.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'h3', text: line.replace('### ', '') });
    } else if (line.startsWith('> ')) {
      flushList();
      blocks.push({ type: 'blockquote', html: formatInline(line.replace('> ', '')) });
    } else if (line.startsWith(':: ')) {
      flushList();
      blocks.push({ type: 'callout', html: formatInline(line.replace(':: ', '')) });
    } else if (line.match(/^[-*] /)) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(line.replace(/^[-*] /, ''));
    } else if (line.match(/^\d+\. /)) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(line.replace(/^\d+\. /, ''));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      blocks.push({ type: 'p', html: formatInline(line) });
    }
  }
  flushList();
  return blocks;
}

function ArticleContent({ content }: { content: string }) {
  const blocks = parseContent(content);

  return (
    <div className="article-body">
      {blocks.map((block, i) => {
        if (block.type === 'h2') {
          return (
            <h2
              key={i}
              className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-5 leading-tight tracking-tight"
            >
              <span className="flex-shrink-0 w-1 h-8 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
              {block.text}
            </h2>
          );
        }
        if (block.type === 'h3') {
          return (
            <h3
              key={i}
              className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3 leading-snug"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={i}
              className="my-7 pl-5 border-l-4 border-blue-500/60 dark:border-blue-400/60 italic text-gray-600 dark:text-gray-300 text-lg leading-relaxed bg-blue-50/50 dark:bg-blue-500/[0.06] py-4 pr-4 rounded-r-xl"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
            />
          );
        }
        if (block.type === 'callout') {
          return (
            <div
              key={i}
              className="my-7 px-5 py-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/[0.08] dark:to-cyan-500/[0.06] border border-blue-200/70 dark:border-blue-500/20 text-blue-800 dark:text-blue-200 text-sm leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
            />
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="my-5 space-y-2.5 pl-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 leading-relaxed text-[17px]">
                  <span className="flex-shrink-0 mt-[6px] w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatItemInline(item)) }} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="my-5 space-y-2.5 pl-0 counter-reset-list">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 leading-relaxed text-[17px]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatItemInline(item)) }} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p
            key={i}
            className="text-[17px] text-gray-600 dark:text-gray-300 leading-[1.85] mb-5"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
          />
        );
      })}
    </div>
  );
}

function formatItemInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default function BlogPostPage({ slug, onBack, onPostClick, onNavigate, onSignIn }: BlogPostPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);


  const navigate = (view: PublicView) => {
    if (onNavigate) onNavigate(view);
    else onBack();
  };

  const handlePostClick = (postSlug: string) => {
    if (onPostClick) onPostClick(postSlug);
    else onBack();
  };

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (data) {
        setPost(data);
        gtm.blogPostRead(data.title, data.slug, data.blog_categories?.name ?? '');
        supabase.rpc('increment_blog_view_count', { post_id: data.id });

        const { data: related } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, featured_image_url, published_at, blog_categories(*)')
          .eq('status', 'published')
          .neq('id', data.id)
          .limit(3);

        setRelatedPosts((related && related.length > 0) ? related : STATIC_RELATED.filter(p => p.slug !== slug));
      } else {
        const staticPost = STATIC_POSTS_MAP[slug] ?? null;
        if (staticPost) gtm.blogPostRead(staticPost.title, staticPost.slug, staticPost.blog_categories?.name ?? '');
        setPost(staticPost);
        setRelatedPosts(STATIC_RELATED.filter(p => p.slug !== slug));
      }
    } catch {
      const staticPost = STATIC_POSTS_MAP[slug] ?? null;
      setPost(staticPost);
      setRelatedPosts(STATIC_RELATED.filter(p => p.slug !== slug));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
        <PublicNavbar currentView="blog" onNavigate={navigate} onSignIn={onSignIn || onBack} />
        <div className="h-[55vh] bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
        <div className="max-w-[740px] mx-auto px-6 py-12 space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-4 bg-gray-100 dark:bg-white/[0.05] rounded" style={{ width: `${70 + i * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
        <PublicNavbar currentView="blog" onNavigate={navigate} onSignIn={onSignIn || onBack} />
        <div className="max-w-[740px] mx-auto px-6 pt-32 pb-12 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={22} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Post not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const readTime = estimateReadTime(post.content || '');
  const publishDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featured_image_url,
    "datePublished": post.published_at,
    "author": { "@type": "Organization", "name": "FinanceFlow" },
    "publisher": { "@type": "Organization", "name": "FinanceFlow" },
    "keywords": post.tags?.join(', '),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
      <SEOHead
        overrides={{
          meta_title: `${post.title} | FinanceFlow Blog`,
          meta_description: post.excerpt,
          meta_keywords: post.tags?.join(', '),
          og_title: post.title,
          og_description: post.excerpt,
          og_image_url: post.featured_image_url,
          twitter_title: post.title,
          twitter_description: post.excerpt,
          twitter_image_url: post.featured_image_url,
          is_indexable: true,
          structured_data: blogStructuredData,
        }}
      />
      <PublicNavbar currentView="blog" onNavigate={navigate} onSignIn={onSignIn || onBack} />

      {/* ── FULL-WIDTH HERO IMAGE ─────────────────────────────────────────── */}
      <div className="relative w-full h-[62vh] min-h-[420px] max-h-[640px] overflow-hidden">
        {/* Image */}
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-[#0B0F1A]" />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Back button - top left */}
        <div className="absolute top-0 left-0 right-0 pt-20 px-6 max-w-[900px] mx-auto w-full">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors group backdrop-blur-sm bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Blog
          </motion.button>
        </div>

        {/* Title area - bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 max-w-[900px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {post.blog_categories && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white mb-4 shadow-lg"
                style={{ backgroundColor: post.blog_categories.color }}
              >
                {post.blog_categories.name}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-white mb-4 drop-shadow-lg">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              {publishDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {publishDate}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                {readTime} min read
              </div>
              {post.tags && post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-white/10 text-white/60 text-xs border border-white/10">
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── ARTICLE BODY ───────────────────────────────────────────────────── */}
      <div className="max-w-[740px] mx-auto px-6 py-12">
        {post.excerpt && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-10 pb-10 border-b border-gray-100 dark:border-white/[0.07] font-medium"
          >
            {post.excerpt}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {post.content ? (
            <ArticleContent content={post.content} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic text-base">No content available.</p>
          )}
        </motion.div>

        {/* Tags footer */}
        {post.tags && post.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 pt-8 border-t border-gray-100 dark:border-white/[0.07] flex flex-wrap gap-2"
          >
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] text-gray-500 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── RELATED ARTICLES ───────────────────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.06] py-16 px-6">
          <div className="max-w-[900px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Continue Reading
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Related{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
                  articles
                </span>
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {relatedPosts.map((related, i) => (
                <motion.article
                  key={related.id}
                  variants={fadeUp}
                  custom={i * 0.5}
                  onClick={() => handlePostClick(related.slug)}
                  className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  {related.featured_image_url && (
                    <div className="h-44 overflow-hidden bg-gray-100 dark:bg-white/[0.05]">
                      <img
                        src={related.featured_image_url}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {related.blog_categories && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-3"
                        style={{ backgroundColor: related.blog_categories.color }}
                      >
                        {related.blog_categories.name}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h3>
                    {related.published_at && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-3">
                        <Calendar size={11} />
                        {new Date(related.published_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: '2-digit',
                        })}
                      </div>
                    )}
                    {related.excerpt && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed line-clamp-2 mb-4">
                        {related.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all duration-200">
                      Read more
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <PublicFooter onNavigate={navigate} />
    </div>
  );
}

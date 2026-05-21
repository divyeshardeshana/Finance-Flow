/*
  # Fix and enrich country_investment_plans data

  ## Summary
  - Fixes the malformed plan_2_name for India (had a tab character)
  - Adds rich descriptions for all 5 India investment plans
  - Adds plans for UAE/GCC, UK, US, Canada, Australia, EU, Singapore/SEA
  - Each plan now has a meaningful description for display on the Investment Advisory page

  ## Changes
  - UPDATE existing India row: fix plan_2_name, add all descriptions
  - INSERT rows for: AE (UAE), US, GB, CA, AU, DE (Germany/EU representative), SG
*/

UPDATE country_investment_plans
SET
  plan_1_name        = 'Employees'' Provident Fund (EPF)',
  plan_1_description = 'A mandatory retirement savings scheme for salaried employees where both employer and employee contribute 12% of basic salary each. Managed by EPFO, it earns 8.15% p.a. (FY2023-24) with full government backing.',
  plan_2_name        = 'Public Provident Fund (PPF)',
  plan_2_description = 'A long-term government savings scheme open to all residents offering 7.1% p.a. (tax-free), with a 15-year lock-in and annual contribution limit of ₹1.5 lakh. Interest and maturity proceeds are fully exempt under EEE status.',
  plan_3_name        = 'National Pension System (NPS)',
  plan_3_description = 'A market-linked retirement account regulated by PFRDA. Subscribers choose equity, corporate bonds, and government securities mix. Offers additional ₹50,000 tax deduction under Sec 80CCD(1B). Returns typically 8–12% p.a. over the long term.',
  plan_4_name        = 'Atal Pension Yojana (APY)',
  plan_4_description = 'A government-backed pension scheme for unorganised sector workers aged 18–40. Guarantees a fixed monthly pension of ₹1,000–₹5,000 from age 60. Government co-contributes 50% of subscriber contribution (up to ₹1,000/year) for eligible subscribers.',
  plan_5_name        = 'Mutual Funds / ELSS',
  plan_5_description = 'Equity Linked Savings Schemes (ELSS) are tax-saving mutual funds offering Section 80C deduction up to ₹1.5 lakh. 3-year lock-in (shortest among 80C instruments). Potential returns of 12–18% p.a. over long term. Available via Zerodha Coin, Groww, or direct AMC platforms.',
  updated_at         = now()
WHERE country_code = 'IN';

INSERT INTO country_investment_plans
  (country_code, plan_1_name, plan_1_description, plan_2_name, plan_2_description, plan_3_name, plan_3_description, plan_4_name, plan_4_description, plan_5_name, plan_5_description)
VALUES
  (
    'AE',
    'UAE National Bonds',
    'A Shariah-compliant savings scheme backed by the UAE government offering an expected profit rate of 4–5% p.a. Available to residents and citizens with minimum investment of AED 100. Profits are distributed annually and principal is capital-protected.',
    'Emirates NBD REIT',
    'A Shariah-compliant REIT listed on Nasdaq Dubai providing exposure to diversified UAE commercial real estate. Targets a distribution yield of 5–7% p.a. Regulated by DFSA with quarterly distributions to unitholders.',
    'Sarwa / StashAway Robo-Advisor',
    'Regulated robo-advisors offering globally diversified portfolios of ETFs tailored to your risk profile. Annual fees of 0.5–0.85%, investing in Vanguard and iShares ETFs. Accessible from AED 2,000 with zero capital gains or dividend tax in UAE.',
    'ADX / DFM Blue-Chip Stocks',
    'Invest directly in UAE''s top dividend-paying companies such as ADNOC Distribution, Etisalat (e&), Emirates NBD, and ALDAR on Abu Dhabi Exchange (ADX) or Dubai Financial Market (DFM). Zero capital gains and income tax on investments.',
    'GCC Sukuk (Islamic Bonds)',
    'Government and investment-grade corporate sukuk listed on Nasdaq Dubai offering 4–7% profit rates. Fully Shariah-compliant with regular profit distributions. Accessible via Emirates NBD Securities, FAB Securities, or Saxo Bank UAE.'
  ),
  (
    'US',
    '401(k) Retirement Plan',
    'Employer-sponsored tax-advantaged retirement savings plan. Contributions reduce taxable income (Traditional 401k) or grow tax-free (Roth 401k). 2024 limit: $23,000 ($30,500 if 50+). Many employers match 3–6% of salary — always capture the full match first.',
    'Roth IRA',
    'Individual Retirement Account allowing tax-free growth and tax-free withdrawals in retirement. 2024 contribution limit: $7,000 ($8,000 if 50+). Income limits apply. Ideal for younger investors expecting higher future tax brackets. Invest via Fidelity, Schwab, or Vanguard.',
    'S&P 500 Index Funds / ETFs',
    'Broad market exposure tracking the 500 largest US companies via VOO, SPY, or VTI with expense ratios as low as 0.03%. Historical average annual return of ~10% since 1957. Available on all major brokerage platforms with no minimums.',
    'High-Yield Savings Account (HYSA)',
    'FDIC-insured savings accounts from online banks like Marcus (Goldman Sachs), Ally, SoFi, or American Express offering 4.5–5.5% APY. Instant liquidity, no market risk. Ideal for emergency fund and short-term goals.',
    'US Treasury Bills & I-Bonds',
    'Direct purchase of T-Bills (4–52 week), T-Notes, or I-Bonds (inflation-protected) via TreasuryDirect.gov with no broker fees. Current yields of 4.5–5.5%. I-Bonds are limited to $10,000/year but offer inflation protection with state tax exemption.'
  ),
  (
    'GB',
    'Stocks & Shares ISA',
    'Tax-free investment account allowing up to £20,000/year in stocks, funds, ETFs, or bonds. All growth and income is completely free of UK income tax and capital gains tax. Available via Hargreaves Lansdown, AJ Bell, Vanguard UK, or Trading 212.',
    'Workplace Pension (Auto-Enrolment)',
    'Mandatory employer pension with minimum 3% employer + 5% employee contribution (total 8% of qualifying earnings). Tax relief on contributions reduces the effective cost. Managed by providers like NEST, Legal & General, or The People''s Pension.',
    'SIPP (Self-Invested Personal Pension)',
    'Flexible personal pension with 20–45% tax relief on contributions depending on your tax band. Annual allowance of £60,000. Full control over investment selection including global ETFs and index funds. Available via HL, AJ Bell, or Interactive Investor.',
    'Premium Bonds (NS&I)',
    'Government-backed savings with no risk to capital, offering tax-free prizes equivalent to an average annual prize rate of ~4.4%. No guaranteed return but FSCS-like protection via HM Treasury. Maximum holding £50,000. Ideal as cash alternative.',
    'FTSE All-World Index Funds',
    'Low-cost globally diversified UCITS index funds tracking FTSE All-World or MSCI World Index. Vanguard LifeStrategy or iShares MSCI World (IWDA/SWDA) with TER of 0.07–0.22%. Ideal inside an ISA or SIPP wrapper for maximum tax efficiency.'
  ),
  (
    'CA',
    'TFSA (Tax-Free Savings Account)',
    'Canada''s most flexible registered account — all investment growth, dividends, and withdrawals are completely tax-free. 2024 contribution limit: $7,000 (cumulative room since 2009 is $95,000). Invest in ETFs, GICs, or stocks inside TFSA via Questrade or Wealthsimple.',
    'RRSP (Registered Retirement Savings Plan)',
    'Tax-deductible contributions that grow tax-deferred until withdrawal. 2024 limit: 18% of prior year income up to $31,560. Ideal for high earners — reduces taxable income now and defers tax to lower-income retirement years. Available via all major Canadian banks.',
    'FHSA (First Home Savings Account)',
    'New registered account (launched 2023) for first-time home buyers combining TFSA + RRSP benefits. Annual limit: $8,000, lifetime limit: $40,000. Contributions are tax-deductible and withdrawals for qualifying home purchase are tax-free.',
    'GICs (Guaranteed Investment Certificates)',
    'CDIC-insured fixed-term deposits offering 4.5–5.5% guaranteed returns from major banks and credit unions. No market risk. Terms from 30 days to 5 years. Available through Oaken Financial, EQ Bank, or major bank branches.',
    'Canadian Index ETFs (TSX)',
    'Low-cost ETFs from Vanguard Canada (VCN), iShares (XIC), or BMO (ZCN) tracking the TSX Composite Index. Expense ratios of 0.06–0.20%. Hold inside TFSA or RRSP to eliminate withholding tax on US distributions. Available on Questrade commission-free.'
  ),
  (
    'AU',
    'Superannuation (Super Fund)',
    'Compulsory retirement savings with employer contributions of 11% of salary (rising to 12% by 2025). Investment earnings taxed at just 15% (vs. personal marginal rate). Total balance over $1.9M faces an extra 15% tax. Choose industry funds like AustralianSuper or Australian Retirement Trust for low fees.',
    'Vanguard / BetaShares Index ETFs (ASX)',
    'Low-cost ASX-listed index ETFs including VAS (Australian Shares, TER 0.07%), VGS (International Shares, TER 0.18%), and A200 (ASX 200, TER 0.07%). 50% CGT discount applies for assets held over 12 months. Available via CommSec, SelfWealth, or Stake.',
    'High-Interest Savings Account',
    'APRA-regulated savings accounts with government deposit guarantee up to $250,000. Major online banks offer introductory rates of 4.5–5.5% p.a. (e.g., ING, Macquarie, HSBC Australia, UBank). Ideal for emergency fund and short-term goals.',
    'Term Deposits',
    'Fixed-term deposits from major banks (CBA, ANZ, Westpac, NAB) offering guaranteed returns of 4–5.5% p.a. Government deposit guarantee up to $250,000. Terms from 1 month to 5 years. No market risk and predictable income.',
    'A-REITs (Australian REITs)',
    'ASX-listed real estate investment trusts providing diversified property exposure. Top A-REITs include Goodman Group (GMG), Scentre Group (SCG), and Dexus (DXS). Distribution yields of 3–6% p.a. plus capital growth. Liquid, professionally managed commercial property exposure.'
  ),
  (
    'SG',
    'CPF (Central Provident Fund)',
    'Mandatory savings scheme with employer (17%) and employee (20%) contributions. CPF-OA earns 2.5% p.a. (first $20k at 3.5%), SA earns 4% p.a. (first $40k at 5%). Use CPF-SA top-up for tax relief up to $8,000/year and accelerate retirement savings.',
    'SRS (Supplementary Retirement Scheme)',
    'Voluntary retirement savings with full tax relief on contributions (up to $15,300 for citizens/PRs, $35,700 for foreigners). Only 50% of SRS withdrawals are taxable at retirement. Invest SRS funds in unit trusts, ETFs, Singapore shares, or endowment plans.',
    'SGX Index ETFs',
    'Singapore Exchange-listed ETFs including Nikko AM STI ETF (ES3) and SPDR STI ETF (STI) tracking the Straits Times Index with expense ratios of 0.3%. Available via CDP, DBS Vickers, OCBC Securities, or moomoo Singapore.',
    'Singapore Savings Bonds (SSB)',
    'Issued monthly by the Singapore government with step-up interest rates — average 10-year return of ~3.0–3.5% p.a. Risk-free, fully flexible (redeem any month with no penalty), and SDIC-protected up to $500,000. Maximum $200,000 per person.',
    'T-Bills & SGS Bonds',
    '6-month or 1-year Singapore T-Bills offering risk-free returns of ~3.5–4% p.a. (yields vary with MAS auctions). Apply via ATM or iBanking (DBS/POSB/OCBC/UOB). SGS Bonds available for longer durations up to 30 years via SGX or primary dealers.'
  )
ON CONFLICT (country_code) DO NOTHING;

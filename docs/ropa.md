# Record of Processing Activities — GeoRoutes

**Last reviewed:** 22 August 2026
**Next review:** 22 August 2027, or on any change to what is collected

---

## Why this document exists

Article 30(5) UK GDPR exempts organisations with fewer than 250 staff from
keeping a ROPA, unless the processing is likely to risk people's rights, is not
occasional, or includes special category data. GeoRoutes is a sole trader, the
processing below is low-risk and none of it is special category, so **this
record is not legally required**.

It is kept anyway because it is the fastest possible answer to "what do you
hold about me", "what happens if you are breached" and the supplier
questionnaire a care provider will eventually send. It also makes it obvious
when something new has been added without being thought about.

## Controller

| | |
|---|---|
| **Name** | Matthew Hailey, trading as GeoRoutes |
| **Status** | Sole trader |
| **Contact** | support@georoutes.co.uk |
| **ICO registration** | *(insert reference once registered — £52, tier 1)* |
| **DPO** | Not required. No large-scale monitoring, no special category data at scale, not a public authority. |

## What GeoRoutes is *not* a processor of

Worth stating first, because it is the largest fact about this service.

Customers enter their clients' names, addresses and visit times into the
scheduler. **None of it reaches our servers.** It is held in the browser that
entered it (IndexedDB) and, if the customer chooses, in a file they save
themselves. We cannot read it, cannot recover it, and could not produce it if
compelled.

We are therefore not a processor of that data under Article 28, no data
processing agreement is required with customers for it, and it cannot appear in
a breach of our systems because it is not in them.

---

## 1. Customer accounts

| | |
|---|---|
| **Purpose** | Letting a customer sign in and hold a subscription |
| **Categories of data** | Email address, hashed password, subscription status, Stripe customer and subscription references |
| **Categories of people** | Customers — managers and owners of care, nursing and therapy services |
| **Lawful basis** | Article 6(1)(b), performance of a contract |
| **Recipients** | Supabase (authentication and database), Stripe (billing) |
| **Transfers outside the UK** | Supabase and Stripe operate internationally, under their own transfer safeguards |
| **Retention** | While the account is active, then deleted on request |
| **Security** | Passwords hashed by Supabase and never seen by us. Row-level security so an account can only read its own record. HTTPS with HSTS. |

## 2. Usage counts

| | |
|---|---|
| **Purpose** | Knowing whether the scheduler is working — how often it runs, how long it takes, how often it fails |
| **Categories of data** | Counts and durations only: number of staff, number of appointments, number of visits produced, milliseconds taken. Linked to the account that ran it. **No names, addresses or postcodes.** |
| **Categories of people** | Customers |
| **Lawful basis** | Article 6(1)(f), legitimate interests — keeping the service working. Low impact: nothing about the people being visited is recorded. |
| **Recipients** | Supabase |
| **Retention** | While useful for diagnosing problems |

## 3. Error reports

| | |
|---|---|
| **Purpose** | Finding and fixing crashes |
| **Categories of data** | Error message, stack trace, page address **with the fragment stripped before storage**, browser identification |
| **Categories of people** | Anyone using the site, signed in or not |
| **Lawful basis** | Article 6(1)(f), legitimate interests — fixing faults |
| **Recipients** | Supabase |
| **Retention** | While useful for diagnosing problems |
| **Note** | The fragment is removed deliberately. A shared round travels in it, so keeping it would import client data into a table that otherwise holds none. |

## 4. Website analytics

| | |
|---|---|
| **Purpose** | Counting visits and seeing which pages are read |
| **Categories of data** | Page views, approximate location, device and browser, an identifier if consent is given |
| **Categories of people** | Website visitors |
| **Lawful basis** | Consent — Article 6(1)(a), and PECR regulation 6 for the storage itself |
| **Recipients** | Google Analytics |
| **Transfers outside the UK** | Google, under its own transfer safeguards |
| **Retention** | Per Google Analytics settings |
| **Note** | Runs with storage denied until consent is given, and does not run at all on the page that displays a carer's round. |

## 5. Server and network logs

| | |
|---|---|
| **Purpose** | Serving the site, and blocking abuse |
| **Categories of data** | IP address, request time, page requested, user agent |
| **Categories of people** | Anyone who loads the site, including carers opening a round |
| **Lawful basis** | Article 6(1)(f), legitimate interests — security and delivery |
| **Recipients** | Cloudflare |
| **Retention** | Per Cloudflare's own retention |
| **Note** | The URL fragment is never transmitted by the browser, so a shared round cannot appear in these logs. |

## 6. Support correspondence

| | |
|---|---|
| **Purpose** | Answering questions |
| **Categories of data** | Whatever the sender includes — name, email, message |
| **Categories of people** | Anyone who emails support@georoutes.co.uk |
| **Lawful basis** | Article 6(1)(f), or 6(1)(b) where the sender is a customer |
| **Recipients** | Cloudflare Email Routing, then the destination mailbox |
| **Retention** | While relevant, then deleted |

## 7. Cached travel times — *not personal data*

Listed for completeness so nobody has to work out later whether it counts.

`route_cache` maps a pair of postcodes to a distance and a duration. It has **no
user column**, records nothing about who asked, and is deleted a month after a
pair was last used. It is the same class of fact that ONS publishes for every UK
postcode, and cannot be attributed to any person.

---

## Rights, and how they are met

| Right | How |
|---|---|
| Access | Email support. Account data is small and can be exported by hand. |
| Rectification | Account details are editable in the app. |
| Erasure | Account deletion on request. Scheduling data is deleted by the customer in their own browser — we have no copy to delete. |
| Portability | Settings exports the whole workspace to a JSON file the customer keeps. |
| Objection | Analytics can be declined, and reversed at any time from the footer. |

## Breach procedure

1. Establish what was reached. Client scheduling data cannot be involved — it is
   not held — so the realistic scope is account emails, error reports or logs.
2. Assess risk to the people affected.
3. If there is a risk to rights and freedoms, report to the ICO **within 72
   hours** of becoming aware.
4. If the risk is high, tell the affected people directly.
5. Write down what happened and what was done, whether or not it was reportable.

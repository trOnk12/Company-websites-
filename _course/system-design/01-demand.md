---
title: How much traffic arrives after a concert?
short: How much traffic arrives after a concert?
summary: Work out how many map requests to send in a test for the minutes after a concert.
takeaway: The daily total tells you how much work arrived in a day. To test a busy period, count how much arrived in that period and how long it lasted.
---

## The problem

In puzzle 0, Ada and Ben opened the parking map before trying to book. Each time a phone asks for the map, count one map request. Now imagine 120,000 drivers each send 10 of those requests during a day. The team tests by sending about 14 requests each second, its average for the day. After a concert, many people open the map at once. Will the test tell you how the service behaves then?

## See it

```diagram demand
```

## The building block

Start with the same 1,200,000 requests. Spread them across the 86,400 seconds in a day and you get about 14 requests per second. Now suppose the service’s records show that one fifth, or 240,000 requests, arrived in the ten minutes after the concert. Ten minutes is 600 seconds, so an even replay of that interval sends 240,000 ÷ 600 = 400 requests per second. That gives the team a first test for those minutes. If most of those requests arrived in the first minute, replaying their original arrival times gives a better test.

### How many requests are waiting for a reply?

A request is **in flight** from the moment it arrives until the service sends its reply, including time spent waiting for a turn. Suppose the test settles at 400 arrivals and 400 replies each second, with an average time of 0.15 seconds from arrival to reply. Little’s law gives the average number present: 400 per second × 0.15 seconds = 60 requests. The two measurements refer to the same part of the service, from arrival to reply.

The database connection is the channel the program uses to talk to the database. If every request holds one for just 0.010 seconds, the average number in use is 400 × 0.010 = 4. A brief rush may need more. Four is an observed average in this example, so measure how long requests wait for a connection before choosing a limit.

Now suppose only 350 requests finish each second while 400 arrive. If nothing is dropped, the service has 50 more unfinished requests after each second. Starting at zero, it ends the ten minutes with 30,000 unfinished requests. The earlier estimate of 60 belonged to a test where requests finished as fast as they arrived.

## Go deeper: What will storage cost in bytes?

Suppose the service saves 120,000 confirmed bookings per day. If each adds 800 bytes to the database, one day adds 96 million bytes. Keeping 365 days takes about 35 billion bytes for one copy or 105 billion for three copies, plus any space set aside for backups and future growth. To check the 800-byte estimate, load a known number of sample bookings into a test database and measure how much the files grow.

- What happens if the number of daily bookings doubles and you still keep 365 days?::One copy grows to about 70 billion bytes.

## Go deeper: Count requests from a short list of arrival times

The sample log contains eight arrival times, in seconds since the test started: 0, 10, 20, 20, 21, 22, 22, 29. A repeated time means two requests arrived in that second. Before looking at the code, tally the requests in seconds 0–9, 10–19 and 20–29. Which ten-second interval was busiest?

The first two statements build the input table. In the question below them, the column called second stores whole numbers. In SQLite, dividing those numbers by the whole number 10 drops the remainder. For 29, the result is 2. Multiplying back by 10 gives 20, the start of its interval. Read each name after the word “as” as a column heading in the answer.

`GROUP BY` places all requests with the same interval start together. The count expression with the star counts all rows for that interval. Dividing by 10.0 gives requests per second, including fractions. The last line shows earlier intervals first.

```sql run
CREATE TABLE arrival (second INTEGER);
INSERT INTO arrival VALUES
  (0), (10), (20), (20), (21), (22), (22), (29);

SELECT (second / 10) * 10 AS bucket_start,
       COUNT(*) AS arrivals,
       COUNT(*) / 10.0 AS requests_per_second
FROM arrival
GROUP BY bucket_start
ORDER BY bucket_start;
```

Run the code and compare the three counts with your tally: 1, 1 and 6. Change only the last arrival from 29 to 30. Predict the counts before running again. The last request now belongs to the interval starting at 30. The total remains eight.

## Try it

Shorten the peak to five minutes while keeping its total demand. Predict the arrival rate and work in flight before reading on. At the same mean duration the answers are 800 per second and 120 in flight. Measure arrivals, completions and queued work separately to check whether the duration actually holds.

## Check yourself

- Which interval belongs in the peak calculation?::86,400 seconds >> Use the duration of the burst. >> the-building-block||*600 seconds::Use the duration of the burst.
- The test settles at 400 replies per second with an average reply time of 0.15 seconds. How many requests are in flight on average?::*60||2667 >> Multiply the rate by the time. >> the-building-block::400 × 0.15 gives 60 requests.
- In one second, 400 requests arrive and 350 finish. None is dropped. How many are added to the unfinished work?::350 >> That is the number that finished. Subtract it from the arrivals. >> the-building-block||*50::The other 350 finished. The unfinished work grows by 50.

## Sources

- [Google SRE · Handling Overload](https://sre.google/sre-book/handling-overload/) — “Different queries can have vastly different resource requirements.”
- [SQLite · Expressions](https://www.sqlite.org/lang_expr.html)

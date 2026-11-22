---
title: Two drivers tap Reserve. Who gets the last space?
short: Who gets the last space?
summary: Separate what the map shows from what the app promises when it confirms.
takeaway: Two phones can show the same free space. At most one driver can have it booked for the same time.
---

## The problem

The lot has one space left for tonight, B12. At 19:00, Ada and Ben each open the app and see “1 space free.” Ada taps Reserve. Before Ben’s map updates, he taps Reserve too. Imagine both phones now say “B12 is yours.” What will happen when both drivers arrive?

A **reservation** is the service’s saved record that assigns a space to a driver for a particular time. Once Ada’s reservation is saved and the app confirms it, Ben can still be looking at the old map. His tap must get a refusal if Ada still holds the space.

## See it

```diagram promise
```

## The building block

Keep track of three things. The map tells you what was free when it last checked. A request is the message the phone sends when you tap Reserve. The saved booking tells you who actually has the space.

An **invariant** is a rule that must hold after each completed change. For B12 tonight, write it in one sentence: “B12 can have zero or one current booking.” Count a booking once the service has finished saving it. In this exercise every saved booking is for tonight and none has been cancelled.

Picture a ticket booth. Two people can see “1 ticket left” on a sign. The clerk checks who holds the seat before handing out a ticket. Once the clerk issues the last ticket, the sign can take a moment to catch up.

A timeout means the phone stopped waiting for a reply. If the service saved Ada’s booking just before the connection dropped, Ada still holds B12. We’ll reproduce that kind of lost reply in puzzle 2.

## Read the two bookings

The table shows a deliberately broken run. Start by reading one row. Ada, B12 means “Ada has B12 booked tonight.”

| Driver | Space |
| --- | --- |
| Ada | B12 |
| Ben | B12 |

Which row would you need to change so that Ada keeps B12 and Ben parks elsewhere? Think through that before opening the code. The reading exercise below checks saved records. The race lab under Try it runs two booking attempts in your browser.

## Go deeper: Read the booking table with SQL

**SQL** is a language for reading and changing records in a database. Here the database is a temporary copy of that two-row table. The browser starts with a fresh copy on every run.

Read the setup first. The first line creates a table named bookings with two columns, driver and space. Both store text. The next two lines put one row in the table for each driver. Quotes mark text values such as 'Ada'.

```sql run
CREATE TABLE bookings (driver TEXT, space TEXT);
INSERT INTO bookings VALUES ('Ada', 'B12');
INSERT INTO bookings VALUES ('Ben', 'B12');

SELECT driver
FROM bookings
WHERE space = 'B12';
```

Read the last three lines together. **FROM** names the table to read. **WHERE** checks each row and keeps it if space equals B12. The line that starts with select tells the database to show the driver column from the rows it kept.

Press Run SQL. The answer contains two rows, Ada and Ben. The reservation rule allows one. Choose Edit SQL and change only Ben’s space from B12 to B13 in the line that adds his booking. Predict which name appears when you run it again. This second run uses a different example input where B13 was available too. Ada is now the only driver the query finds for B12.

## Try it

Open the race and set Available spaces to 1. Run it with Ada first and record who gets the space. Change First request to Ben. Before running again, predict who will get the space and how many bookings will exist. Then set Available spaces to 2. This version counts two interchangeable spaces. Predict how many drivers receive a booking and check the result.

[Run the two-phone race](https://pachulski.dev/labs/parking-design/#race)

## Check yourself

- Ben’s map still shows B12 free after Ada gets it. Which observation proves a double booking?::Ada and Ben both asked for B12 tonight >> A request can be refused. Find the saved bookings. >> the-building-block||*Ada and Ben both hold B12 tonight::Both drivers hold the same space for the same time.
- Ada books B12 tonight. Ben books B12 tomorrow. Do these bookings break tonight’s rule?::*No, they cover different times||Yes, B12 appears twice >> Check the time as well as the space. >> the-building-block::Tonight’s rule covers bookings that overlap tonight.
- Ada’s phone stops waiting a moment after she taps Reserve. Which conclusion can she draw?::*Her booking may have been saved||The service must have refused her >> The missing reply leaves the result unknown to the phone. >> the-building-block::The phone needs another way to find out what the service saved.

## Sources

- [SQLite · SELECT](https://www.sqlite.org/lang_select.html) — “Only rows for which the WHERE clause expression evaluates to true are included”

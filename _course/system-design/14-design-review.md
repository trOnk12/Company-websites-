---
title: Does the design survive a changed assumption?
short: Does the design survive a changed assumption?
summary: Defend a decision, then transfer it to a different domain.
takeaway: Defend the user-visible guarantee with a counterexample, a measurement and a changed assumption.
---

## The problem

For a distributed write, mark which replica or store can make the decision. Design the service from a blank sheet. It must handle a concert peak, allocate one last space correctly and resolve an unknown payment result. How can a reviewer distinguish a sound design from a polished diagram?

## See it

```diagram design-review
```

## The building block

For each boundary, name the data, the decision owner, the time budget and the result after a disconnect. Draw the smallest deployment that meets the assumptions. Include a capacity calculation and a measurable trigger for changing the architecture. For each guarantee, propose an experiment that could disprove it. Two successful grants of the same last space would be such a counterexample.

Round one is the parking service. Keep the replies from two contenders and read the winning grant after restart. Round two is assigned seating. Counting remaining tickets is insufficient because two tickets can name the same chair. Enforce uniqueness of event and seat together. Round three is a social feed. Freshness, ordering and read cost matter more than exclusive inventory. Compare building feeds on read with distributing posts at publication time.

## Try it

Submit a contract, an estimate with units, a diagram, a failure timeline, a repeatable test and a decision record. Have a reviewer change one assumption: a publisher now has a million followers, or one region loses contact. Predict the result before testing. Explain what measurement would make you change your own decision.

[Open the design cases, worked solutions and grading rubric](https://github.com/trOnk12/Company-websites-/blob/main/labs/parking-design/cases.md)

## Check yourself

- What protects an assigned ticket?::*Uniqueness of event and seat||A positive count of tickets >> Two tickets could name the same seat. >> the-building-block::Two tickets could name the same seat.
- What costs work when distributing a popular post on publication?::Always writing just one list >> Each separate recipient list requires work. >> the-building-block||*Writing many recipient lists::Each separate recipient list requires work.
- What demonstrates recovery?::*Reproduce and verify the outcome||Document the planned deployment >> A diagram expresses a hypothesis that a drill can test. >> the-building-block::A diagram expresses a hypothesis that a drill can test.

## Sources

- [Google SRE · Implementing SLOs](https://sre.google/workbook/implementing-slos/)

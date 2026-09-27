# Taxi Firm: Act 1 Prototype Spec

As of v0.4.0. The original spec lives in Claude Docs; this copy reflects what the prototype actually does now.

## Purpose

The prototype proves that running a taxi firm, from a single cab up to a small rostered fleet, is fun on a live map. Its play becomes Act 1 of the full game, the tutorial. The town, the ladder and the systems underneath are built to stay.

## Core loop

- **On shift**, the player is one of the firm's drivers. They pick or accept a job, choose a route, optionally chat with the customer, and earn the fare. The car drives itself.
- **While carrying a fare**, hiring, leasing, buying and renting are locked. Radioing drivers and changing the rota still work.
- **Bailing out** abandons the job: no fare, reputation drops.
- **Off shift**, the player runs the firm with everything unlocked.

## The town

A small fictional market town, Wexmoor, split by the River Tove with two bridges as chokepoints.

| District | Busy at |
| --- | --- |
| Station Quarter | Morning and evening commute |
| Town Centre | Daytime shopping, late night |
| Hospital Hill | All day, steady |
| Riverside | Evenings |
| Southfield | Early morning, school runs |
| Kilnworth Industrial | Shift changes |

- Roads are a graph of junctions and segments. Each segment has a traffic multiplier, shown as green, amber or red, that shifts with time of day.
- Roadworks randomly slow a segment for up to a day.
- Hotspots grow and shrink through the day. Demand drops sharply overnight.
- Three ranks (Station, Market Square, Hospital) serve waiting cabs first come, first served.

## Driving

- Click the map to drive somewhere, a rank to queue, or a waiting customer to go for them.
- On pickup, choose from two or three routes showing time, distance and jammed roads. The meter charges the shortest distance, so longer routes cost time and fuel.
- Passengers sometimes talk. A good reply earns a tip and a chance of a regular; a bad one costs reputation; ignoring them is neutral.

## Shifts and the rota

| Shift | Hours |
| --- | --- |
| Long day | 06:00–18:00 |
| Early | 06:00–14:00 |
| Day | 10:00–18:00 |
| Late | 15:00–23:00 |
| Night | 21:00–05:00 |
| Off the rota | Never works |

- Everyone, the player included, works one shift on one cab. Shifts on the same cab can't overlap.
- Shift changes apply at once, or after the current job.
- A cab with nobody on shift returns to the office.
- With nobody on shift at all, the clock fast-forwards at about 45x to the next shift start.

## Progression ladder (Act 1)

1. Rent an office
2. Hire a driver for your cab's off hours
3. Hire an operator (bookings)
4. Lease a second cab and staff it
5. Build to four leased cabs, each with a hired driver
6. Take yourself off the rota (ends Act 1)

A mechanic is optional from three cabs. Buying cabs, new or used, opens in Act 2.

## Bookings

- The operator only accepts bookings the rota can cover, and turns the rest away.
- With dispatch on, the nearest free driver takes a booking up to 30 minutes before pickup. If nobody is free, it is queued for whoever will drop off nearest.
- You can assign any booking by hand, including to a busy driver as their next job, or take it off them.
- The operator only sends you if you allow it.

## Economy

The player starts with £1,500 and one leased cab. Days run 06:00 to 06:00; fixed costs are charged at 06:00. Three days in a row in the red ends the game.

| Item | Cost or value |
| --- | --- |
| Fare | £3.50 flag + £2.00 per km |
| Booked fare | +20% |
| Fuel | £0.12 per km |
| Driver pay | 35% of each fare they take |
| Car lease | £200 refundable deposit, then £30 a day |
| Office | £500 deposit, then £40 a day |
| Operator | £55 a day |
| Mechanic | £60 a day |
| New cab (Act 2) | £4,500, then £8 a day upkeep |
| Used cab (Act 2) | about £1,200–£2,200 by wear, then £8 a day |
| Repair | £150, or £60 with a mechanic |
| Service | £40, or £15 with a mechanic |

## Balance targets

From `tools/harness.js`, 14 days, averaged over four seeds:

| Strategy | Net per day | Cash after 14 days |
| --- | --- | --- |
| Stay solo | about £90 | about £2,800 |
| Lease to four cabs, hire a mechanic | £120 early, £250 by day 10 | about £3,200 |

Expanding costs you on day 1 and pays off from day 2 or 3. A used cab in Act 2 takes about a week of Act 1-sized profit.

## The rival

Castle Cars starts with three cabs, competes for the same fares and grows to at most five if it earns well. It never attacks.

## Parked for later

- Firm wars: price wars, poaching, ranks and contracts, council reporting, dirty tricks
- Heat, council standing, and consequences for reporting rivals
- Attribution and investigations: suspicion, evidence, framing
- Rival AI personalities
- Territory and district pricing
- Driver loyalty, grievances and traits
- New cities and a large London-scale or London-inspired map
- Licences and plate caps

# Taxi Firm: Act 1 Prototype Spec

As of v0.3.1. The original spec lives in Claude Docs; this copy reflects what the prototype actually does now.

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

## Progression ladder

1. Rent an office
2. Hire a driver for your cab (works your off hours)
3. Hire an operator (bookings)
4. Get a second cab (lease, or buy used)
5. Grow to three cabs
6. Hire a mechanic
7. Take yourself off the rota (ends Act 1)

## Economy

The player starts with £1,500 and one leased cab. Days run 06:00 to 06:00; fixed costs are charged at 06:00. Three days in a row in the red ends the game.

| Item | Cost or value |
| --- | --- |
| Fare | £3.00 flag + £1.60 per km |
| Booked fare | +20% |
| Fuel | £0.12 per km |
| Driver pay | 40% of each fare they take |
| Car lease | £35 a day |
| New cab | £4,500, then £8 a day upkeep |
| Used cab | about £1,200–£2,200 by wear, then £8 a day |
| Office | £500 deposit, then £60 a day |
| Operator | £80 a day |
| Mechanic | £90 a day |
| Repair | £150, or £60 with a mechanic |
| Service | £40, or £15 with a mechanic |

## The rival

Castle Cars starts with three cabs, competes for the same fares and grows slowly if it earns well. It never attacks.

## Parked for later

- Firm wars: price wars, poaching, ranks and contracts, council reporting, dirty tricks
- Heat, council standing, and consequences for reporting rivals
- Attribution and investigations: suspicion, evidence, framing
- Rival AI personalities
- Territory and district pricing
- Driver loyalty, grievances and traits
- New cities and a large London-scale or London-inspired map
- Licences and plate caps

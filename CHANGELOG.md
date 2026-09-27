# Changelog

## 0.4.0

- Rebuild Act 1 around leasing: four staffed leased cabs, then take yourself off the rota
- Lock buying cabs (new and used) until Act 2
- Rebuild the Firm tab: a next-step card, then office and staff, drivers, fleet, rota and buying
- Fix booking "Send" buttons, which did nothing
- Let the operator queue a booking for a busy driver as their next job
- Let you assign a booking to a busy driver, or take it off them
- Add an option for the operator to dispatch you as well
- Stop the operator accepting more bookings than the rota can cover
- Put new hires on the long day shift first instead of nights
- Add a £200 refundable lease deposit
- Rebalance: fares £3.50 + £2.00/km, driver commission 35%, lease £30/day, rent £40, operator £55, mechanic £60
- Cut wear and breakdown rates
- Raise street and booking demand
- Cap Castle Cars at five cabs and tie its growth to earnings per cab
- Add a headless balance harness in tools/harness.js

## 0.3.1

- Split the single-page prototype into `index.html`, `css/` and `js/` files
- Add a favicon and touch icon
- Add README, changelog and the prototype spec
- Set up for GitHub Pages

## 0.3.0

- Add shifts: long day, early, day, late, night, or off the rota
- Let several drivers share one cab on non-overlapping shifts
- Put the player on the rota like any other driver
- Run days for a full 24 hours (06:00 to 06:00) with no reset
- Fast-forward when nobody is on shift; add 8x speed
- Add a daily used car market; let owned cabs be sold
- Unlock hiring, leasing and buying as soon as the office is rented
- End Act 1 when the player takes themselves off the rota
- Breaking: 0.2.0 saves no longer load

## 0.2.0

- Save the game to browser storage and restore it on load
- Add a confirmed "Start a new game" control

## 0.1.1

- Halve the base game clock speed so passenger chats can be answered

## 0.1.0

- First playable prototype: Wexmoor town, player as sole driver, route choice, passenger chat, progression ladder, passive rival

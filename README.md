# Property Price & Investment Analyzer

A lightweight browser app that helps evaluate a property by address, market value assumptions, rental cash flow, resale profit, and financing terms.

## What it does

- Captures the property address and property type.
- Blends an estimated market price with comparable-sales data.
- Calculates loan amount and monthly payment from down payment, interest rate, and loan term.
- Compares rent and sale strategies with cash flow, cap rate, profit, and ROI.
- Includes a clear integration point for a real address/property-price API.

## Run locally

```bash
npm start
```

Then open `http://localhost:5173` in your browser.

## Validate the app

```bash
npm run build
```

## Connecting live property data

The current version works with manual assumptions so it can run without paid API keys. To fetch live property values by address, connect a server-side property-data provider in `src/main.js` at the `lookupAddressPrice` function. Keep API keys on your backend, not in browser JavaScript.

Potential data sources include ATTOM, RentCast, Zillow Bridge Interactive, MLS feeds, or county assessor records, depending on your licensing and location.

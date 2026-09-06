# Sentinel Intelligence Hub

Build a production-quality full-stack web application called “SentinelGrid” with an integrated AI module called “ChemBuddy”.

This is a law-enforcement-oriented chemical/drug detection and city intelligence platform for a hackathon MVP.

CORE CONCEPT:

SentinelGrid connects portable physical substance-detection devices with a secure web dashboard. The device provides sensor readings, ChemBuddy analyzes the readings and generates an explainable result, and SentinelGrid aggregates anonymized test events into a citywide intelligence map.

IMPORTANT:

This is a functional MVP, not just a landing page or UI mockup. Build the actual application structure with frontend, backend-ready API architecture, database-ready models, realistic mock data, and clean component architecture.

TECH STACK:

- React / TypeScript

- Modern responsive web application

- Tailwind CSS

- Component-based architecture

- Use a clean backend/API structure

- Design the database schema so it can be connected to Supabase

- Prepare the application for Vercel deployment

- Use realistic mock data initially so the entire dashboard works without physical hardware

DESIGN DIRECTION:

Create a premium mission-control / intelligence-center interface.

Visual style:

- Dark professional interface

- Deep navy/black background

- Cyan/blue accents with subtle red/orange for alerts

- Glassmorphism used sparingly

- High information density but still easy to understand

- Professional police/intelligence technology aesthetic

- Smooth subtle animations

- Excellent typography

- Responsive desktop-first dashboard

- Avoid generic SaaS styling

- No excessive gradients

- No unnecessary decorative elements

MAIN APPLICATION STRUCTURE:

1. LOGIN / AUTHENTICATION

Create a professional secure login screen for authorized personnel.

2. MAIN DASHBOARD — “SENTINELGRID COMMAND CENTER”

Create the primary dashboard containing:

- Total tests performed

- Positive detections

- Inconclusive tests

- Active devices

- High-risk alerts

- Recent detection activity

- Live city intelligence map

- Detection trend chart

- Substance category distribution

- Device status panel

- Recent evidence/test reports

The dashboard should immediately communicate:

“What is happening right now, where is it happening, and how confident are we?”

3. LIVE INTELLIGENCE MAP

Create an interactive map-style interface showing anonymized detection events.

Each event should contain:

- approximate location

- timestamp

- detected substance/category

- confidence score

- risk level

- device ID

- test status

Use mock locations around Chandigarh for demonstration.

Do NOT expose personal identities or personally identifying information.

Include:

- hotspot visualization

- alert markers

- filters by substance/category, risk level and time

- map legend

- ability to click an event and open its details

4. DEVICE MONITORING

Create a “Devices” section showing portable detection devices.

Each device should show:

- Device ID

- Online/offline status

- battery

- last synchronization

- firmware version

- tests performed

- sensor health

Create a realistic simulated device called:

SG-D01

The device should have two sensors:

AS7341 spectral sensor

MQ-series gas sensor

Show their current status and readings.

5. CHEMBUDDY — EXPLAINABLE AI

Create a dedicated ChemBuddy analysis page.

The important concept is:

ChemBuddy should NOT simply say:

“Substance detected: X”

Instead, display an explainable reasoning trail.

Example:

Detection:

“Suspected Opioid”

Confidence:

94%

Reasoning:

✓ Spectral response matches reference pattern

✓ Color reaction curve matches expected profile

✓ Gas sensor signature supports the result

✓ Sensor readings are consistent

Show a visual graph comparing:

- live sensor curve

- reference curve

Also show:

- confidence score

- sensor agreement

- detected features

- reasoning timeline

- final classification

- recommendation

If the two sensors disagree, display:

“INCONCLUSIVE — Laboratory confirmation recommended.”

Make this distinction visually obvious.

6. TEST / EVIDENCE REPORT

Create a detailed test-result page that looks suitable for an official evidence workflow.

Include:

- Test ID

- Device ID

- Timestamp

- approximate location

- substance classification

- confidence

- sensor readings

- ChemBuddy reasoning

- graph

- chain-of-custody-style event timeline

- report generation button

The UI should make it clear that this is an analytical aid and not an automatic legal determination.

7. ALERT CENTER

Create an alert management page.

Alerts can include:

- High-confidence detection

- Repeated detections in an area

- Emerging hotspot

- Sensor disagreement

- Device offline

- Unusual detection pattern

Each alert should have:

- severity

- time

- location

- reason

- status

- related test

8. ANALYTICS

Create an analytics page showing:

- detection trends over time

- substance categories

- geographic hotspots

- device utilization

- confidence distribution

- inconclusive rate

- emerging patterns

Use clean charts and realistic demo data.

9. NAVIGATION

Create a persistent sidebar with:

Dashboard

Live Map

Devices

ChemBuddy

Tests & Evidence

Alerts

Analytics

Settings

Include a top bar with:

- system status

- notifications

- current user

- date/time

- SentinelGrid logo/name

DATA MODEL:

Design database-ready entities for:

Users

Devices

SensorReadings

Tests

ChemBuddyAnalyses

EvidenceReports

Alerts

Locations

DetectionEvents

Each Test should be capable of linking:

Device → Sensor Readings → ChemBuddy Analysis → Evidence Report → Intelligence Event

MOCK DATA:

Populate the application with realistic demonstration data so that every page looks alive.

Create at least:

- 5 devices

- 25+ historical tests

- multiple detection categories

- several alerts

- multiple map events

- different confidence scores

- some inconclusive tests

- different device statuses

Create a clear abstraction layer for mock data so it can later be replaced with real hardware/API data.

HARDWARE INTEGRATION PREPARATION:

Do not require actual hardware yet.

Create a clean service/API abstraction where future device data can enter the system through an endpoint such as:

POST /api/device/readings

The payload should conceptually support:

device_id

timestamp

spectral_readings

gas_sensor_reading

battery

location

The frontend should consume the same structured data whether it comes from mock data or a real device.

SECURITY:

Design with security in mind:

- authentication-ready architecture

- role-based access readiness

- anonymized location/event data

- no unnecessary personal information

- secure API structure

- audit-friendly event history

IMPORTANT UX:

The application should feel like something a police technology team could actually demonstrate.

Prioritize:

1. Command center dashboard

2. Live intelligence map

3. ChemBuddy explainability

4. Device monitoring

5. Evidence/test workflow

Do not create a marketing landing page as the main experience.

Build the actual authenticated application.

Start by creating the application architecture, database-ready data models, navigation, dashboard, mock data layer, and the core UI for Dashboard, Live Map, Devices, ChemBuddy, Tests & Evidence, Alerts and Analytics.

Keep the code modular and easy for another developer to extend during a hackathon.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7c22c658-7f90-40e5-a245-df882f25d348).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

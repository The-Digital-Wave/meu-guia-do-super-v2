# Phase 7: Pick&Pack Visual Parity Refactor — User Stories

**Epic:** MappedIn Pick&Pack Visual Parity Refactor
**Phase:** 7
**Author:** Product Management Agent
**Date:** 2026-06-01
**Benchmark:** [MappedIn Grocery Store Demo](https://app.mappedin.com/map/6679882a8298d5000b85ee89?floor=m_f62f718116360827)

---

## Overview

The current navigation prototype renders an abstract node-graph (colored dots and lines). Phase 7 refactors the client screens to achieve visual and interaction parity with the MappedIn Pick&Pack experience: a rendered floor plan, numbered product pins, a unified map + pick list screen, camera bearing rotation per stop, swipe-to-act gestures, collected item history, a mini-map in step-by-step navigation, and a completion celebration state.

---

## User Stories

### US-701: Floor Plan Rendering

**As a** shopper
**I want** to see the store floor plan rendered as colored shelf rectangles with aisle labels on the map
**So that** I can orient myself spatially inside the store without relying on abstract dots and lines

**Priority:** Must Have

**Acceptance Criteria:**

```gherkin
Scenario: Shelf blocks are rendered on the map canvas
  Given the shopper has opened the navigation screen
  When the store layout data is loaded
  Then each shelf is displayed as a filled rectangle positioned at its real-world coordinates
  And each rectangle uses the shelf's designated category color
  And each rectangle displays its aisle or section label in legible text

Scenario: Map renders without products in route
  Given the shopper is on the home screen with no active route
  When the map loads
  Then all shelf blocks are visible and correctly positioned
  And no product pins are displayed

Scenario: Floor plan is not replaced by abstract node graph
  Given the shopper has an active route
  When the map renders
  Then no colored dot-and-line node graph is visible
  And shelf rectangles remain the primary spatial representation
```

---

### US-702: Numbered Product Pins

**As a** shopper
**I want** to see numbered pins on the map for each product in my route
**So that** I can immediately see how many stops I have and where each product is located

**Priority:** Must Have

**Acceptance Criteria:**

```gherkin
Scenario: Pins appear for each route stop
  Given the shopper has an active route with N products
  When the map renders
  Then exactly N numbered pins are displayed on the map
  And each pin is positioned at the shelf coordinates of its corresponding product
  And pin numbers reflect the planned collection order starting from 1

Scenario: Active stop pin is visually distinguished
  Given the shopper is navigating to stop 2 of 5
  When the map renders
  Then pin number 2 is displayed in the active/highlighted style
  And pins 1 through 1 (already collected) are displayed in a completed style
  And pins 3 through 5 are displayed in the upcoming style

Scenario: Collected stop pin updates on item pick
  Given the shopper picks item at stop 3
  When the pick action is confirmed
  Then pin 3 transitions from active style to completed style
  And pin 4 transitions from upcoming style to active style

Scenario: Pin tap centers the map on that product
  Given the map has multiple pins visible
  When the shopper taps pin number 4
  Then the map camera centers on the shelf location of stop 4
  And a brief tooltip or label shows the product name for that stop
```

---

### US-703: Map and Pick List Unified Screen

**As a** shopper
**I want** the store map and my pick list visible on the same screen simultaneously
**So that** I never have to switch tabs mid-navigation and lose spatial context

**Priority:** Must Have

**Acceptance Criteria:**

```gherkin
Scenario: Map and pick list are co-visible without tab switching
  Given the shopper starts an active route
  When the navigation screen loads
  Then the store map occupies the upper portion of the screen
  And the pick list occupies the lower portion of the screen
  And no tab bar or tab-switching control is required to see both

Scenario: Pick list scrolls independently of the map
  Given the navigation screen is active with 6 or more route stops
  When the shopper scrolls the pick list area downward
  Then the pick list scrolls to reveal additional items
  And the map remains stationary and fully interactive

Scenario: Map is interactive while pick list is visible
  Given the unified navigation screen is active
  When the shopper pinches to zoom the map
  Then the map zooms correctly
  And the pick list remains fully visible and scrollable below the map

Scenario: Screen layout is mobile-first and does not clip content
  Given the app is running on a device with a screen height of 667pt or greater
  When the navigation screen renders
  Then at least 3 pick list items are visible below the fold of the map without scrolling
  And no content is clipped or hidden behind system chrome
```

---

### US-704: Camera Bearing Rotation per Stop

**As a** shopper
**I want** the map to rotate so that my next destination is always visually "ahead" (at the top)
**So that** I get a first-person navigation feel and can follow the route intuitively

**Priority:** Must Have

**Acceptance Criteria:**

```gherkin
Scenario: Map bearing rotates when active stop changes
  Given the shopper is at stop 1 and the map is oriented to face stop 1
  When the shopper confirms item 1 as picked and advances to stop 2
  Then the map animates a rotation so that the direction toward stop 2 is at the top of the viewport
  And the rotation animation completes within 600 milliseconds

Scenario: Initial bearing is set on route start
  Given the shopper starts a new route with stop 1 assigned
  When the navigation screen first renders
  Then the map bearing is set so that stop 1 is visually ahead (toward the top of the screen)
  And the shopper's current position marker faces the same direction

Scenario: Bearing is recalculated on skip
  Given the shopper is at stop 3 and skips it
  When stop 3 is skipped and stop 4 becomes active
  Then the map bearing recalculates toward stop 4
  And the rotation animation plays correctly

Scenario: Map bearing reset is available
  Given the map has been rotated to a custom bearing by the shopper
  When the shopper taps the compass/reset-bearing control
  Then the map bearing resets to the current active stop bearing
  And the animation plays within 400 milliseconds
```

---

### US-705: Swipe-to-Act on Pick List Items

**As a** shopper
**I want** to swipe left on a pick list card to reveal Skip and Picked action buttons
**So that** I can confirm or skip a collection in a single natural gesture without navigating away

**Priority:** Must Have

**Acceptance Criteria:**

```gherkin
Scenario: Swipe left reveals Skip and Picked buttons
  Given the pick list has an active item card
  When the shopper swipes the card leftward by at least 60pt
  Then a "Skip" button is revealed on the left side of the swipe area
  And a "Picked" button is revealed on the right side of the swipe area
  And the card remains partially visible and readable

Scenario: Tapping Picked confirms the collection
  Given the shopper has swiped left on the active card and the Picked button is visible
  When the shopper taps the "Picked" button
  Then a confirmation affordance is shown (button expands or pulses)
  And the item is marked as collected
  And the card animates out of the active position
  And the next item becomes the active card

Scenario: Tapping Skip defers the item
  Given the shopper has swiped left on the active card and the Skip button is visible
  When the shopper taps the "Skip" button
  Then the current item is moved to the end of the pick list
  And the next pending item becomes the active card
  And the map bearing recalculates toward the new active stop

Scenario: Swipe gesture is cancelable
  Given the shopper has begun swiping a card leftward
  When the shopper releases the card before crossing the 60pt threshold
  Then the card snaps back to its original position
  And no action is triggered

Scenario: Active card is the only swipeable card
  Given the pick list has one active item and multiple upcoming items
  When the shopper attempts to swipe an upcoming item card
  Then the card does not reveal action buttons
  And a subtle visual cue indicates the item is not yet actionable
```

---

### US-706: Collected Item History Stack

**As a** shopper
**I want** collected items to stack above the active card with a green checkmark
**So that** I can see my progress at a glance and review what I have already picked

**Priority:** Should Have

**Acceptance Criteria:**

```gherkin
Scenario: Picked item moves to history stack above active card
  Given the shopper picks item 2 from the active card
  When the pick confirmation completes
  Then item 2 appears in the history stack above the current active card
  And item 2 is displayed with a green checkmark badge
  And item 3 becomes the new active card below

Scenario: History stack is scrollable
  Given the shopper has collected 4 items and the history stack contains 4 cards
  When the shopper scrolls upward in the pick list
  Then all 4 collected items are accessible via scroll
  And the active card remains anchored at the top of the pending section

Scenario: Collected items are visually distinct from pending items
  Given the history stack contains collected items above and pending items below
  When the pick list renders
  Then collected items use a muted/greyed background with a green checkmark
  And pending items use the full-contrast active card style
  And the active card is clearly separated from both the history stack and upcoming items

Scenario: History stack is empty on route start
  Given a shopper starts a new route with no prior picks
  When the navigation screen loads
  Then no history stack section is rendered
  And only the active card and upcoming items are visible
```

---

### US-707: Mini-Map in Navigation Screen

**As a** shopper
**I want** a small rotating map inset displayed in the step-by-step navigation screen
**So that** I can maintain spatial awareness while reading turn-by-turn instructions

**Priority:** Should Have

**Acceptance Criteria:**

```gherkin
Scenario: Mini-map is visible on the navigation/step screen
  Given the shopper has entered the step-by-step navigation mode from an active route
  When the navigation screen renders
  Then a mini-map is displayed in the corner of the screen
  And the mini-map shows the shopper's current position and the active destination pin
  And the mini-map does not obscure the primary step instruction text

Scenario: Mini-map rotates in sync with the main map bearing
  Given both the full map and the mini-map are visible
  When the bearing updates due to an active stop change
  Then the mini-map rotates to match the same bearing as the full map
  And the rotation is animated in sync

Scenario: Mini-map expands on tap
  Given the mini-map is displayed on the navigation screen
  When the shopper taps the mini-map
  Then the view transitions to the full unified map + pick list screen
  And the full map retains the same bearing and zoom level as the mini-map

Scenario: Mini-map shows completed and active pins only
  Given the shopper is at stop 4 of 7
  When the mini-map renders
  Then pins 1 through 3 are shown in completed style on the mini-map
  And pin 4 is shown in active style
  And pins 5 through 7 are shown in upcoming style but at reduced opacity for clarity
```

---

### US-708: Collect Flow Completion State

**As a** shopper
**I want** to see a completion or celebration state when all items in my list are collected
**So that** I know the pick session is done and can proceed to checkout with confidence

**Priority:** Should Have

**Acceptance Criteria:**

```gherkin
Scenario: Completion state triggers when last item is picked
  Given the shopper picks the last item in the route
  When the pick confirmation animation completes
  Then the navigation screen transitions to a completion screen or overlay
  And a success message is displayed indicating all items are collected
  And the completion state includes a visual celebration element (e.g., confetti or checkmark animation)

Scenario: Completion screen shows a summary of collected items
  Given the completion state is displayed
  When the shopper views the completion screen
  Then the total number of collected items is shown
  And any skipped items are listed separately with an option to resume or dismiss

Scenario: Skipped items are resumable from completion screen
  Given the completion state shows 1 or more skipped items
  When the shopper taps the "Resume Skipped" action
  Then the navigation screen re-enters active mode with the skipped items as the new route
  And the map bearing recalculates toward the first skipped item

Scenario: Shopper can navigate to checkout from completion screen
  Given the completion state is displayed and all items are picked (no skips)
  When the shopper taps the "Go to Checkout" primary action
  Then the app navigates to the checkout or cart summary screen
  And the active route is cleared from state

Scenario: Completion state is not triggered prematurely
  Given the shopper has picked all but one item in the route
  When the second-to-last item is confirmed
  Then the completion state does not render
  And the active card advances to the final remaining item normally
```

---

## Story Summary Table

| Story ID | Title                          | Priority     | Surfaces Affected         |
|----------|--------------------------------|--------------|---------------------------|
| US-701   | Floor Plan Rendering           | Must Have    | Client (map canvas)       |
| US-702   | Numbered Product Pins          | Must Have    | Client (map canvas)       |
| US-703   | Map + Pick List Unified Screen | Must Have    | Client (navigation screen)|
| US-704   | Camera Bearing Rotation        | Must Have    | Client (map canvas)       |
| US-705   | Swipe-to-Act                   | Must Have    | Client (pick list)        |
| US-706   | Collected Item History Stack   | Should Have  | Client (pick list)        |
| US-707   | Mini-Map in Navigation Screen  | Should Have  | Client (navigation screen)|
| US-708   | Collect Flow Completion State  | Should Have  | Client (navigation screen)|

---

## Handoff Notes

**Inputs received:** Phase 7 Pick&Pack refactor spec; MappedIn grocery demo benchmark.

**Decisions made:**
- US-701 through US-705 are Must Have because they represent the core visual and interaction parity gap versus the MappedIn benchmark.
- US-706 through US-708 are Should Have because they enhance the experience but the core collection flow is usable without them.
- No new backend endpoints are required for this phase — all data is sourced from the existing route/navigation state.

**Artifacts created:** `agents/product_management/phase7-picklist-stories.md`

**Open risks and assumptions:**
- Bearing calculation assumes the server provides shelf centroid coordinates in metres; if coordinates are in normalized (0-1) space, the UI Generator agent must re-derive bearing from normalized vectors.
- Swipe gesture (US-705) conflicts are possible if the pick list is inside a parent scroll view — the UI Generator agent must use gesture handler priority correctly.
- Celebration animation (US-708) must be performant on low-end Android devices; Lottie or a CSS-equivalent must be benchmarked at ≤16ms frame time.

**Handoff targets:** UX Design Agent (flows and states for US-701 to US-708), Client Agent (implementation), QA Agent (test plan).

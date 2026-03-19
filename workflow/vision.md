# Vision

## Iteration
- ID: ITER-001
- Theme: Mental map in 30 seconds

## Problem
Current landing experience still risks overload when projected to 1000+ nodes.  
Users must form a correct mental map of system structure within 30 seconds, then drill deeper without clutter or confusion.

## Primary users
- Product Owner
- Engineer

## Success metrics
- M1: At initial load (semantic level 1), canvas shows clear service-level structure with no low-level noise.
- M2: User can drill in/out through levels 1..5 using discoverable interactions without external instructions.
- M3: Search result auto-focuses to relevant node and preserves context.

## Acceptance criteria
- AC-01: Semantic zoom enforces level-of-detail (1..5) and prevents clutter at low zoom.
- AC-02: Drill-in/out is intuitive: node double-click drills in; canvas double-click drills out.
- AC-03: Business/Engineering tabs preserve same graph truth while changing presentation emphasis.

## Out of scope
- Backend DNA algorithm and anomaly detection implementation
- Production API integration with FCS (current loop uses local sample graph)

## Release gate
- QA pass on all P0/P1 criteria
- PO sign-off complete


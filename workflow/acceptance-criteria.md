# Acceptance Criteria

## AC-01
**Given** a graph with mixed node levels  
**When** user is at semantic level 1 or 2  
**Then** only high-level nodes are visible and labels remain readable without overlap pressure  
**Evidence required** screenshots for level 1,2,3,5 + short QA notes

## AC-02
**Given** user explores graph depth  
**When** user double-clicks a node  
**Then** app drills into deeper semantic level and recenters around selected node  
**Evidence required** interaction recording or step-by-step screenshots

**Given** user is in deeper level (>=2)  
**When** user double-clicks canvas  
**Then** app drills out one level and preserves orientation  
**Evidence required** interaction recording or step-by-step screenshots

## AC-03
**Given** user toggles Business/Engineering tabs  
**When** same node is viewed in both tabs  
**Then** business intent is primary in Business tab and technical/runtime detail is primary in Engineering tab, without changing underlying node identity  
**Evidence required** side-by-side screenshots + QA assertion


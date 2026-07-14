# Step10-10 Building Realism Engine

`BuildingRealismEngine` improves the architectural realism of the final drawing after CAD quality completion. It does not rewrite `RoomLayoutEngine` output; it clones the final drawing and adds exam-level architectural planning data needed by equipment designers.

## API

```js
const { enhance } = require('../js/layout/buildingRealismEngine');
const result = enhance({ building, floorPlans, drawing });
```

Input:

```js
{ building, floorPlans, drawing }
```

Output:

```js
{ drawing, realism, warnings, score }
```

## Engine Components

- `CirculationPlanner`: user, service, evacuation, management, delivery, kitchen, linen, and waste routes.
- `ServiceFlowPlanner`: PS, EPS, DS, MDF, IDF, and vertical riser continuity.
- `RoomRelationshipPlanner`: hotel, hospital, school, and office adjacency rules.
- `StructuralRealityChecker`: column span, beam direction, seismic wall, core, and equipment-route viability.
- `EquipmentSpacePlanner`: air-conditioning, electrical, emergency-generator, water, heat-source, MDF/IDF spaces.
- `ToiletPlanner`: male WC, female WC, multipurpose WC, janitor/sink, and PS-aware wet zones.
- `HotelRoomPlanner`: hotel guest room UB, storage, windows, evacuation, PS, FCU, and piping space.
- `CoreBalanceChecker`: EV, stairs, EPS, PS, DS, and equipment-room distribution.
- `FireSafetyRealityChecker`: fire, smoke, exhaust compartments, stairs, vestibules, and special evacuation stairs.
- `BuildingRealismChecker`: 100-point exam suitability score; less than 95 emits a warning.

## Integration Order

```text
RoomLayoutEngine
↓
ArchitecturalDetailEngine
↓
ExamCadQualityEngine
↓
BuildingRealismEngine
↓
CropEngine
↓
ExamDrawingTemplateEngine
```

The architectural SVG renderer applies `ExamCadQualityEngine` and then `BuildingRealismEngine` before floor/blank rendering. Common-question blank extraction and crop generation also enhance the source architectural plan before clipping, while keeping generated equipment symbols out of blank drawings.

## Compatibility

- Final drawing only: source plans are deep-cloned before enhancement.
- Equipment Generator compatible: shafts, risers, rooms, and equipment spaces are added as plain drawing data.
- Existing API compatible: new metadata is additive and does not remove existing fields.
- Building Preview, Blank Drawing, Common Question crop, SVG/PDF paths can consume the enhanced drawing.

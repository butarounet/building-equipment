# STEP10-9 Exam CAD Quality Engine

`ExamCadQualityEngine` is the final architectural CAD enrichment pass. It does not rewrite the upstream room layout result in place; instead it clones the selected drawing and appends exam-style CAD information for the final SVG/PDF-oriented drawing payload.

## Input

```js
{
  building,
  floorPlans,
  drawing,
  template
}
```

## Output

```js
{
  drawing,
  cadQuality,
  warnings,
  score
}
```

## Pipeline

1. `GridRefiner` adds通り芯, A/1-style grid data, column-center metadata, dimension-ready grid coordinates, and column numbers.
2. `DimensionCompleter` adds exterior, column-center, room, EV/stair, EPS, PS, and DS dimensions.
3. `AnnotationCompleter` adds room name, area, CH, FL, use, north, scale, drawing number, title, and legend annotations.
4. `RoomFurnitureCompleter` adds hotel guestroom furniture, meeting-room furniture, and kitchen fixtures.
5. `DoorWindowCompleter` adds single doors, double doors, sliding doors, fire doors, FIX windows, normal windows, and smoke-vent windows.
6. `ShaftCompleter` adds EPS, PS, DS, EPS-1, PS-2, DS-1, MDF, and IDF spaces by use.
7. `CoreCompleter` ensures EV, emergency EV, stairs, vestibule, corridor, and smoke-compartment core data.
8. `FireCompartmentCompleter` adds fire compartments, smoke compartments, fire doors, and compartment line metadata.
9. `CADDecorationCompleter` adds north arrow, title, frame, scale, drawing number, legend, notes, line types, and layers.
10. `ExamCADQualityChecker` scores columns, walls, doors, dimensions, annotations, furniture, equipment spaces, fire compartments, CAD quality, and exam quality on a 100-point scale. Scores under 95 emit a warning.

## Integration rules

- The engine is called by `architecturalDrawingRenderer` for floor drawings after the existing Building Drawing Quality Engine.
- Blank drawings are detected by `blankMode` or a blank drawing id and do not receive additional equipment-space information.
- Existing generator payloads remain compatible because enrichment uses additive arrays and preserves upstream fields.
- SVG output consumes enriched dimensions, furniture, shafts, core objects, fire compartments, and CAD annotations through the existing floor renderer layers.

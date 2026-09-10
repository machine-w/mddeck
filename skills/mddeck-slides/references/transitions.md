# Slide transition styles

How slides move between each other — distinct from the theme (visual styling). Read this when you've reached Phase 2 of the workflow.

The transition style controls `perspective` in front-matter and whether to use `_position` / `_rotate` per slide.

## The four styles

### Flat 2D slide

```yaml
perspective: 0
```

- Slides lay out in a 2D grid; **no 3D camera move** between slides.
- `_position` and `_rotate` directives are ignored.
- `autoLayoutPlugin` arranges slides in a clean horizontal/vertical grid.
- Best for: technical talks, dense content, image-heavy decks, anything where motion would distract from the content.
- Visual feel: a flat slideshow with crisp cuts between slides.

### Linear 3D slide

```yaml
perspective: 1000  # default
```

- Slides move left-to-right (or top-to-bottom) in 3D space.
- `autoLayoutPlugin` places slides along the X axis with a small Y stagger by default.
- No manual `_position` needed; the layout plugin handles it.
- Best for: sequential narratives — chapters of a book, step-by-step explainers.
- Visual feel: a smooth sideways scroll through the content.

### Polyhedron 3D rotation (recommended for keynotes)

```yaml
perspective: 1500
```

- Slides sit on the faces of a 3D shape (cube, octahedron, icosahedron).
- Audience rotates around the shape to read each face.
- **Requires manual `_position` and `_rotate` per slide.**
- Best for: memorable showcase decks (≤12 slides), "wow" stage moments, any talk where the 3D motion itself is part of the message.
- Visual feel: a camera orbiting a sculptural object; each slide is a "face" of the story.

### Auto-layout (no opinion)

```yaml
perspective: 1000  # default
# Don't add _position / _rotate; let the layout plugin decide
```

- Same as linear — `autoLayoutPlugin` does its thing.
- Use this when the user has no preference; it's also the fallback if Phase 2 is skipped.

## Polyhedron coordinate recipes

Each slide on a polyhedron face has a position (offset from origin) and rotation (so text reads upright when the camera reaches that face).

### Cube — 6 slides (recommended starting point)

Side length 2000. Center of the cube is at origin.

```
       +Y (top face center)
        │
        │       +X
        │      ╱
        │    ╱  back face (-Z, +X)
        │  ╱   ╱
        ┼─────────→  +X
       ╱│
      ╱ │   right face (+X, +Z)
     ╱  │
    ╱   │
   +Z   +Y
```

| Face | `_position` | `_rotate` |
|---|---|---|
| **Front** (faces +Z) | `{ x: 0, y: 0, z: 0 }` | none |
| **Right** (faces +X) | `{ x: 2000, y: 0, z: 0 }` | `{ y: -90 }` |
| **Back** (faces -Z) | `{ x: 0, y: 0, z: -2000 }` | `{ y: 180 }` |
| **Left** (faces -X) | `{ x: -2000, y: 0, z: 0 }` | `{ y: 90 }` |
| **Top** (faces +Y) | `{ x: 0, y: -2000, z: 0 }` | `{ x: 90 }` |
| **Bottom** (faces -Y) | `{ x: 0, y: 2000, z: 0 }` | `{ x: -90 }` |

The text on each face should be readable when the camera is in front of that face. For top/bottom faces, the text will appear rotated relative to a default viewer — fine for "special moment" slides but don't put critical content on them.

### Octahedron — 8 slides

8 triangular faces, 4 on top, 4 on bottom. Less useful for content (triangles), but a great visual for "8 ideas around a central theme" decks. Coordinates need trigonometry; safer to skip and use a cube + linear combo instead.

## Combining polyhedra for longer decks

Cube gives 6 slides. For a 7-12 slide polyhedron deck:

- **Cluster slides into 2 cubes**. Slide 1-6 on cube A, slide 7-12 on cube B offset by `{x: 6000}`. Audience traverses both.
- **Mix with linear**: opening 2 slides on a cube, middle slides on linear (perspective 1500 but no manual positions), closing 1-2 slides back on a cube. Creates a "wow intro → flow → wow close" arc.

For 13+ slides, prefer **linear** (perspective 1500) with a single polyhedron "moment" (intro or outro). Don't try to scale polyhedra beyond 12 — the geometry gets confusing.

## When to override `perspective`

| Style | `perspective` |
|---|---|
| Flat | `0` |
| Linear | `800`–`1200` (default 1000) |
| Polyhedron | `1500`–`2000` |

`perspective: 0` always wins — it disables ALL 3D effects, regardless of `_position`/`_rotate` directives.

## Pick fast

If unsure:
- Technical talk / dense content → **Flat**
- Sequential narrative → **Linear** (the default — also the safest)
- Keynote / showcase / ≤12 slides → **Polyhedron** (this is mddeck's signature feature; use it)

Mix and match: e.g. flat for 80% of the deck, then a polyhedron "moment" for the closing.
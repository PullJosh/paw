# Dubious Documentation
Documentation is not currently a high-priority item, so this information may be outdated or incomplete.
## Sprites
Create a sprite with `new Paw.sprite()`.  
New sprite arguments (all are optional): `x`, `y`, `size`, `direction`, `showing (bool)`

#### addCostume()
`sprite.addCostume(url)` will add the image at `url` (a string) as a costume for `sprite`.

#### touching()

`sprite1.touching(sprite2)` will report a boolean value indicating whether sprite1 and sprite2 overlap (currently only detects based on image dimensions, does **not** account for transparent pixels).

## Paw

#### mouse
`Paw.mouse.x` returns the x coordinate of the mosue  
`Paw.mouse.y` returns the y coordinate of the mouse  
`Paw.mouse.onscreen` returns a boolean value indicating whether the mouse is within the bounds of the canvas

#### timer
`Paw.timer` returns the time (in seconds) since the timer was last reset. The timer automatically resets when the project begins.
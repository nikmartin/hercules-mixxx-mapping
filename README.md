MIXXX Controller mapping for Hercules DJ Controller Instinct (S)
================================================================

###v1.0.1

Original by [Stephan Martin](https://github.com/ratte/mixxxcontrollermapping)



##Description of Mappings

###Hot Cue
* All Mode Lights off = HotCue Mode
* 1-4 : Select/Store Hotcue 1-4
* Vinyl + 1-4 : Delete Hotcue 1-4

###Loop (Not Complete)
* 1,2 loop in / out
* 3: halve looping length
* 4: double loop length
* Vinyl + 1 = Clear loop
* Vinyl + 2 = Move Loop 1 Beat Right
* Vinyl + 3 = Move Loop 1 Beat Left

###Headphone Plus/Minus Buttons:
Buttons are not mapped. The Instinct Controller takes care of adjusting the volume
of the controllers headphone plug. Mixxx also adjusts the volume independent
of the controller.

###Pitch
Pitch is broken slightly broken now.
Pressing Plus- and Minus-Buttons together resets the Pitch to Zero.
What should happen is the pitch toggle changes pitch, and the pitch buttons temporarily change pitch

###Jogwheels
Jogwheels have three functions, based on the state of the deck:

* Deck is playing:
  * Turning wheel enables keylock, then jogs track for beat matching, then disables keylock (if it wasn't enabled)
  * Turning Wheel while pressing platter Scratches
* Deck is not playing:
  * Turning wheel scrolls the library
  * Turning wheel while pressing scratches

###Effects
Effects buttons enable the corresponding effect unit on that deck. No oth

###Miscellaneous Mappings
Censor (reverseroll) with Vinyl + Rewind Button (<<)


Todo:
=====

* Headphone +- Switches -> Headphone-Volume
* Effects
* Better Looping Mappings
* Gain with Vinyl + Pitch
* Master volume with Headphone -/+ & Vinyl
* Image for Documentation of Mappings / Wiki

Please open an Issue for any feature request or bugs found

# Rendering, post-processing and capture

What happens to a frame between the scene render and the file you hand somebody,
and which stage a given problem actually belongs to. Nothing here is about a
particular install: it is how the engine, an injected shader chain and the
capture path behave. Tools and shader families are named only as examples that
make a mechanism concrete.

**Start with stage order.** Most arguments in this area - fix it in game or in
ReShade, why the bloom setting did nothing, why a calibration stopped being valid
- are settled by knowing where in the chain each thing sits.

## The pipeline

- [ReShade sees the frame after the game has finished with it](/rendering/stage-order-decides-where-a-fix-belongs) - the controllable stages in order, why a shader can never see pre-tonemap values, and why exposure gets fixed at the earliest controllable stage
- [Bloom has no toggle in the game's options](/rendering/bloom-has-no-toggle-in-the-options) - the `[Developer/FeatureToggles]` `user.ini`, and the five-step checklist for a toggle that appears to do nothing
- [The display is the last stage, and its "enhancements" fight the art direction](/rendering/the-display-is-the-last-stage) - black equalizers, range compression, dynamic tone mapping, and OSD labels that lie about their own direction

## HDR

- [An HDR retrofit layer changes what every later shader sees](/rendering/an-hdr-retrofit-layer-changes-what-shaders-see) - a 40:1 scene arriving at the shaders as 1.35:1, and bloom that lifts the whole frame with no traceable source
- [HDR and SDR are two different calibrations](/rendering/hdr-and-sdr-are-two-different-calibrations) - the log2 whitepoint that makes a bloom shader look insane, and the luminance number Windows shows once and never again

## Capture and delivery

- [The capture path can silently ruin a finished shot](/rendering/capture-formats-and-what-they-clip) - 16-bit PNGs that blew out highlights, JPEG XR from Game Bar and OBS, and the tooling gaps that reproduce the fault
- [HDR screenshot metadata is a negotiated compromise, and SDR is the honest delivery format](/rendering/hdr-delivery-is-a-negotiation) - one hot pixel can dim a whole image, and every consumer re-tone-maps anyway
- [The game's own picture importer decodes wrongly rather than refusing](/rendering/importing-a-picture-into-the-game) - the way back in: magenta from an HDR PNG, banding from a naive conversion, and the container that fixes both *(draft: one game version)*

## Composing a shot

- [Photo mode is a separate rendering context](/rendering/composing-in-the-gameplay-renderer) - ray reconstruction is broken inside it; freeze time and fly a detached camera instead
- [Frame generation is display smoothness, never input latency](/rendering/frame-generation-is-smoothness-not-latency) - latency rises with the multiplier, and in frozen time there is nothing to interpolate
- [Judging a visual change](/rendering/judging-a-visual-change) - toggle layers in place rather than comparing side by side, and the four scenes a grade has to survive
- [The player has no head in ray-traced reflections](/rendering/the-player-has-no-head-in-ray-traced-reflections) - a vanilla engine limitation surfacing through a mod, not a mod fault; the base game removed the player from RT reflections for this reason

## Lighting a character

Portrait lighting inside a game engine, using a relighting shader. **Read the axis
article before acting on any coordinate in the other three** - an entire session of
placement advice was once built on the conventional axis mapping and was wrong in
every instruction.

- [A tool's X, Y and Z may not mean what 3D convention says](/rendering/an-axis-label-is-not-a-3d-convention) - one shader creates lights pointing at the camera, so Y is side-to-side, X is near-to-far and Z is up-down; verify by moving a light and watching, every time
- [Range does more work than intensity, in both directions](/rendering/light-range-does-more-than-intensity) - a blown-out face is a range too short, a lit backdrop is a range too long, and several dim lights beat one bright one
- [A fill light pushed off-axis becomes a second key](/rendering/a-fill-light-belongs-near-the-camera-axis) - 20-30 degrees off the camera-subject axis at 40-50% of key, and overhead is a rim light rather than a key
- [Environmental light alone silhouettes a subject](/rendering/environmental-light-silhouettes-a-subject) - scenes are lit for gameplay legibility, and an added light dropped to just above ambient reads as motivated rather than pasted on

## Effects, and how they interact

- [Ordering the effect chain](/rendering/ordering-the-effect-chain) - infrastructure first, meters last, corrective sharpener before aesthetic, and what path tracing makes redundant
- [Sharpening recovers detail, it never invents it](/rendering/sharpening-recovers-detail-it-never-invents-it) - why a contrast-adaptive sharpener does not halo, and why SDR tolerates far more of it than HDR
- [One grain pass, and one grain model](/rendering/one-grain-pass-and-one-grain-model) - three layers can each add grain, and the halide-crystal and sensor-noise models mean different things by the same control
- [Telling bloom from what is not bloom](/rendering/telling-bloom-from-what-is-not-bloom) - reflections and lens flare get reported as bloom, and bloom itself is a per-shot decision
- [Measuring what an injected shader chain costs](/rendering/measuring-what-a-shader-chain-costs) - three readings at one fixed spot, because uninstalling to measure removes the hook as well as the shaders *(draft: one machine, one scene)*
- [A framerate average does not predict how the game feels](/rendering/smoothness-is-variance-not-average) - slow and jerky are different faults with opposite fixes, and the two worst failures never move the average *(draft: one configuration's thresholds)*

## What is marked draft, and why

Eight articles here carry `status: draft` because their central finding is a
**single observation** rather than a repeated test - one machine, one session,
one version of a tool. Each says so in its own "What was not verified" section:
the HDR retrofit layer, the HDR/SDR calibration article, the capture formats,
photo mode's broken ray reconstruction, the display-side features, the shader
chain's measured cost, the picture importer, and the smoothness article's
thresholds.

The mechanisms in those articles generalise. The measurements in them do not, and
should be re-derived rather than copied.

The lighting articles are `stable` for a different reason: their mechanisms are
photographic practice rather than a measurement of this build, and the axis mapping
was confirmed in the tool by the person using it. But **the numbers in them - an
intensity, a range in metres, a cone angle - are one worked portrait's**, and carry
exactly as little weight as any other single measurement. Each says so in its own
"Confidence and scope" section.

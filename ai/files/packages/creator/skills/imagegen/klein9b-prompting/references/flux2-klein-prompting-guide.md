# FLUX.2 [klein] Prompting Guide

Source: https://docs.bfl.ml/guides/prompting_guide_flux2_klein
Retrieved via lynx dump.

```text
   #[1]alternate

   [2]Skip to main content

   🚀 FLUX.2 [klein] — Sub-second generation. Open weights, Apache 2.0, API
   from $0.014/image. [3]Learn more →
   (BUTTON)
   [4]Black Forest Labs home page light logo dark logo
   (BUTTON)
   Search...
   ⌘K (BUTTON) Ask AI

     * [5]Help Center
     * [6]API Status
     * [7]API Pricing
     * [8]Get API Key
     * [9]Get API Key

   (BUTTON)
   (BUTTON) Search... (BUTTON) (BUTTON)
   (BUTTON)
   Navigation
   FLUX.2 Prompting
   Prompting Guide - FLUX.2 [klein]
   [10]Documentation
   [11]Prompting Guide
   [12]API Reference
   [13]Release Notes
     * [14]Documentation
     * [15]Prompting Guide
     * [16]BFL Homepage
     * [17]Help Center

FLUX.2 Prompting

     * [18]FLUX.2 [pro] & [max]
     * [19]FLUX.2 [klein]

FLUX.1 Text-to-Image Prompting

     * [20]Quick Reference
     * [21]Prompt Builder
     * [22]Prompting Fundamentals
     * [23]Prompting Essentials
     * [24]Advanced Techniques
     * [25]Negative Prompting

FLUX.1 Kontext Prompting

     * [26]Image-to-Image

   (BUTTON) On this page
     * [27]Write Like a Novelist
     * [28]Basic Prompt Structure
     * [29]Lighting: The Most Important Element
     * [30]Word Order Matters
     * [31]Prompt Length
     * [32]Style and Mood Annotations
     * [33]Image Editing
     * [34]Single-Image Editing
     * [35]Multi-Reference Editing
     * [36]Writing Effective Prompts
     * [37]Model Variants
     * [38]Best Practices Summary

   FLUX.2 Prompting

Prompting Guide - FLUX.2 [klein]

   (BUTTON)
   Copy page
   (BUTTON)

   Master narrative prompting for FLUX.2 [klein] - scene-first prose,
   lighting mastery, and multi-reference composition
   (BUTTON)
   Copy page
   (BUTTON)
   FLUX.2 [klein] works best when you describe scenes like a novelist, not
   a search engine. Write flowing prose with lighting details, and the
   model delivers.
   No prompt upsampling: [klein] does not auto-enhance your prompts. What
   you write is what you get—so be descriptive.

   [39]​
   Write Like a Novelist Describe your scene as flowing prose—subject
   first, then setting, details, and lighting. This gives [klein] clear
   relationships between elements.
   Portrait with soft, warm tone

Do this

   “A woman with short, blonde hair is posing against a light, neutral
   background. She is wearing colorful earrings and a necklace, resting
   her chin on her hand.”

Not this

   “woman, blonde, short hair, neutral background, earrings, colorful,
   necklace, hand on chin, portrait, soft lighting”

   [40]​
   Basic Prompt Structure Use this framework for reliable results:

     Subject → Setting → Details → Lighting → Atmosphere

   Element Purpose Example
   Subject What the image is about ”A weathered fisherman in his late
   sixties”
   Setting Where the scene takes place ”stands at the bow of a small
   wooden boat”
   Details Specific visual elements ”wearing a salt-stained wool sweater,
   hands gripping frayed rope”
   Lighting How light shapes the scene ”golden hour sunlight filters
   through morning mist”
   Atmosphere Mood and emotional tone ”creating a sense of quiet
   determination and solitude”

   [41]​
   Lighting: The Most Important Element Lighting has the single greatest
   impact on [klein] output quality. Describe it like a photographer
   would.
   Instead of “good lighting,” write “soft, diffused light from a large
   window camera-left, creating gentle shadows that define the subject’s
   features.”
   Portrait with soft, warm tone
   Architecture with dramatic light and shadow
   Lioness with cubs in golden savanna light
   What to describe:
     * Source: natural, artificial, ambient
     * Quality: soft, harsh, diffused, direct
     * Direction: side, back, overhead, fill
     * Temperature: warm, cool, golden, blue
     * Interaction: catches, filters, reflects on surfaces

   Example lighting phrases:
     * “soft, diffused natural light filtering through sheer curtains”
     * “dramatic side lighting creating deep shadows and highlights”
     * “golden hour backlighting with lens flare”
     * “overcast light creating even, shadow-free illumination”

   [42]​
   Word Order Matters [klein] pays more attention to what comes first.
   Front-load your most important elements. Priority: Main subject → Key
   action → Style → Context → Secondary details
   Strong word order:“An elderly woman with silver hair carefully arranges
   wildflowers in a ceramic vase. Soft afternoon light streams through
   lace curtains, casting delicate shadows across her focused
   expression.”Subject and action lead.
   Weak word order:“In a warm, nostalgic room with antique furniture, soft
   afternoon light streams through lace curtains. An elderly woman with
   silver hair is there arranging wildflowers.”Subject buried in
   description.

   [43]​
   Prompt Length
   Length  Words                  Best For
   Short  10-30   Quick concepts, style exploration
   Medium 30-80   Most production work
   Long   80-300+ Complex editorial, detailed product shots
   Longer prompts work well when every detail serves the image. Avoid
   filler — each sentence should add visual information.

   [44]​
   Style and Mood Annotations Adding explicit style and mood descriptors
   at the end of your prompt can enhance consistency:
   (BUTTON)
   (BUTTON)
[Scene description]. Style: Country chic meets luxury lifestyle editorial.
Mood: Serene, romantic, grounded.

   (BUTTON)
   (BUTTON)
[Scene description]. Shot on 35mm film (Kodak Portra 400) with shallow
depth of field—subject razor-sharp, background softly blurred.

   Model on exercise ball in 1990s editorial style
   Two bison in stylized modern room with blue walls
   Musician silhouette against glowing orange sunset
   Silhouette figure against city skyline at dusk
   Anime dragon in nocturnal forest with neon glow
   Wolf wearing sheep costume, whimsical style

   [45]​
   Image Editing For image editing, prompts describe the transformation
   you want. Focus on what changes while letting the input image(s)
   provide the foundation.
   Key principle: Reference images carry visual details. Your prompt
   describes what should change or how elements should combine—not what
   they look like.

   [46]​
   Single-Image Editing
   Edit Type Prompt Pattern Example
   Style transfer ”Turn into [style]" "Reskin this into a realistic
   mountain vista”
   Object swap ”Replace [element] with [new element]" "Replace the bike
   with a rearing black horse”
   Element replacement ”Replace [element] with [new element]" "Replace all
   the feathers with rose petals”
   Add elements ”Add [element] to [location]" "Add small goblins climbing
   the right wall”
   Environmental ”Change [aspect] to [new state]" "Change the season to
   winter”
   Original abstract artwork
   Mountain vista transformation
   Person on motorcycle
   Person on rearing black horse
   Portrait with feathers
   Portrait with rose petals

   [47]​
   Multi-Reference Editing Combine multiple input images for style
   transfer and complex edits. When using multiple references, specify the
   role of each.
   Original portrait
   Style reference portrait
   Styled portrait with fluffy hair
   Style reference image 1
   Style reference image 2
   Black Forest in combined style

   [48]​
   Writing Effective Prompts
   Be specific about what changes and clear about the target state.
   Reference image locations when needed (e.g., “image 1”, “image 2”) and
   let the base image provide context.

Good prompts

     * “Add dramatic storm clouds to the sky”
     * “Change her dress from blue to deep burgundy”
     * “Age this portrait by 30 years”
     * “Change image 1 to match the style of image 2”

Avoid

     * “Make it better”
     * “Improve the lighting”
     * “Make it more professional”
     * “Fix the image”

   [49]​
   Model Variants
   Variant Speed License Best For
   [klein] 4B Sub-second Apache 2.0 High-volume workflows, local
   deployment (~13GB VRAM)
   [klein] 9B Sub-second FLUX Non-Commercial Production work, best prompt
   understanding
   Base 4B/9B Standard Same as above Fine-tuning, research (undistilled,
   higher diversity)
   Try [klein] via API — Get started in minutes with sub-second
   generation. No GPU required. [50]View API docs →
   API models (4B, 9B) are step-distilled for speed. Base variants
   preserve full training signal for customization.

   [51]​
   Best Practices Summary

   Write in Prose, Not Keywords
   Describe scenes as flowing paragraphs. “A weathered leather journal
   lies open on an oak desk, morning light revealing handwritten entries
   in faded ink” works better than “journal, leather, oak desk, morning
   light, handwriting.”

   Lead with Your Subject
   Put the most important element first. Word order signals priority to
   the model.

   Describe Light Explicitly
   Specify light source, quality, direction, and how it interacts with
   surfaces. Lighting descriptions have the highest impact on output
   quality.

   Use Sensory Details
   Include textures, reflections, and atmospheric elements. “Flaky
   croissant layers catching soft diffused light” is more evocative than
   “croissant on table.”

   Add Style/Mood Tags (Optional)
   End prompts with explicit style or mood annotations when you want
   consistent aesthetic results across multiple generations.

   Simplify Multi-Reference Prompts
   When using reference images, describe relationships and context—let the
   images provide visual details.

   Be Specific with Transformations
   For i2i editing, clearly state what should change and the target
   result. Avoid vague instructions.

Try [klein] via API

   Sub-second generation from $0.014/image. No GPU required—start
   generating in minutes.

Download Weights

   Run locally with open weights. 4B (Apache 2.0) or 9B (FLUX
   Non-Commercial).

   Was this page helpful?
   (BUTTON) Yes (BUTTON) No
   [52]FLUX.2 [pro] & [max][53]Quick Reference

   ____________________________________________________________
   ____________________________________________________________
   ____________________________________________________________
   ____________________________________________________________
   ⌘I (BUTTON)

   [54]Black Forest Labs home page light logo dark logo
   [55]x[56]github[57]linkedin

   Legal
   [58]Impressum[59]Developer Terms of Service[60]Flux API Service
   Terms[61]Terms of Use[62]Responsible AI Development Policy[63]Usage
   Policy[64]Intellectual Property Policy[65]Privacy Policy

   Company
   [66]Careers[67]Help Center[68]Contact
   [69]x[70]github[71]linkedin
   [72]Powered byThis documentation is built and hosted on Mintlify, a
   developer documentation platform
   (BUTTON) (BUTTON) (BUTTON)
   Assistant
   (BUTTON) (BUTTON)
   Responses are generated using AI and may contain mistakes.

   ____________________________________________________________
   ____________________________________________________________
   ____________________________________________________________
   ____________________________________________________________
                        (BUTTON) (BUTTON)

References

   1. https://docs.bfl.ml/sitemap.xml
   2. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#content-area
   3. https://docs.bfl.ai/flux_2/flux2_overview#flux-2-[klein]-models
   4. https://docs.bfl.ml/
   5. https://help.bfl.ai/
   6. https://status.bfl.ai/
   7. https://bfl.ai/pricing
   8. https://dashboard.bfl.ai/
   9. https://dashboard.bfl.ai/
  10. https://docs.bfl.ml/quick_start/introduction
  11. https://docs.bfl.ml/guides/prompting_guide_flux2
  12. https://docs.bfl.ml/api-reference/get-the-users-credits
  13. https://docs.bfl.ml/release-notes
  14. https://docs.bfl.ml/quick_start/introduction
  15. https://docs.bfl.ml/guides/prompting_summary
  16. https://bfl.ai/
  17. https://help.bfl.ai/
  18. https://docs.bfl.ml/guides/prompting_guide_flux2
  19. https://docs.bfl.ml/guides/prompting_guide_flux2_klein
  20. https://docs.bfl.ml/guides/prompting_summary
  21. https://docs.bfl.ml/guides/prompting_guide_interactive_builder
  22. https://docs.bfl.ml/guides/prompting_guide_t2i_fundamentals
  23. https://docs.bfl.ml/guides/prompting_guide_t2i_essentials
  24. https://docs.bfl.ml/guides/prompting_guide_t2i_advanced
  25. https://docs.bfl.ml/guides/prompting_guide_t2i_negative
  26. https://docs.bfl.ml/guides/prompting_guide_kontext_i2i
  27. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#write-like-a-novelist
  28. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#basic-prompt-structure
  29. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#lighting-the-most-important-element
  30. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#word-order-matters
  31. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#prompt-length
  32. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#style-and-mood-annotations
  33. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#image-editing
  34. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#single-image-editing
  35. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#multi-reference-editing
  36. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#writing-effective-prompts
  37. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#model-variants
  38. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#best-practices-summary
  39. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#write-like-a-novelist
  40. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#basic-prompt-structure
  41. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#lighting-the-most-important-element
  42. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#word-order-matters
  43. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#prompt-length
  44. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#style-and-mood-annotations
  45. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#image-editing
  46. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#single-image-editing
  47. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#multi-reference-editing
  48. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#writing-effective-prompts
  49. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#model-variants
  50. https://docs.bfl.ml/flux_2/flux2_text_to_image#klein-integration
  51. https://docs.bfl.ml/guides/prompting_guide_flux2_klein#best-practices-summary
  52. https://docs.bfl.ml/guides/prompting_guide_flux2
  53. https://docs.bfl.ml/guides/prompting_summary
  54. https://docs.bfl.ml/
  55. https://x.com/bfl_ml
  56. https://github.com/black-forest-labs
  57. https://linkedin.com/company/bflml
  58. https://bfl.ai/legal/imprint
  59. https://bfl.ai/legal/developer-terms-of-service
  60. https://bfl.ai/legal/flux-api-service-terms
  61. https://bfl.ai/legal/terms-of-use
  62. https://bfl.ai/legal/responsible-ai-development-policy
  63. https://bfl.ai/legal/usage-policy
  64. https://bfl.ai/legal/intellectual-property-policy
  65. https://bfl.ai/legal/privacy-policy
  66. https://bfl.ai/careers
  67. https://help.bfl.ai/
  68. https://bfl.ai/contact
  69. https://x.com/bfl_ml
  70. https://github.com/black-forest-labs
  71. https://linkedin.com/company/bflml
  72. https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=bfl

```

# Vaudeville Paris — mismatched official booking link

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main227 aed3c8e86da1b932fede7c4d90985d3ab680b6c0. Integrator reserved curated-PAR-vaudeville; no catalog or activation is delivered.

## Blocker

The explicit ordinary reservation link on Vaudeville's official website points to native restaurant82241, which identifies itself as **Terminus Nord**,23 rue de Dunkerque,75010Paris, telephone+33142850515. This does not match Brasserie Vaudeville,29 rue Vivienne,75002Paris. Available lunch times at82241 therefore cannot be used as Vaudeville availability. No provider policy or runtime change is appropriate from this evidence.

## Readonly evidence, 2026-10-18

Official source https://www.vaudevilleparis.com/ returned200. HTML SHA256 `15fda87f8c5a3b68feb5d92f2bd5819ed6792f3f1b31c71e9743f8662f67d540`. The restaurant address is29rueVivienne75002Paris. Its main-text Réserver anchor is exactly https://bookings.zenchef.com/results?rid=82241&lang=fr&withCloseButton=1 . The same page separately sets window.restaurantId=250192. These two IDs are not interchangeable.

Following only the explicitly assigned booking anchor, one native readonly results GET was made:
https://bookings.zenchef.com/results?rid=82241&lang=fr&day=2026-10-23&pax=2

It returned200, SHA256 `f1c3f9c76a7f3d212d251e81611bd65b4075d57afef7749eda4421da0fad5d57`. Native __NEXT_DATA__.props.initialState.appStoreState contains restaurantId82241, nameTerminusNord, address23rueDunkerque, zip75010, cityParis and phone+33142850515. The query and wish match date23October/party2 and timezoneEuropeParis. No redirect corrected the venue.

Lunch19380 availability and policy were present, but belong to this different restaurant and are not accepted for the assigned Vaudeville scope. No work on Terminus Nord was started.

## Boundaries and next action

No request to250192, no form preparation, JavaScript execution, contact input, reservation, hold/cart, payment, message, or actual booking receipt/capability access occurred. No further date probe. No alternate ID guessed or silently substituted. Runtime tests are not applicable to this documentation-only negative handoff; captured identity/anchor fields were parsed and git diff --check was used.

Park this candidate pending a source-backed, explicitly assigned resolution of the correct ordinary Vaudeville booking entry. The website widget ID alone is not evidence that the mismatched main-text link reaches Vaudeville. Master decides any next scoped identity investigation;32d5 alone owns shared catalog/integration/release. This is not evidence of restaurant closure or lack of availability.

# Bokabord submission scope

Release 218 closes a gap between receipt classification and permission to send.
Previously, a provider-review selection rejected by its receipt policy could
receive a fallback journal fingerprint and still reach the provider. A later
unknown result did not prevent that request. This is a code-path finding, not
evidence that a supplier currently offers an unsupported selection or that an
unwanted reservation occurred.

The existing mirror now accepts explicit `submissionPolicies`. It reuses each
policy's approval digest in the snapshot, before the submit action clicks a
provider control, and at the intercepted booking POST before journal reservation
or transport. The existing payload-to-approval match remains mandatory. The
default empty list preserves integrations without this opt-in.

The server uses one `providerReviewPolicies` list for submission permission and
receipt verification. Existing flags and exact meal/party limits are unchanged:

| Restaurant | Meal | Maximum guests |
| --- | --- | --- |
| Noema | Lunch 35204 | 8 |
| Ciccio's | Dining Room 2379 | 7 |
| Beirut Café | Lunch 30471 | 2 |
| Brasserie Balzac | Lunch 354 | 2 |
| Kommendören | Lunch 3501 | 2 |
| Brasserie Astrid | Lunch 55508 | 2 |
| Vau De Ville | Lunch 22476 | 2 |
| Boqueria | Lunch 22 | 2 |
| Villa Dagmar | Lunch 63588, exact type0 exception | 2 |
| Italiano | Dining Room 22890 | 2 |
| Copine | Lunch 4790 | 2 |
| Agnes, new integration | Middag 1628 | 2 |

Riche, Sturehof, Gondolen and Café Klotet retain their separate pre-Next native
review and policy binding. Zink's original confirmation path is unchanged.

At a visible contact step, opted-in provider-review sessions reuse the existing
read-only native telephone widget projection. This is needed before Next copies
the telephone into the provider model. Invalid or ambiguous reads fail closed.
At native review, the actual provider query telephone is used. No helper writes
the model, emits events, clicks Next or sends a request. The stale-view and
payload telephone checks remain in place.

The unauthenticated guest path still requires the provider's native review.
An unexpected direct booking POST from contact Next is unarmed and blocked;
authentication/code endpoints remain outside the request allowlist. Supplier
confirmation still requires the independently bound completion document.

Validation must distinguish actual selected invalid values before dispatch from
mutated supplier responses after dispatch. Synthetic confirmation fixtures and
public guest-page checks are not proof of a completed supplier reservation.

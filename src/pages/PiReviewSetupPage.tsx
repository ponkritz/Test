import { PiFormSetupPanel, ReviewStartPanel } from '../components/PiFormSetupPanel'
import type { PiFormStore } from '../usePiFormSetup'

// PIR-29, SET-26: Admin → Feature & PI setup → PI Review form (formerly the page PI Review Setup): the start date of PI
// Review, the summary of the form in use, Edit form… with the shared column-list editor, Save to Git, the notices and the
// read-only state with its reason (PIR-19…PIR-22, PIR-31, PIR-33). Shown inside the page's SectionTabs (with its scope
// chip) only to the holders of "PI Review: set up the review form" (CON-114: Scrum Master and Tool Owner by default; SET-27).
// The ⚙ in My PI Review and PI Review opens it (PIR-30).
export function PiReviewSetupSection({ store, block, by }: { store: PiFormStore; block: string; by: string }) {
  return <>
    <p className="muted section-intro">When PI Review starts, and the fields of the PI review form — Review… in PI Review, My PI Review and the Close pop-up — and the headings each writes in the Feature’s Discussion comment. Shared with everyone through Git.</p>
    {/* PIR-33: the start date of PI Review, before the form. */}
    <ReviewStartPanel store={store} block={block} by={by} />
    <PiFormSetupPanel store={store} block={block} by={by} />
  </>
}

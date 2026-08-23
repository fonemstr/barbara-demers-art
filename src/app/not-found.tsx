import SiteLayout from "./(site)/layout";
import { NotFoundContent } from "./not-found-content";

// Unmatched URLs resolve at the root, outside the (site) group, so the
// site layout is applied explicitly to keep header, footer, and fonts.
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}

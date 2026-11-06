import { siteHref } from "../../lib/siteHref";
import { Button } from "../Button";
import { Page } from "../Page";

/**
 * The page for an address with no page. On GitHub Pages this is `404.html`; its
 * redirect script runs first, so a reader only sees this when no rule matched.
 */
export function NotFound() {
  return (
    <Page.Main id="main">
      <Page.Header>
        <Page.Eyebrow>404 / not found</Page.Eyebrow>
        <Page.Title>This page does not exist</Page.Title>
        <p className="text-[12px] text-muted">The page moved or was removed, and no redirect rule matched it.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href={siteHref("/")} variant="primary">
            Workstation guide
          </Button>
          <Button href={siteHref("/bundles/")}>Agent bundles</Button>
        </div>
      </Page.Header>
    </Page.Main>
  );
}

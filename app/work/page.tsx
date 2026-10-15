import {
  LegacyRedirect,
  legacyRedirectMetadata,
} from "@/components/legacy-redirect";

export const metadata = legacyRedirectMetadata("work");

export default function WorkIndexPage() {
  return <LegacyRedirect hash="work" />;
}

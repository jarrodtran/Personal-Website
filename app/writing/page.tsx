import {
  LegacyRedirect,
  legacyRedirectMetadata,
} from "@/components/legacy-redirect";

export const metadata = legacyRedirectMetadata("writing");

export default function WritingIndexPage() {
  return <LegacyRedirect hash="writing" />;
}

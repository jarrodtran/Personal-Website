# Copy email

The contact section shows the email address, a button that copies it, a speaking invitation, and the résumé. A successful copy renames the button to `Copied` and announces `Email address copied`. A denied clipboard renames it to `Couldn't copy` and announces the failure. Two seconds later the button returns to `Copy email`.

## Sub-features

- `copy-success` copies `jarrodtran@outlook.com` when the page is allowed to write the clipboard.
- `copy-denied` announces the failure when the clipboard write is rejected.
- `copy-reset` restores `Copy email` and clears the status.
- `copy-neighbors` exposes the mailto link, the speaking invitation, and the résumé download beside the button.

## How to get to it (user POV)

- Open `/` and go to Contact, or open `/#contact`.
- Choose `Copy email`.
- Choose the address itself (`mailto:jarrodtran@outlook.com`).
- Choose `Invite me to speak`.
- Choose `Résumé` in the contact list. The header has another `Résumé` link. This journey uses the one in Contact.

## Driving it with verify-site

Preconditions:

- Doctor printed `doctor: ok`, including `resumePdf: yes`.
- The success entry point needs `--clipboard` on the context. The denied entry point needs a context without that flag.
- Do not replace `navigator.clipboard.writeText` from the page.

- **Address.** Run `browser context --color-scheme light --java-script true --viewport 1280x800 --reduced-motion reduce --clipboard`, `browser open /#contact`, and `browser wait-idle`. `browser attr --role link --name "jarrodtran@outlook.com" --attr href` prints `mailto:jarrodtran@outlook.com`.
- **Copy.** Run `browser click --role button --name "Copy email"`. `browser text --role button --name "Copied"` prints `Copied`. `browser text --role status` prints `Email address copied`. `browser clipboard` prints `jarrodtran@outlook.com`.
- **Reset.** Run `browser wait --role button --name "Copy email" --timeout 4000`. `browser text --role status` prints `(empty)`. The product clears the status 2000ms after the click. The wait is on the button name, not a sleep.
- **Denied.** Run `browser context --color-scheme light --java-script true --viewport 1280x800 --reduced-motion reduce`, `browser open /#contact`, and `browser click --role button --name "Copy email"`. `browser text --role button --name "Couldn't copy"` prints `Couldn't copy`. `browser text --role status` prints `Couldn't copy the email address`. If the button still becomes `Copied`, the browser wrote the clipboard without the permission, the denied entry point was not reached, and this entry point fails.
- **Neighbors.** On the contact section, `browser attr --role link --name "Invite me to speak" --attr href` prints `mailto:jarrodtran@outlook.com?subject=Speaking%20invitation`. `browser attr --role link --name "Résumé" --within-id contact --attr href` prints `/resume.pdf`. `browser attr --role link --name "Résumé" --within-id contact --attr download` prints `Jarrod-Tran-Resume.pdf`.
- **Proof.** Repeat the success context and the copy click. Run `browser screenshot --path .cursor/skills/verify-site/evidence/copy-email/{run}/copied.png` and `browser snapshot --within-id contact --role status --path .cursor/skills/verify-site/evidence/copy-email/{run}/status.aria.txt` before the reset. The screenshot shows `Jarrod Tran` and `Copied`. The snapshot includes `Email address copied`. Record `browser clipboard` in the transcript.

## Gotchas

- The status node is `role="status"` and visually hidden (`sr-only`). Read it with `browser text --role status`. Idle text is empty, and the helper prints `(empty)`. A snapshot taken before the click does not prove the announcement.
- The button name is the proof of the visible label: `Copy email`, then `Copied` or `Couldn't copy`, then `Copy email` again. There is one such button.
- Header and contact both have `Résumé`. `--within-id contact` selects the contact link. Clicking it starts a download of `/resume.pdf` and may not navigate. Read `href` and `download` unless the entry point under test is the download itself.
- `Couldn't` uses a straight apostrophe, matching the button label in `components/copy-email.tsx`.
- The reset timer is 2000ms in the component. `--timeout 4000` gives the announcement time to clear. If the button is still `Copied` when the wait ends, the reset failed.
- Do not inject a rejecting `writeText` to force the denied state. Omit `--clipboard` instead. A success in that context is a failed denied-path, not a pass you can reclassify.

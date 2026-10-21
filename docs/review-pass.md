# Review PASS

FE Designer and Preview QA fill this in for every PASS. Copy the blank template into the PR or a review comment.

## Template

- Head SHA reviewed:
- Scope (one of `design only`, `behavior`, `rules`):

### Elements the diff touches

One row per element. Include the measured value (for example `theme icon, 16x16 at 320 / 200% text`).

| Element | Measured value |
| ------- | -------------- |
|         |                |

### Rule or coverage claims

For each rule or coverage claim: break the rule, name the test that should catch it, paste the failing output, then confirm it passes after revert.

1. Rule broken:
2. Test that should catch it:
3. Failing output:

```

```

4. Passes after revert (yes / no):

---

## Example (not a real PASS)

The block below is an example only. Do not treat it as a completed review.

- Head SHA reviewed: `a14a3bd`
- Scope: `behavior`

### Elements the diff touches

| Element    | Measured value           |
| ---------- | ------------------------ |
| theme icon | 16x16 at 320 / 200% text |
| menu icon  | 16x16 at 320 / 200% text |

### Rule or coverage claims

1. Rule broken: theme icon grows past 16px at 200% text
2. Test that should catch it: `pnpm a11y` (200% text header clip)
3. Failing output:

```
header clips its controls at 200% text: theme icon 24x24 (expected 16x16)
```

4. Passes after revert: yes

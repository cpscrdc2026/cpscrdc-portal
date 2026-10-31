# Manual test checklist

Run the portal from a local web server or the deployed site. Use a narrow phone-sized viewport (about 375 px wide) and a desktop viewport. Check the browser console and network panel for JavaScript errors, failed asset requests, and unexpected Supabase errors.

## Public visitor

- Open the home page in a signed-out session; confirm no sign-in prompt appears automatically.
- Open Motions Bank, Debate Results, Calendar, Achievements, Scripts, and Leaderboard.
- Confirm the public leaderboard shows up to seven official debaters.
- Confirm Calendar opens with “All dates” selected and shows past and upcoming items.
- Use each page's search and filters, then clear them and confirm the full list returns.
- Switch between light and dark mode; check text contrast and horizontal overflow.

## Member

- Sign in with a member account and confirm the member dashboard opens only after choosing to sign in.
- Confirm personal debate history is visible and score breakdowns remain member-only.
- Open Scripts and expand/collapse motions; confirm all speaker scripts remain available.
- Confirm the member leaderboard limit is unchanged.

## Editor/admin

- Sign in with an editor account.
- Search the Members section and open a member dashboard; confirm it shows that member's debate history.
- Check that editor/admin actions appear only where expected.
- Add or edit a calendar item, motion, achievement, or result in a safe test environment, then confirm the updated item renders and the list filters still work.
- Confirm Point Adjustments is absent and the Debate Results, Motions, Calendar Sessions, Members, Training Scripts, Members & Admins, AP Scoring Setup, Audit Logs, and Backup & Restore tabs remain available.
- Confirm leaderboard totals are unchanged after the tab is removed; existing saved adjustments are still included.
- Confirm the editor view retains its full leaderboard.

## Responsive and keyboard checks

- At phone width, confirm leaderboard rows and page controls use less vertical space without hiding labels or content.
- Confirm controls can be reached and operated with a keyboard, focus remains visible, and dialogs can be dismissed.
- At desktop width, confirm cards, tables, navigation, and filters remain readable and do not overlap.

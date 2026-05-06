# PureCraft User Testing Checklist

Use this as a moderated or self-guided audit checklist for the PureCraft Expo app. Mark each item as:

- `[Pass]` Works as expected
- `[Issue]` Confusing, broken, slow, visually rough, or missing feedback
- `[N/A]` Not relevant for this tester/device

Recommended test devices: small iPhone, large iPhone, Android phone, and web preview. Test once as a first-time guest, once as a returning guest, and once signed in.

## Test Session Setup

- [ ] Record tester name or session ID.
- [ ] Record device, OS, browser if web, screen size, and app build.
- [ ] Start from a fresh install or cleared local storage for first-run testing.
- [ ] Confirm whether Supabase/API credentials are available.
- [ ] Confirm camera permission state before testing Scan: not requested, allowed, denied.
- [ ] Confirm network state: online, offline, slow connection if possible.
- [ ] Ask tester to think aloud while moving through tasks.
- [ ] Do not explain the UI unless the tester gets fully blocked.

## First Impression

- [ ] Splash screen appears polished and routes correctly after the hold.
- [ ] Brand purpose is clear within 5 seconds.
- [ ] Visual tone feels premium, natural, safe, and trustworthy.
- [ ] Tester can describe what PureCraft helps them do.
- [ ] Tester understands whether the app is for cleaning, beauty, scent, baby-safe products, savings, or all of these.
- [ ] No visible layout shift, blank icon boxes, broken images, or clipped text.

Notes:

## Onboarding

- [ ] First launch routes to onboarding instead of Home.
- [ ] Intro screen explains the product clearly enough to continue.
- [ ] Intent selection allows up to 3 choices and makes that limit understandable.
- [ ] Continue button is disabled until at least one intent is selected.
- [ ] Avoidances, skin, scent, household, priorities, routine, time, loading, results, and region screens all progress without dead ends.
- [ ] Back navigation behaves predictably on every onboarding screen.
- [ ] Skip options, where present, are easy to understand.
- [ ] Selected answers persist when revisiting onboarding from Settings.
- [ ] Results screen feels personalized to selected answers.
- [ ] Finishing onboarding routes to Home and does not repeat on next launch.
- [ ] Resetting onboarding or signing out returns to the correct starting state.

Tester prompts:

- What did you think you were choosing?
- Did anything feel too long before reaching the app?
- Which question felt most useful or least useful?

## Core Navigation

- [ ] Bottom navigation shows Home, Discover, Make Hub, Saved, and Profile/Settings.
- [ ] Active tab state matches the current screen.
- [ ] Make Hub opens smoothly and closes without trapping the user.
- [ ] Every Make Hub action routes correctly: curated recipe, pantry, scan, build, add ingredient, scan to pantry gate, save own recipe.
- [ ] Hardware/software back gestures do not create confusing loops.
- [ ] Top-bar back/close buttons match the user’s expectation.
- [ ] No screen loses content behind the status bar, notch, or home indicator.

## Home

- [ ] PureCraft+ badge is visible and routes to Premium.
- [ ] Hero content feels relevant and tappable actions are clear.
- [ ] "What You Can Make Right Now" appears only when pantry matches exist.
- [ ] Problem chips route to filtered recipe lists.
- [ ] Category cards route to the expected category or Pantry Magic.
- [ ] Quick tools route correctly: All Recipes, Family Safe, Mists & Sprays, Budget Hacks, My Favorites.
- [ ] Horizontal rows communicate scrollability.
- [ ] Text and images are not clipped on small screens.

## Discover

- [ ] Search bar accepts input and has an obvious outcome.
- [ ] If search currently only routes to Categories, tester understands that behavior.
- [ ] Weekly pick, intent chips, trending, quick fixes, budget, seasonal, and personal sections are understandable.
- [ ] Intent chips with real filters route to expected lists.
- [ ] Intent chips without precise filters do not feel misleading.
- [ ] Recipe cards route to Tailor It / Preferences.
- [ ] Pantry preview routes to Pantry.
- [ ] Premium teaser routes to Premium.
- [ ] Empty or no-result states are handled gracefully.

Risk to watch: Discover has local search input, but much of the actual filtering happens after routing to Categories. Test whether users expect immediate results on the Discover screen.

## Categories, Search, And Filters

- [ ] All Recipes count matches the loaded catalog.
- [ ] Category chips filter correctly.
- [ ] Search returns relevant recipes and clears cleanly.
- [ ] Filter sheet opens, applies, resets, and closes predictably.
- [ ] Time filters work: under 5 min, 5-10 min, 15+ min.
- [ ] Family-safe filter matches safe recipes.
- [ ] Type filters work for scrub, mask, oil, balm.
- [ ] Problem filters from Home show the correct active pill.
- [ ] Safe-for-kids and tag query params show the correct active pill.
- [ ] Empty filter results explain what happened and offer a recovery path.
- [ ] Recipe cards show title, time, category, savings, and image clearly.
- [ ] Tapping a recipe opens the expected Recipe Detail screen.

## Recipe Detail

- [ ] Recipe hero image loads and is correctly framed.
- [ ] Close button returns to a sensible place.
- [ ] Share opens native share sheet or web share behavior.
- [ ] Save heart opens collection picker for unsaved recipes.
- [ ] Saved state updates immediately after saving or unsaving.
- [ ] Auth or freemium gates appear only when appropriate.
- [ ] Collection picker can create/select collections and confirms success.
- [ ] Batch size options update ingredient amounts correctly.
- [ ] Pantry match indicator reflects current pantry.
- [ ] Benefits, best-for, avoid-if, safety notes, shelf life, and smart swaps are clear.
- [ ] Ingredient help sheet opens only for supported ingredients.
- [ ] Shopping list CTA routes with the correct recipe.
- [ ] Related/category CTA routes correctly.
- [ ] Recipe instructions are easy to follow while making a product.
- [ ] Safety warnings are prominent enough for baby, pet, skin, stone, bleach/vinegar, and essential oil contexts.

Tester prompts:

- Would you trust this recipe enough to make it?
- What information would you want before starting?
- Did the safety guidance change your confidence?

## Tailor It / Preferences

- [ ] Product card matches the selected recipe.
- [ ] Preference chips toggle clearly.
- [ ] Strength selector state is obvious.
- [ ] Pantry items toggle clearly.
- [ ] Summary reflects selected preferences and pantry count.
- [ ] Generate Formula routes to Loading and then Result.
- [ ] Generated result matches the selected preferences enough to feel personalized.
- [ ] Back navigation preserves or intentionally discards changes.

## Pantry

- [ ] Pantry screen explains that ingredient entry adds items, not searches recipes.
- [ ] Manage Pantry opens and closes reliably.
- [ ] Default pantry items are reasonable.
- [ ] Add/search ingredient flow works for common ingredients and aliases.
- [ ] Removing pantry items updates recipe matches.
- [ ] Category filters update all match sections.
- [ ] "Make Right Now" only shows recipes with all ingredients.
- [ ] "Missing Only 1 Ingredient" accurately shows the missing item.
- [ ] "Save Money Fast" sorts or feels relevant.
- [ ] "Most Popular Tonight" feels useful rather than arbitrary.
- [ ] Pantry state persists after leaving and reopening the app.
- [ ] Pantry state affects Recipe Detail match indicators.

## Pantry Magic Results

- [ ] Screen reflects current pantry item count.
- [ ] Ready, Almost There, and Explore More buckets are accurate.
- [ ] Empty ready state tells the tester how to add pantry items.
- [ ] Edit Pantry buttons route to Pantry.
- [ ] Recipe rows open the correct Recipe Detail screen.
- [ ] See More route works when more recipes exist.

## Scan Product

- [ ] First scan request asks for camera permission at the right time.
- [ ] Denied camera state explains how to enable access in settings.
- [ ] Camera preview appears and is not blank.
- [ ] Viewfinder and capture control are visible on small and large screens.
- [ ] Freemium scan gate appears at the correct quota.
- [ ] Capture enters detecting state with clear feedback.
- [ ] Successful scan returns brand/product/ingredients confidence and a matched PureCraft recipe.
- [ ] Low-confidence scan explains uncertainty.
- [ ] Unreadable scan offers manual category fallback.
- [ ] Retake/reset works.
- [ ] Scan does not crash offline or with API failure.
- [ ] Privacy copy about photo handling is clear.

## Build Custom Formula

- [ ] Guest user is routed to sign up before AI generation.
- [ ] Signed-in user can select a goal, scent, notes, and custom prompt.
- [ ] Generate is disabled or clearly blocked until required fields are selected.
- [ ] Thinking state appears during generation.
- [ ] API errors are shown in plain language.
- [ ] Successful generated recipe is saved and opens in Recipe Detail.
- [ ] Generated recipe appears later in Saved or catalog where expected.
- [ ] Constraints such as baby-safe, no vinegar, no essential oils, pet-safe, and stone-safe are respected.

## Save My Own Recipe

- [ ] Emoji selection works.
- [ ] Title, blurb, tags, ingredients, and steps can be entered comfortably.
- [ ] Add/remove ingredient rows works and never removes the final row.
- [ ] Add/remove step rows works and never removes the final row.
- [ ] Save is disabled until title, one ingredient, and one step exist.
- [ ] Signed-in save persists to Supabase.
- [ ] Guest save behavior is clear if it is local-only.
- [ ] Error messages from Supabase are visible and understandable.
- [ ] Success state offers useful next actions.

## Saved, Collections, And Recents

- [ ] Signed-out Saved screen clearly distinguishes demo content from real saved recipes.
- [ ] Signed-in empty Saved state is not misleading.
- [ ] Saved recipes from Recipe Detail appear here.
- [ ] Collections show correct counts.
- [ ] Creating a collection works.
- [ ] Collection names handle empty, duplicate, long, and special-character input.
- [ ] Favorites collection behaves consistently with heart saves.
- [ ] Filters work: All, Favorites, Cleaning, Beauty, Home, Custom, Premium.
- [ ] Recently viewed recipes update after opening Recipe Detail.
- [ ] Savings dashboard uses real saved/made data where available.
- [ ] Recipe cards open the correct detail screen.

Known placeholder controls to verify before release:

- [ ] Saved screen placeholder buttons at `app/saved.tsx` should be wired or removed.

## Shopping List

- [ ] Shopping list opens with the selected recipe.
- [ ] Needed ingredients and pantry ingredients are separated correctly.
- [ ] Estimated total updates correctly.
- [ ] Checking items updates progress.
- [ ] Share button opens the share sheet and includes the correct list.
- [ ] Amazon search opens the correct ingredient query.
- [ ] Amazon affiliate tag is present only when configured.
- [ ] Empty "to buy" state is useful when the user has every ingredient.

Known placeholder controls to verify before release:

- [ ] Top share icon currently needs confirmation because `app/shopping-list.tsx` contains an empty share handler.

## Premium / Paywall

- [ ] Premium can be reached from Home, Settings, freemium modals, and onboarding results.
- [ ] Plan selection visibly changes selected state and price/fine print.
- [ ] Currency formatting applies to all prices.
- [ ] Restore button works or is hidden until purchase integration exists.
- [ ] Start Free Trial / Founding Member CTA starts purchase flow or clearly indicates prototype state.
- [ ] Closing Premium returns to the previous screen.
- [ ] Freemium gates explain what is locked and how to unlock.
- [ ] RevenueCat product IDs, restore, cancel copy, trial copy, and legal disclaimers are correct before production.

Known placeholder controls to verify before release:

- [ ] Restore is currently a no-op.
- [ ] Purchase CTA currently routes back instead of starting RevenueCat checkout.

## Auth And Account

- [ ] Sign up works with valid email/password.
- [ ] Sign up shows clear errors for weak password, existing email, bad email, and network failure.
- [ ] Sign in works and routes to Home.
- [ ] Forgot password sends reset email.
- [ ] Reset password flow completes and routes correctly.
- [ ] Auth state persists across app restart.
- [ ] Sign out clears user state and routes correctly.
- [ ] Auth prompt modal appears when saving/generating requires an account.
- [ ] Account deletion explains consequences before deleting.
- [ ] Delete Account removes Supabase account data or clearly explains what remains.

## Settings

- [ ] Profile name/email display correctly for guest and signed-in user.
- [ ] Sign in button routes correctly for guests.
- [ ] Edit profile button works or is hidden until implemented.
- [ ] Household profile routes to onboarding household and preserves existing answers.
- [ ] Default preferences routes to onboarding intent and preserves existing answers.
- [ ] Pantry row opens Pantry and shows a real pantry count.
- [ ] Currency row opens Currency picker.
- [ ] Notification, safety alert, haptic, and metric toggles persist or clearly behave as session-only.
- [ ] Help Center opens and answers common support questions.
- [ ] Contact opens email client with correct address.
- [ ] Rate PureCraft opens store rating or is hidden until store listing exists.
- [ ] Privacy, Terms, Data & Permissions, and Delete Account open correctly.

Known placeholder controls to verify before release:

- [ ] Edit profile is currently a no-op.
- [ ] Rate PureCraft is currently a no-op.
- [ ] Pantry subtitle currently appears hardcoded as "7 ingredients on hand"; verify against real pantry state.

## Currency And Region

- [ ] Currency picker changes savings, ingredient prices, plan prices, and shopping totals.
- [ ] Currency selection persists after app restart.
- [ ] Static conversion-rate note is acceptable and not misleading.
- [ ] Region selection during onboarding applies expected defaults.
- [ ] Portugal, EU, USA, and UK price/currency behavior match product expectations.

## Legal, Privacy, And Permissions

- [ ] Privacy Policy is readable and up to date.
- [ ] Terms of Use are readable and up to date.
- [ ] Data & Permissions page matches actual app behavior for camera, notifications, pantry, account data, and analytics.
- [ ] Delete Account flow matches actual Supabase deletion behavior.
- [ ] Camera privacy copy on Scan matches actual edge-function processing.
- [ ] Affiliate/Amazon disclosure is present if monetized links are enabled.
- [ ] AI-generated recipe disclaimer is present where users need it.
- [ ] Safety disclaimer is visible enough for cleaning/skin/baby/pet products.

## Accessibility

- [ ] All primary interactive elements have readable labels.
- [ ] Icon-only buttons have accessibility labels.
- [ ] Text remains readable at larger OS font sizes.
- [ ] Touch targets are at least 44x44 points where practical.
- [ ] Color contrast is sufficient for sage/gold text on cream backgrounds.
- [ ] Selected states are not color-only.
- [ ] Screen reader order matches visual order.
- [ ] Modal focus/close behavior is predictable.
- [ ] Keyboard entry works for search, prompts, auth, and recipe forms.
- [ ] Error messages are announced or visually obvious.

## Visual And Layout QA

- [ ] No text overlaps, clips, or truncates awkwardly on small devices.
- [ ] Long recipe titles fit in cards, rows, hero areas, and shopping lists.
- [ ] Images render without missing assets or fallback overuse.
- [ ] GIFs and images do not slow screen transitions noticeably.
- [ ] Horizontal lists do not trap vertical scrolling.
- [ ] Bottom nav does not cover final content or CTAs.
- [ ] Modals and sheets fit on small screens.
- [ ] Loading states avoid blank screens.
- [ ] Error and empty states feel designed, not technical.

## Performance And Reliability

- [ ] App cold start feels acceptable.
- [ ] Onboarding image-heavy screens do not stutter.
- [ ] Recipe catalog loads quickly with bundled fallback if Supabase is slow.
- [ ] Remote recipe sync does not change IDs unexpectedly.
- [ ] Search/filter interactions feel instant.
- [ ] Camera and AI generation flows have timeouts or recoverable errors.
- [ ] Offline mode handles catalog browsing, saved local data, pantry, and settings gracefully.
- [ ] App does not crash when env vars are missing.
- [ ] No repeated analytics events fire from a single user action.

Static audit note: `npm run lint` currently reports 0 errors and 33 warnings, mostly import ordering and unused imports. Clean these before release so real issues stand out in CI.

## Safety And Trust

- [ ] Recipes never suggest dangerous ingredient combinations.
- [ ] Vinegar/bleach, peroxide/acid, ammonia/bleach, essential oils/pets, baby skin, and stone-surface risks are handled.
- [ ] Measurements are specific enough to follow.
- [ ] Shelf-life guidance is visible and realistic.
- [ ] Patch-test or spot-test guidance appears for skin/surface-sensitive recipes.
- [ ] Users understand DIY recipes are guidance, not medical or professional advice.
- [ ] Store-bought savings claims feel credible and clearly estimated where needed.

## Monetization And Conversion

- [ ] Free user can experience enough value before paywall.
- [ ] Paywall timing does not feel punitive.
- [ ] Premium benefits match actual locked features.
- [ ] Scan, save, pantry, and AI gates are understandable.
- [ ] Pricing and trial copy are consistent across screens.
- [ ] Restore purchase works before release.

## Regression Smoke Test

- [ ] Fresh launch -> onboarding -> finish -> Home.
- [ ] Home -> Categories -> search -> recipe detail -> save -> Saved.
- [ ] Recipe detail -> shopping list -> check item -> share.
- [ ] Home -> Pantry Magic -> edit pantry -> ready recipe -> detail.
- [ ] Make Hub -> Scan -> permission denied -> recovery copy.
- [ ] Make Hub -> Build -> guest auth prompt/sign-up path.
- [ ] Settings -> currency -> change currency -> verify prices.
- [ ] Settings -> sign out -> restart app -> expected route.

## Finding Template

Use one row per issue.

| ID | Area | Device | Severity | Steps | Expected | Actual | Screenshot/Video | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 001 |  |  | Low / Medium / High / Critical |  |  |  |  |  | Open |


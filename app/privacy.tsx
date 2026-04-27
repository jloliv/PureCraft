import { LegalArticle, type ArticleSection } from '@/components/legal-article';

const SECTIONS: ArticleSection[] = [
  {
    heading: 'What data we collect',
    body: 'We keep PureCraft minimal on purpose. We collect your name and email when you create an account, and a small set of preferences you choose to share — household profile, allergies, favorite recipes, and the ingredients you mark as on hand. We don’t collect anything we don’t actively use.',
  },
  {
    heading: 'Pantry ingredients you add',
    body: 'Your pantry list is stored privately on your device and synced to your account. It’s used only to suggest recipes you can make right now and to plan shopping lists. We never share your pantry with brands or advertisers.',
  },
  {
    heading: 'Preferences and allergies',
    body: 'Allergy and household preferences (baby-safe, pet-safe, fragrance-free, etc.) are used to filter recipes and surface safe alternatives. These preferences are personal to you and are not shared outside your account.',
  },
  {
    heading: 'Saved recipes',
    body: 'Recipes you save, favorite, or mark as made are stored to power your library, your savings dashboard, and your collections. You can clear this history at any time from Settings → Delete Account.',
  },
  {
    heading: 'Usage analytics',
    body: 'We use privacy-respecting analytics to understand which features help and which don’t. Analytics are aggregated and anonymized. We do not collect precise location, contacts, photos, or any identifiers tied to advertising networks.',
  },
  {
    heading: 'How we protect your data',
    body: 'Data is encrypted in transit (TLS) and at rest. Access is limited to the small team that maintains PureCraft, audited regularly. We use independent providers for hosting and analytics — each is bound by data-processing agreements that match this policy.',
  },
  {
    heading: 'We do not sell personal data',
    body: 'We have never sold personal data and we never will. PureCraft is funded by subscriptions to PureCraft+, not by advertising. If our business model ever changes, we will tell you in plain language before anything moves.',
  },
  {
    heading: 'Contact support',
    body: 'Questions, requests to access or delete your data, or anything that doesn’t feel right — email privacy@purecraft.app and a real person will respond within two business days.',
  },
];

export default function Privacy() {
  return (
    <LegalArticle
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="A short, plain-English summary of what we collect, what we don’t, and the choices you have."
      effectiveDate="April 1, 2026"
      sections={SECTIONS}
      contactLine="Questions? Email privacy@purecraft.app — a real person responds within 2 business days."
    />
  );
}

import { LegalArticle, type ArticleSection } from '@/components/legal-article';

const SECTIONS: ArticleSection[] = [
  {
    heading: 'Using recipes responsibly',
    body: 'PureCraft recipes are everyday household and personal-care formulations. They are meant to be made with reasonable care — read every step, follow the listed amounts, and respect the warnings before mixing.',
  },
  {
    heading: 'Safety disclaimer',
    body: 'We test recipes for typical home conditions but cannot anticipate every kitchen, surface, allergy, or skin sensitivity. PureCraft is provided for informational purposes and is not a substitute for medical, dermatological, or professional cleaning advice. If something stings, smells off, or reacts unexpectedly — stop, ventilate, and rinse.',
  },
  {
    heading: 'DIY use at your own discretion',
    body: 'You agree to use PureCraft recipes at your own discretion and at your own risk. PureCraft, its team, and its partners are not liable for damage to surfaces, materials, fabrics, or property, or for personal injury, allergic reaction, or any other adverse outcome resulting from making or using a recipe.',
  },
  {
    heading: 'Subscription billing terms',
    body: 'PureCraft+ is offered as a recurring subscription billed through your platform’s app store (Apple or Google). Subscriptions renew automatically until canceled. You can cancel anytime from your platform account — cancellation takes effect at the end of the current billing period and no partial refunds are issued.',
  },
  {
    heading: 'Account responsibilities',
    body: 'You are responsible for keeping your login credentials secure and for any activity under your account. If you believe your account has been accessed without your permission, contact support@purecraft.app immediately and we will help secure it.',
  },
  {
    heading: 'Intellectual property',
    body: 'Recipes, copy, photography, and the PureCraft brand are the property of PureCraft and its licensors. You may make recipes for personal household use and share results with friends and family. Republishing recipes commercially, repackaging the app’s content, or training models on it requires written permission.',
  },
  {
    heading: 'Updates to terms',
    body: 'We may update these terms as PureCraft evolves. When we make material changes, we’ll notify you in-app at least 14 days before the new terms take effect. Continued use of PureCraft after the effective date counts as acceptance.',
  },
  {
    heading: 'Contact support',
    body: 'For questions about these terms, billing, or your account, email support@purecraft.app — a real person will respond within two business days.',
  },
];

export default function Terms() {
  return (
    <LegalArticle
      eyebrow="Terms"
      title="Terms of Use"
      intro="The rules of the road for using PureCraft. Plain language, no surprises, written to be read."
      effectiveDate="April 1, 2026"
      sections={SECTIONS}
      contactLine="Questions? Email support@purecraft.app — a real person responds within 2 business days."
    />
  );
}

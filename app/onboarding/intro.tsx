import { router } from 'expo-router';

import OnboardingIntro from '@/app/screens/OnboardingIntro';

export default function IntroRoute() {
  return <OnboardingIntro onGetStarted={() => router.push('/onboarding/intent')} />;
}

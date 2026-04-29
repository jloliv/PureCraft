import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadow, Spacing, Type } from '@/constants/theme';
import { tapLight } from '@/lib/haptics';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FAQ = { q: string; a: string };

type Section = {
  title: string;
  items: FAQ[];
};

const SECTIONS: Section[] = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'What is PureCraft?',
        a: 'PureCraft helps you create safe, natural recipes for your home, body, and lifestyle.',
      },
      {
        q: 'How does personalization work?',
        a: 'We tailor every recipe based on your sensitivities, preferences, and household needs.',
      },
    ],
  },
  {
    title: 'Recipes & Ingredients',
    items: [
      {
        q: 'How do I use a recipe?',
        a: 'Follow the steps and measurements provided. Each recipe is designed to be simple and effective.',
      },
      {
        q: 'Can I substitute ingredients?',
        a: 'Yes — many ingredients can be swapped. We recommend sticking to suggested alternatives for best results.',
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        q: 'What is Pantry Magic?',
        a: 'Pantry Magic suggests recipes based on ingredients you already have.',
      },
      {
        q: 'How do I save recipes?',
        a: 'Tap the heart icon to save recipes to your collection.',
      },
    ],
  },
  {
    title: 'Premium',
    items: [
      {
        q: 'What does premium include?',
        a: 'Premium unlocks more recipes, advanced features, and unlimited saving.',
      },
      {
        q: 'Why are there limits?',
        a: 'Limits help you experience the app before upgrading.',
      },
    ],
  },
];

export default function HelpCenter() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => {
    tapLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Help Center</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => {
                const key = `${section.title}::${item.q}`;
                const isOpen = openKey === key;
                const isLast = index === section.items.length - 1;
                return (
                  <View
                    key={key}
                    style={[styles.row, isLast && { borderBottomWidth: 0 }]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      onPress={() => toggle(key)}
                      style={({ pressed }) => [
                        styles.rowHeader,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.rowQuestion}>{item.q}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.light.textSubtle}
                      />
                    </Pressable>
                    {isOpen ? <Text style={styles.rowAnswer}>{item.a}</Text> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.contactBlock}>
          <Text style={styles.contactPrompt}>Still need help?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Contact Support"
            onPress={() =>
              Linking.openURL('mailto:hello@purecraftliving.com?subject=PureCraft Support')
            }
            style={({ pressed }) => [
              styles.contactBtn,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </Pressable>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { ...Type.bodyStrong, color: Colors.light.text },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  section: { marginTop: Spacing.lg },
  sectionTitle: {
    ...Type.caption,
    color: Colors.light.sageDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  row: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowQuestion: {
    ...Type.bodyStrong,
    color: Colors.light.text,
    flex: 1,
  },
  rowAnswer: {
    ...Type.caption,
    color: Colors.light.textMuted,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  contactBlock: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactPrompt: {
    ...Type.body,
    color: Colors.light.textMuted,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.sageDeep,
  },
  contactBtnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
});

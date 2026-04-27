import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';

export type ArticleSection = {
  heading: string;
  body: string;
};

export function LegalArticle({
  eyebrow,
  title,
  intro,
  effectiveDate,
  sections,
  contactLine,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveDate: string;
  sections: ArticleSection[];
  contactLine?: string;
}) {
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
        <Text style={styles.topTitle}>{eyebrow}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.intro}>{intro}</Text>
          <View style={styles.metaPill}>
            <Ionicons name="calendar-outline" size={11} color={Colors.light.sageDeep} />
            <Text style={styles.metaText}>Effective {effectiveDate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sections}>
          {sections.map((s, i) => (
            <View key={s.heading} style={[styles.section, i === 0 && { marginTop: 0 }]}>
              <View style={styles.sectionMarkRow}>
                <View style={styles.sectionMark} />
                <Text style={styles.sectionHeading}>{s.heading}</Text>
              </View>
              <Text style={styles.sectionBody}>{s.body}</Text>
            </View>
          ))}
        </View>

        {contactLine ? (
          <View style={styles.contactCard}>
            <Ionicons name="mail-outline" size={16} color={Colors.light.sageDeep} />
            <Text style={styles.contactText}>{contactLine}</Text>
          </View>
        ) : null}

        <View style={{ height: Spacing.xxxl }} />
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
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  headerWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: Colors.light.sageDeep,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.8,
  },
  intro: {
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.light.textMuted,
    marginTop: 12,
    fontWeight: '400',
  },
  metaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.light.sageSoft,
    borderWidth: 1,
    borderColor: Colors.light.sage,
    marginTop: 16,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.sageDeep,
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.lg,
  },

  sections: { gap: 0 },
  section: {
    marginTop: Spacing.xl,
  },
  sectionMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionMark: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.light.sageDeep,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textMuted,
    fontWeight: '400',
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.creamDeep,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
    lineHeight: 18,
  },
});

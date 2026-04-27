import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney, useCurrency } from '@/constants/currency';
import {
  formatPlasticWeight,
  formatRange,
  useSavingsStats,
} from '@/constants/savings';

const PALETTE = {
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

export function SavingsDashboard({ onPressBreakdown }: { onPressBreakdown?: () => void }) {
  const { currency } = useCurrency();
  const stats = useSavingsStats();

  const todayLine =
    stats.todayUsd > 0
      ? `You saved ${formatMoney(stats.todayUsd, { currency })} today`
      : stats.recipesLifetime > 0
        ? 'No recipe made today — your pantry is ready when you are.'
        : 'Make your first recipe to start saving.';

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#F7F2E7', '#F8F6F1', '#E4EDE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.eyebrowPill}>
            <View style={styles.livePulse} />
            <Text style={styles.eyebrowText}>Updated today</Text>
          </View>
          <View style={styles.estimatePill}>
            <Ionicons name="shield-checkmark-outline" size={11} color={PALETTE.sageDeep} />
            <Text style={styles.estimateText}>Est. vs retail</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>This month</Text>
        <Text style={styles.heroValue}>
          {formatMoney(stats.monthUsd, { currency, round: true })}
          <Text style={styles.heroValueSuffix}> saved</Text>
        </Text>
        <Text style={styles.heroSub}>{todayLine}</Text>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <Stat
            label="Lifetime"
            value={formatMoney(stats.lifetimeUsd, { currency, round: true })}
            sub={
              stats.lifetimeLowUsd > 0
                ? `range ${formatRange(stats.lifetimeLowUsd, stats.lifetimeHighUsd, {
                    currency,
                    round: true,
                  })}`
                : '—'
            }
            tint={PALETTE.sageDeep}
          />
          <View style={styles.statDivider} />
          <Stat
            label="Bottles avoided"
            value={`${stats.bottlesLifetime}`}
            sub={`≈ ${formatPlasticWeight(stats.bottlesLifetime)} plastic`}
            tint={PALETTE.goldDeep}
          />
          <View style={styles.statDivider} />
          <Stat
            label="Recipes made"
            value={`${stats.recipesLifetime}`}
            sub={
              stats.recipesMonth > 0
                ? `+${stats.recipesMonth} this month`
                : 'all time'
            }
            tint={'#9C7A4F'}
          />
        </View>

        <Pressable
          onPress={onPressBreakdown}
          accessibilityRole="button"
          accessibilityLabel="View savings breakdown"
          style={({ pressed }) => [styles.footerRow, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="information-circle-outline" size={13} color={PALETTE.textMuted} />
          <Text style={styles.footerText}>
            Estimated against mid-tier retail · ranges shown when uncertain
          </Text>
          <Ionicons name="chevron-forward" size={14} color={PALETTE.textSubtle} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function Stat({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  tint: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: tint }]}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  card: {
    padding: 22,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  eyebrowText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  estimatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFFB3',
    borderWidth: 1,
    borderColor: PALETTE.sageSoft,
  },
  estimateText: {
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -1.2,
  },
  heroValueSuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.textMuted,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.65,
    marginVertical: 18,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#FFFFFFB3',
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 9.5,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.4,
  },
  statSub: {
    fontSize: 10.5,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },

  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFFB3',
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: PALETTE.textMuted,
    lineHeight: 14,
  },
});

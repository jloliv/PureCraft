import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FreemiumModal } from './freemium-modal';
import { checkPantryScanGate } from '@/lib/freemium';
import { tapLight, tapMedium, tapSoft } from '@/lib/haptics';

const PALETTE = {
  bg: '#F8F6F1',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  surface: '#FFFFFF',
  surfaceWarm: '#F1ECE0',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  gold: '#C7A96B',
  goldDeep: '#A98A4D',
};

export type MakeNavTab = 'home' | 'discover' | 'saved' | 'profile';

type MakeAction = {
  key: string;
  title: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  badge?: string;
  route: string;
  /** When true, tapping shows the `pantry-preview` freemium gate instead
   *  of navigating directly. The preview modal then routes to /premium. */
  premiumGate?: boolean;
};

const ACTIONS: MakeAction[] = [
  {
    key: 'recipe',
    title: 'Make a Recipe Now',
    blurb: 'Browse curated recipes and start mixing.',
    icon: 'sparkles',
    tint: '#7E8F75',
    badge: 'Popular',
    route: '/categories',
  },
  {
    key: 'pantry',
    title: 'Use Ingredients I Have',
    blurb: 'Match your cabinet to instant recipes.',
    icon: 'leaf',
    tint: '#5C7F6B',
    route: '/pantry',
  },
  {
    key: 'scan',
    title: 'Scan Product for DIY Version',
    blurb: 'Snap any label, get the pure version.',
    icon: 'scan',
    tint: '#9C7A4F',
    badge: 'New',
    route: '/scan',
  },
  {
    key: 'custom',
    title: 'Build Custom Formula',
    blurb: 'AI helps you craft it from scratch.',
    icon: 'flask',
    tint: '#6F5FA3',
    route: '/build',
  },
  {
    key: 'add-ingredient',
    title: 'Add Ingredient to Pantry',
    blurb: 'Keep your pantry up to date.',
    icon: 'add-circle',
    tint: '#A98A4D',
    route: '/pantry?add=1',
  },
  {
    key: 'scan-to-pantry',
    title: 'Scan to Pantry',
    blurb: 'Add ingredients instantly instead of typing.',
    icon: 'scan-circle',
    tint: '#7E8F75',
    badge: 'PureCraft+',
    route: '/pantry',
    premiumGate: true,
  },
  {
    key: 'save-recipe',
    title: 'Save My Own Recipe',
    blurb: 'Capture a recipe you already love.',
    icon: 'bookmark',
    tint: '#B86F44',
    route: '/my-recipe',
  },
];

export function MakeNav({ active }: { active: MakeNavTab }) {
  const [open, setOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: open ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  return (
    <>
      <View style={styles.bottomNav}>
        <NavItem
          icon={active === 'home' ? 'home' : 'home-outline'}
          label="Home"
          active={active === 'home'}
          onPress={() => {
            tapLight();
            router.push('/home');
          }}
        />
        <NavItem
          icon={active === 'discover' ? 'compass' : 'compass-outline'}
          label="Discover"
          active={active === 'discover'}
          onPress={() => {
            tapLight();
            router.push('/discover');
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Make Hub"
          onPressIn={() =>
            Animated.spring(scale, {
              toValue: 0.92,
              useNativeDriver: true,
              friction: 6,
              tension: 220,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              friction: 4,
              tension: 220,
            }).start()
          }
          onPress={() => {
            tapMedium();
            setOpen(true);
          }}
          hitSlop={12}
        >
          <Animated.View style={[styles.makeButton, { transform: [{ scale }] }]}>
            <LinearGradient
              colors={['#A8B8A0', '#7E8F75', '#5C7F6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.makeButtonGradient}
            >
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
            <View style={styles.makePulse} pointerEvents="none" />
          </Animated.View>
        </Pressable>
        <NavItem
          icon={active === 'saved' ? 'bookmark' : 'bookmark-outline'}
          label="Saved"
          active={active === 'saved'}
          onPress={() => {
            tapLight();
            router.push('/saved');
          }}
        />
        <NavItem
          icon={active === 'profile' ? 'person' : 'person-outline'}
          label="Profile"
          active={active === 'profile'}
          onPress={() => {
            tapLight();
            router.push('/settings');
          }}
        />
      </View>

      <MakeSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function MakeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const screenH = Dimensions.get('window').height;
  const translate = useRef(new Animated.Value(screenH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const items = useRef(ACTIONS.map(() => new Animated.Value(0))).current;
  const [mounted, setMounted] = useState(false);
  const [pantryGate, setPantryGate] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      items.forEach((v) => v.setValue(0));
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translate, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.stagger(
        50,
        items.map((v) =>
          Animated.spring(v, {
            toValue: 1,
            damping: 18,
            stiffness: 220,
            useNativeDriver: true,
          })
        )
      ).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: screenH,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, fade, translate, items, screenH, mounted]);

  const go = (action: MakeAction) => {
    tapSoft();
    // Premium-gated actions show the soft preview modal first; only after
    // the user taps Continue do we route to /premium.
    if (action.premiumGate) {
      const gate = checkPantryScanGate();
      if (!gate.allow) {
        onClose();
        setTimeout(() => setPantryGate(true), 220);
        return;
      }
    }
    onClose();
    setTimeout(() => router.push(action.route as never), 200);
  };

  if (!mounted && !visible && !pantryGate) return null;

  return (
    <>
      <FreemiumModal
        visible={pantryGate}
        kind="pantry-preview"
        onClose={() => setPantryGate(false)}
      />
    <Modal
      transparent
      visible={mounted}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(15,18,16,0.55)', opacity: fade },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: translate }] }]}
      >
        <LinearGradient
          colors={['#F7F2E7', '#F8F6F1', '#EFE7D2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheetGradient}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.sheetEyebrow}>The Make Hub</Text>
            </View>
            <Text style={styles.sheetTitle}>
              What would you like{`\n`}to create today?
            </Text>
            <Text style={styles.sheetSub}>
              Six ways to start something pure. Pick one — we&apos;ll guide every step.
            </Text>
          </View>

          <View style={styles.actions}>
            {ACTIONS.map((a, i) => {
              const v = items[i];
              const tY = v.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              });
              return (
                <Animated.View
                  key={a.key}
                  style={{ opacity: v, transform: [{ translateY: tY }] }}
                >
                  <Pressable
                    onPress={() => go(a)}
                    style={({ pressed }) => [
                      styles.actionCard,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.actionIcon,
                        { backgroundColor: a.tint + '1A', borderColor: a.tint + '33' },
                      ]}
                    >
                      <Ionicons name={a.icon} size={20} color={a.tint} />
                    </View>
                    <View style={styles.actionBody}>
                      <View style={styles.actionTitleRow}>
                        <Text style={styles.actionTitle}>{a.title}</Text>
                        {a.badge ? (
                          <View
                            style={[
                              styles.actionBadge,
                              {
                                backgroundColor: a.tint + '1F',
                                borderColor: a.tint + '4D',
                              },
                            ]}
                          >
                            <Text style={[styles.actionBadgeText, { color: a.tint }]}>
                              {a.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.actionBlurb}>{a.blurb}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={PALETTE.textSubtle}
                    />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Text style={styles.closeBtnText}>Maybe later</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </Modal>
    </>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={onPress} hitSlop={6}>
      <Ionicons
        name={icon}
        size={20}
        color={active ? PALETTE.sageDeep : PALETTE.textSubtle}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 22,
    height: 76,
    borderRadius: 34,
    // Faux frosted glass — translucent white + subtle cream border. Replace
    // with <BlurView intensity={40} tint="light"/> when expo-blur is added.
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: '#F0EADA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 18,
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  navItem: { width: 56, alignItems: 'center', gap: 3 },
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    color: PALETTE.textSubtle,
  },
  navLabelActive: { color: PALETTE.sageDeep },

  makeButton: {
    width: 62,
    height: 62,
    borderRadius: 999,
    marginTop: -32,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    overflow: 'visible',
  },
  makeButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  makePulse: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: PALETTE.gold,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#1F1F1F',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
  sheetGradient: {
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: PALETTE.border,
    marginBottom: 18,
  },
  sheetHeader: {
    paddingHorizontal: 6,
    marginBottom: 18,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
  },
  sheetEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.6,
  },
  sheetSub: {
    fontSize: 13,
    lineHeight: 18,
    color: PALETTE.textMuted,
    marginTop: 8,
  },

  actions: { gap: 10 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  actionPressed: {
    transform: [{ scale: 0.985 }],
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.sage,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBody: { flex: 1, gap: 3 },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.2,
  },
  actionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  actionBlurb: { fontSize: 12, color: PALETTE.textMuted, lineHeight: 16 },

  closeBtn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textMuted,
    letterSpacing: 0.3,
  },
});

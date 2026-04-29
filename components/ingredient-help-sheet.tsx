import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { findIngredientHelp } from '@/constants/ingredient-help';
import { tapLight, tapMedium, success } from '@/lib/haptics';

const PALETTE = {
  bg: '#FFFBF4',
  text: '#1F1F1F',
  textMuted: '#6F6A60',
  textSubtle: '#A8A398',
  border: '#E8E2D2',
  sage: '#A8B8A0',
  sageDeep: '#7E8F75',
  sageSoft: '#E4EDE5',
  cream: '#F7F2E7',
  creamDeep: '#EFE7D2',
  goldDeep: '#A98A4D',
};

export function IngredientHelpSheet({
  ingredient,
  visible,
  onClose,
  onAddToShoppingList,
}: {
  ingredient: string | null;
  visible: boolean;
  onClose: () => void;
  onAddToShoppingList?: (ingredient: string) => void;
}) {
  const screenH = Dimensions.get('window').height;
  const translate = useRef(new Animated.Value(screenH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [added, setAdded] = useState(false);

  // Hold onto the help for the *last shown* ingredient so the sheet content
  // doesn't snap to empty during the close animation.
  const help = ingredient ? findIngredientHelp(ingredient) : null;
  const lastHelpRef = useRef(help);
  if (help) lastHelpRef.current = help;
  const lastIngredientRef = useRef<string | null>(ingredient);
  if (ingredient) lastIngredientRef.current = ingredient;
  const display = help ?? lastHelpRef.current;
  const displayIngredient = ingredient ?? lastIngredientRef.current;

  useEffect(() => {
    if (visible && help) {
      setMounted(true);
      setAdded(false);
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
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, help, fade, translate, screenH, mounted]);

  if (!mounted && !visible) return null;
  if (!display) return null;

  const handleAdd = () => {
    tapMedium();
    setAdded(true);
    setTimeout(() => success(), 60);
    if (displayIngredient) onAddToShoppingList?.(displayIngredient);
  };

  return (
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
          colors={['#FFFBF4', '#FBF6EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheetGradient}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Ingredient guide</Text>
              <Text style={styles.title}>{display.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={() => {
                tapLight();
                onClose();
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={18} color={PALETTE.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Section label="What it is">
              <Text style={styles.body}>{display.what}</Text>
            </Section>

            {display.whyItWorks ? (
              <Section label="Why it works">
                <Text style={styles.body}>{display.whyItWorks}</Text>
              </Section>
            ) : null}

            {display.where?.length ? (
              <Section label="Where to find it">
                <BulletList items={display.where} />
              </Section>
            ) : null}

            {display.bestOptions?.length ? (
              <Section label="Best options">
                <BulletList items={display.bestOptions} />
              </Section>
            ) : null}

            {display.substitutes?.length ? (
              <Section label="Substitutes">
                <BulletList items={display.substitutes} />
              </Section>
            ) : null}

            {display.tips?.length ? (
              <Section label="Tips">
                <BulletList items={display.tips} />
              </Section>
            ) : null}

            {display.allergyWarnings?.length ? (
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#7A3B2C"
                  />
                  <Text style={styles.warningLabel}>Heads up</Text>
                </View>
                {display.allergyWarnings.map((w) => (
                  <Text key={w} style={styles.warningText}>
                    {w}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add to shopping list"
              onPress={handleAdd}
              disabled={added}
              style={({ pressed }) => [
                styles.cta,
                added && styles.ctaAdded,
                pressed && !added && { opacity: 0.92 },
              ]}
            >
              <Ionicons
                name={added ? 'checkmark' : 'cart-outline'}
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.ctaText}>
                {added ? 'Added to list' : 'Add to Shopping List'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((it) => (
        <View key={it} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
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
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 22,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: PALETTE.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.sageDeep,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.6,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingTop: 18, paddingBottom: 12 },

  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: PALETTE.textMuted,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.text,
    fontWeight: '500',
  },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: PALETTE.text,
    fontWeight: '500',
  },

  warningCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FBEFEC',
    borderWidth: 1,
    borderColor: '#F1D9D2',
    gap: 6,
    marginTop: 4,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningLabel: {
    fontSize: 10.5,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: '#7A3B2C',
    textTransform: 'uppercase',
  },
  warningText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#7A3B2C',
    fontWeight: '500',
  },

  footer: {
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: PALETTE.sageDeep,
    shadowColor: PALETTE.sageDeep,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  ctaAdded: {
    backgroundColor: '#5C7F6B',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

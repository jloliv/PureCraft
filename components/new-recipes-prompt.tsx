// "✨ N new recipes available" — controlled, lightweight prompt that
// replaces the old always-on gold pulse dot on the FAB. Renders nothing
// when there's nothing new; auto-hides after 4s; tap-anywhere routes
// to /discover; X dismisses without navigating. All three exit paths
// call markNewRecipesSeen so the same content never prompts twice.
//
// The animation is intentionally calm — spring scale + fade in over
// 200ms, hold ~3.6s of the 4s budget, fade + soft scale-down 200ms
// out. Sage pill matches the rest of the app's "good news" palette.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAllRecipes } from '@/constants/recipes-remote';
import { tapLight } from '@/lib/haptics';
import { markNewRecipesSeen, useNewRecipesCount } from '@/lib/new-recipes';

// Total time the pill stays on screen end-to-end (entry + hold + exit).
const VISIBLE_MS = 4000;
const ANIM_MS = 200;

export function NewRecipesPrompt() {
  const newCount = useNewRecipesCount();
  const recipes = useAllRecipes();
  const currentCount = recipes.length;

  // Single-fire: once we've shown the prompt for a given new-content
  // delta, don't re-fire on subsequent renders even if the user is
  // still on Home. The mark-seen call updates persisted state, but
  // useNewRecipesCount won't re-read until next mount, so we also
  // gate locally with this ref.
  const handledRef = useRef(false);
  const [visible, setVisible] = useState(false);

  // Show the pill when newCount > 0 and we haven't shown it this mount.
  useEffect(() => {
    if (newCount <= 0) return;
    if (handledRef.current) return;
    handledRef.current = true;
    setVisible(true);
  }, [newCount]);

  // Animated values for the entry / exit transition.
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.85);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
    ]).start();
    // Auto-hide after the budget is up. We mark-seen on auto-hide too
    // so users don't see the same prompt every app open — that's the
    // "do not become notification fatigue" guardrail from the spec.
    const t = setTimeout(() => {
      handleClose(true);
    }, VISIBLE_MS - ANIM_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = (markSeen: boolean) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.94,
        duration: ANIM_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setVisible(false);
    });
    if (markSeen) {
      void markNewRecipesSeen(currentCount);
    }
  };

  const handleAction = () => {
    tapLight();
    handleClose(true);
    router.push('/discover');
  };

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Pressable
          onPress={handleAction}
          accessibilityRole="button"
          accessibilityLabel={`See ${newCount} new ${newCount === 1 ? 'recipe' : 'recipes'}`}
          style={({ pressed }) => [styles.pill, pressed && { opacity: 0.92 }]}
        >
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          <Text style={styles.text}>
            {newCount === 1
              ? '1 new recipe available'
              : `${newCount} new recipes available`}
          </Text>
          <Pressable
            onPress={(e) => {
              // Stop the outer Pressable's onPress from also firing —
              // tapping the X means "dismiss without navigating."
              e.stopPropagation();
              tapLight();
              handleClose(true);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss new recipes notice"
            style={styles.dismiss}
          >
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // pointerEvents="box-none" so taps pass through the outer wrap to
  // whatever is below — only the pill itself receives gestures.
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 18,
    paddingRight: 12,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#5C7F6B',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dismiss: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

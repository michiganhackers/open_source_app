import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Calls `stop` when the screen loses focus, the app is backgrounded (a hidden
 * browser tab on web), or the component unmounts. Keeps the mic and speaker
 * from running when the user can't see that they're active.
 */
export function useStopOnLeave(stop: () => void) {
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useFocusEffect(
    useCallback(() => {
      return () => stopRef.current();
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopRef.current();
    });
    return () => {
      subscription.remove();
      stopRef.current();
    };
  }, []);
}

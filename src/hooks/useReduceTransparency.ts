import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True when the user turned on Reduce Transparency (Settings, Accessibility, Display). */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then((enabled) => {
        if (active) setReduce(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}

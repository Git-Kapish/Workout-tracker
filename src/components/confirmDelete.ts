import { Alert } from 'react-native';

/** Native confirmation before any delete. Resolves true only if the user taps "Delete". */
export function confirmDelete(exerciseName: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Delete this entry?',
      `${exerciseName} will be removed from your log. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

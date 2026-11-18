import { Alert } from 'react-native';

export type EraseChoice = 'cancel' | 'export' | 'erase';

/**
 * Two steps before everything is deleted: first a choice that offers a backup, then a final
 * "this cannot be undone". Resolves 'erase' only if the user confirms both.
 */
export async function confirmErase(entryCount: number): Promise<EraseChoice> {
  const first = await new Promise<EraseChoice>((resolve) => {
    Alert.alert(
      'Delete all your data?',
      `All ${entryCount} logged ${entryCount === 1 ? 'exercise' : 'exercises'} will be removed from this phone for good. Export a backup first if you might want them back.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
        { text: 'Export first', onPress: () => resolve('export') },
        { text: 'Continue', style: 'destructive', onPress: () => resolve('erase') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
  if (first !== 'erase') return first;

  return new Promise<EraseChoice>((resolve) => {
    Alert.alert(
      'Are you sure?',
      'This cannot be undone. Your whole history will be gone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
        { text: 'Delete everything', style: 'destructive', onPress: () => resolve('erase') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
}

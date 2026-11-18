import { useCallback, useRef, useState } from 'react';

import { useRepository } from './useRepository';

/** Counting and deleting everything the user has logged. Only the entries go; settings stay. */
export function useEraseData() {
  const repository = useRepository();
  const running = useRef(false);
  const [erasing, setErasing] = useState(false);

  const count = useCallback(async () => (await repository.getAll()).length, [repository]);

  /** 'failed' leaves the data exactly as it was. */
  const erase = useCallback(async (): Promise<'done' | 'failed' | 'busy'> => {
    if (running.current) return 'busy';
    running.current = true;
    setErasing(true);
    try {
      await repository.removeAll();
      return 'done';
    } catch (error) {
      console.error('Delete all data failed', error);
      return 'failed';
    } finally {
      running.current = false;
      setErasing(false);
    }
  }, [repository]);

  return { count, erase, erasing };
}

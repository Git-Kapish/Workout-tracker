import { router } from 'expo-router';

import { ExportButton } from './ExportButton';
import { GlassGroup } from './GlassSurface';
import { RoundButton } from './RoundButton';

/** Today's header buttons: export, and Settings. They sit together as one glass group. */
export function HeaderActions() {
  return (
    <GlassGroup>
      <ExportButton />
      <RoundButton icon="sliders" label="Settings" onPress={() => router.push('/settings')} />
    </GlassGroup>
  );
}

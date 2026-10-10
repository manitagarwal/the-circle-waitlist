import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Collapsible } from './Collapsible';
import { Row, Sheet, State } from './lists';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { loadInterestGroups } from '@/lib/interests';

type Groups = Awaited<ReturnType<typeof api.interestGroups>>;

/** Pick one activity from the collapsible buckets. */
export function ActivityPicker({ visible, onClose, onPick, selectedId, bookableOnly }: { visible: boolean; onClose: () => void; onPick: (a: { id: number; name: string }) => void; selectedId?: number | null; bookableOnly?: boolean }) {
  const [groups, setGroups] = useState<Groups | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (visible && !groups) loadInterestGroups(() => api.interestGroups()).then(setGroups).catch((e) => setErr(friendly(e))); }, [visible, groups]);
  return (
    <Sheet visible={visible} onClose={onClose} title="Activity">
      <ScrollView>
        <State loading={!groups && !err} error={err} />
        {groups?.filter((g) => !bookableOnly || g.bookings_allowed).map((g) => (
          <Collapsible key={g.id} title={g.name} count={g.interests.length} defaultOpen={g.interests.some((i) => i.id === selectedId)}>
            {g.interests.map((i) => <Row key={i.id} title={i.name} onPress={() => onPick({ id: i.id, name: i.name })} />)}
          </Collapsible>
        ))}
      </ScrollView>
    </Sheet>
  );
}

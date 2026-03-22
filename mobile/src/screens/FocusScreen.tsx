import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import { useAuth } from "../context/AuthContext";
import { colors, layout, space, typography, radius, shadowSoft } from "../theme";
import { Button, SectionLabel } from "../components/ui";

type Track = { id: string; title: string; duration_minutes: number; audio_url: string };

export default function FocusScreen() {
  const { api } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<{ tracks: Track[] }>("focus/tracks/");
      setTracks(data.tracks);
    })().catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [api]);

  async function stop() {
    const sn = soundRef.current;
    if (sn) {
      await sn.stopAsync().catch(() => {});
      await sn.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlaying(null);
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={layout.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.note}>Demo streams for playback only.</Text>
      {busy ? <ActivityIndicator color={colors.primary} style={{ marginBottom: space.md }} /> : null}
      <Button variant="secondary" title="Stop playback" onPress={stop} />
      <SectionLabel style={{ marginTop: space.xl }}>Tracks</SectionLabel>
      {tracks.map((t) => (
        <View key={t.id} style={[s.card, shadowSoft]}>
          <Text style={typography.h2}>{t.title}</Text>
          <Text style={typography.caption}>{t.duration_minutes} min</Text>
          <View style={s.btnWrap}>
            <Button
              title={playing === t.id ? "Playing" : "Play"}
              onPress={async () => {
                setBusy(true);
                try {
                  await stop();
                  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
                  const { sound } = await Audio.Sound.createAsync({ uri: t.audio_url });
                  soundRef.current = sound;
                  setPlaying(t.id);
                  await sound.playAsync();
                } finally {
                  setBusy(false);
                }
              }}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  note: { ...typography.caption, marginBottom: space.md, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnWrap: { marginTop: space.md },
});

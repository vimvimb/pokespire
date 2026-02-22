# Audio

## Background Music Normalization

Background music tracks in `assets/music/` should be loudness-normalized so they play at consistent volume relative to each other. Use ffmpeg's EBU R128 loudnorm filter for perceptual loudness normalization (LUFS).

### Batch: Normalize All Music Tracks

Run from the project root:

```bash
ffmpeg -i assets/music/early_boss_rocket_battle_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/early_boss_rocket_battle_remix_normalized.mp3
ffmpeg -i assets/music/early_dungeon_hazy_pass_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/early_dungeon_hazy_pass_remix_normalized.mp3
ffmpeg -i assets/music/final_boss_mewtwo_battle_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/final_boss_mewtwo_battle_remix_normalized.mp3
ffmpeg -i assets/music/final_dungeon_rocket_hideout_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/final_dungeon_rocket_hideout_remix_normalized.mp3
ffmpeg -i assets/music/regular_battle_johto_trainer_battle_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/regular_battle_johto_trainer_battle_remix_normalized.mp3
```

Then replace the originals with the normalized versions:

```bash
mv assets/music/early_boss_rocket_battle_remix_normalized.mp3 assets/music/early_boss_rocket_battle_remix.mp3
mv assets/music/early_dungeon_hazy_pass_remix_normalized.mp3 assets/music/early_dungeon_hazy_pass_remix.mp3
mv assets/music/final_boss_mewtwo_battle_remix_normalized.mp3 assets/music/final_boss_mewtwo_battle_remix.mp3
mv assets/music/final_dungeon_rocket_hideout_remix_normalized.mp3 assets/music/final_dungeon_rocket_hideout_remix.mp3
mv assets/music/regular_battle_johto_trainer_battle_remix_normalized.mp3 assets/music/regular_battle_johto_trainer_battle_remix.mp3
```

### Batch: Campaign 2 — Threads of Time

Run from the project root:

```bash
ffmpeg -i assets/music/celebi_dungeon_lush_forest_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/celebi_dungeon_lush_forest_remix_normalized.mp3
ffmpeg -i assets/music/past_dungeon_ecruteak_city_remix.wav -ar 44100 -ac 2 -b:a 192k -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/past_dungeon_ecruteak_city_remix.mp3
ffmpeg -i assets/music/hooh_dungeon_tin_tower_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/hooh_dungeon_tin_tower_remix_normalized.mp3
ffmpeg -i assets/music/lugia_dungeon_burned_tower_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/lugia_dungeon_burned_tower_remix_normalized.mp3
ffmpeg -i assets/music/regular_battle_johto_gym_leader_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/regular_battle_johto_gym_leader_remix_normalized.mp3
ffmpeg -i assets/music/celebi_boss_time_gear_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/celebi_boss_time_gear_remix_normalized.mp3
ffmpeg -i assets/music/gold_silver_boss_johto_rival_battle_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/gold_silver_boss_johto_rival_battle_remix_normalized.mp3
ffmpeg -i assets/music/recruitable_boss_legendary_beast_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/recruitable_boss_legendary_beast_remix_normalized.mp3
ffmpeg -i assets/music/hooh_lugia_boss_johto_boss_remix.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/hooh_lugia_boss_johto_boss_remix_normalized.mp3
```

Then replace the originals with the normalized versions:

```bash
mv assets/music/celebi_dungeon_lush_forest_remix_normalized.mp3 assets/music/celebi_dungeon_lush_forest_remix.mp3
# past_dungeon_ecruteak_city_remix: WAV → MP3 conversion is part of the ffmpeg command above (no mv needed)
mv assets/music/hooh_dungeon_tin_tower_remix_normalized.mp3 assets/music/hooh_dungeon_tin_tower_remix.mp3
mv assets/music/lugia_dungeon_burned_tower_remix_normalized.mp3 assets/music/lugia_dungeon_burned_tower_remix.mp3
mv assets/music/regular_battle_johto_gym_leader_remix_normalized.mp3 assets/music/regular_battle_johto_gym_leader_remix.mp3
mv assets/music/celebi_boss_time_gear_remix_normalized.mp3 assets/music/celebi_boss_time_gear_remix.mp3
mv assets/music/gold_silver_boss_johto_rival_battle_remix_normalized.mp3 assets/music/gold_silver_boss_johto_rival_battle_remix.mp3
mv assets/music/recruitable_boss_legendary_beast_remix_normalized.mp3 assets/music/recruitable_boss_legendary_beast_remix.mp3
mv assets/music/hooh_lugia_boss_johto_boss_remix_normalized.mp3 assets/music/hooh_lugia_boss_johto_boss_remix.mp3
```

### Single File: Future Tracks

For a new track `assets/music/example_track.mp3`:

```bash
ffmpeg -i assets/music/example_track.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -y assets/music/example_track_normalized.mp3
mv assets/music/example_track_normalized.mp3 assets/music/example_track.mp3
```

### Parameters

- `I=-16`: Integrated loudness target (LUFS). -16 LUFS is a common target for streaming/YouTube.
- `TP=-1.5`: True peak limit (dBFS). Prevents clipping.
- `LRA=11`: Loudness range. Controls dynamic range.

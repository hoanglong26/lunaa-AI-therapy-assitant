# Graph Report - .  (2026-04-13)

## Corpus Check
- 26 files · ~12,428 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 58 nodes · 48 edges · 21 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 6 edges
2. `getIDB()` - 5 edges
3. `PCMWorker` - 4 edges
4. `initLocalDB()` - 4 edges
5. `embedText()` - 3 edges
6. `preWarmModel()` - 3 edges
7. `saveToLocalDB()` - 3 edges
8. `clearLocalDB()` - 3 edges
9. `generateFiller()` - 2 edges
10. `run()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.3
Nodes (9): clearLocalDB(), debugGetAllDocs(), embedText(), getIDB(), getWorker(), initLocalDB(), preWarmModel(), saveToLocalDB() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.29
Nodes (1): POST()

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (1): PCMWorker

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (2): generateFiller(), run()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 6`** (2 nodes): `test-api.js`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `test-api-2.js`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `list-models.js`, `listModels()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `CustomRealtimeCall.tsx`, `startCall()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `MessageBubble.tsx`, `MessageBubble()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `SummaryModal.tsx`, `handleDownload()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `loadModel()`, `embedding-worker.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `useSpeech.ts`, `useSpeech()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `hark.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `LoadingOverlay.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `Header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._
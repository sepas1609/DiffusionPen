# DiffusionPen — Digital Handwriting Synthesis Engine (DHSE v2.0)

> **Zero-Knowledge, Biomechanically-Faithful Digital Handwriting Synthesis Platform**  
> Mathematically grounded in the Two-Thirds Power Law, cubic Bézier path vectorization, KaTeX AST structured parsing, Three.js 3D environmental realism, and steganographic anti-forgery watermarking.

---

## Architecture Blueprint (The 5-Layer Stack)

The DHSE platform is structured as an isolated five-layer client-heavy architecture where **100% of biometric synthesis and rendering executes locally in the browser via WebAssembly, WebGPU, and Canvas/WebGL**:

- **Layer 5 — Ingestion & Sandbox (Ch. 8, 22, 23):** Real-time calibration sandbox UI, Universal Plugin SDK, and WCAG 2.2 AA dysgraphia/switch-control suite.
- **Layer 4 — Style Extraction & Glyph Vault (Ch. 3, 16, App B.1):** 256-dimensional ViT+SAQ zero-shot style extraction and AES-GCM (256-bit) encrypted IndexedDB vault (`dhse-vault`).
- **Layer 3 — Biomechanical Synthesis Core (Ch. 4–7):** Bigram ligature modeling, compound harmonic sine baseline drift, Gaussian Box-Muller kerning, and Two-Thirds Power Law motor kinematic modulation ($\omega = K \kappa^{2/3}$, $v = K R^{1/3}$).
- **Layer 2 — Structured Content Rendering (Ch. 9–11):** KaTeX AST decomposition for LaTeX math equations, monospace organic jitter grid for code blocks, and Rough.js hand-drawn diagram sketching.
- **Layer 1 — Realism Studio & Physical Continuation (Ch. 12–15, 17):** 4-corner homography document rectification, Hough line transform ruled paper detection, multi-instrument physics (ballpoint, gel, fountain, pencil, marker), Three.js 3D notebook binding warp ($z = -0.04(x+0.5)^2$), and DWT steganographic micro-watermarking.

---

## Chapter Implementation Matrix

| Chapter | Component | Source Location | Description |
|---|---|---|---|
| **Ch. 1 & 2** | System Foundations & Contracts | `src/types/engine.ts` | 5-layer contracts, zero-knowledge privacy invariant |
| **Ch. 3** | Zero-Shot Style Extractor | `src/extractor/StyleExtractor.ts` | 256-dim style vector, SAQ quantization, multi-sample glyph caching |
| **Ch. 4** | Ligature & Connection Engine | `src/engine/LigatureEngine.ts` | Bigram probability matrix, cursive bridge entry/exit angle tangents |
| **Ch. 5** | Natural Imperfections | `src/engine/NaturalImperfections.ts` | Compound sine baseline drift, Box-Muller kerning, 5–15% variance threshold |
| **Ch. 6** | Kinematic Realism | `src/engine/PowerLawModulator.ts` | Two-Thirds Power Law ($\omega = K \kappa^{2/3}$), pressure modulation |
| **Ch. 7** | Bézier Path Vectorization | `src/engine/BezierFitter.ts` | RDP simplification + Schneider least-squares cubic fitting |
| **Ch. 8** | Interactive Calibration Sandbox | `src/sandbox/SandboxApp.tsx` | Real-time drawing canvas, parameter rail, live A/B preview |
| **Ch. 8.1** | Multi-Format Document Importer | `src/importers/FileImporter.ts` | PDF (`pdfjs-dist`), Word DOCX (`mammoth`), TXT, Markdown parser with live Page 1 preview |
| **Ch. 8.2** | Personal Quirks & Verification | `src/engine/PersonalQuirks.ts` | Crossed 7/Z, high T-bars, open/filled dots, scratch-out typo corrections, signature flourish, evaluator highlight tags |
| **Ch. 8.3** | High-DPI Multi-Page PDF Exporter | `src/export/PdfExporter.ts` | Paginated PDF export (`jsPDF`) with authentic ruled paper templates & metadata |
| **Ch. 9** | LaTeX Math Pipeline | `src/structured/LatexRenderer.ts` | KaTeX MathML AST walker, Greek symbol mapper, fallback registry |
| **Ch. 10** | Code Block Handling | `src/structured/CodeBlockHandler.ts` | Language tokenizer, monospace organic jitter grid, syntax color mapping |
| **Ch. 11** | Diagram Sketching | `src/structured/DiagramSketcher.ts` | Rough.js flowchart DSL parser (`[A] -> <B> -> (C)`), sketchy vectors |
| **Ch. 12** | Document Rectification | `src/continuation/DocumentRectifier.ts` | 4-corner homography matrix warping, bilateral illumination normalization |
| **Ch. 13** | Ruled Lines & HPP Segmentation | `src/continuation/LineDetector.ts` | Hough line transform $(\rho, \theta)$, Horizontal Projection Profile text segmentation |
| **Ch. 14** | Multi-Instrument Physics | `src/realism/InstrumentModels.ts` | Ballpoint (striations/skips), Gel (bleed halo), Fountain (nib flex), Pencil (grain) |
| **Ch. 15** | Environmental Realism | `src/realism/WebGLScene.ts` | Three.js 3D binding warp mesh ($z = -0.04(x+0.5)^2$), desk lamp lighting, coffee stains |
| **Ch. 16** | Zero-Knowledge Vault | `src/vault/EncryptedVault.ts` | WebCrypto AES-GCM (256-bit), PBKDF2 (100k iterations), IndexedDB persistence |
| **Ch. 17** | Ethical Micro-Watermarking | `src/security/WatermarkEmbedder.ts` | Spatial micro-kerning & DWT steganography, TS-GATR signature fraud defense |
| **Ch. 18** | Evaluation & QA Benchmarks | `mlops/eval_harness.py` | Character Error Rate (CER), Word Error Rate (WER), Handwriting Distance (HWD) |
| **Ch. 19** | MLOps & Quantization Pipeline | `mlops/train_vit_saq.py`, `quantize.py` | Distributed PyTorch training script, ONNX INT8 dynamic quantizer (660 MB $\to$ 41 MB) |
| **Ch. 20** | Hybrid Cloud & Edge Deployment | `src/sw/service-worker.ts`, `deploy/k8s/` | Workbox PWA caching, FastAPI license server, Kubernetes manifests |
| **Ch. 21** | Security Threat Model | `docs/THREAT_MODEL.md` | STRIDE analysis, GDPR Art 9 / BIPA / CCPA / DPDP compliance matrix |
| **Ch. 22** | Universal Plugin SDK | `src/plugins/DHSEPlugin.ts`, `VSCodePlugin.ts` | Universal plugin interfaces, VSCode companion extension implementation |
| **Ch. 23** | Accessibility Deep-Dive | `src/a11y/AccessibilityEngine.ts` | Dysgraphia tremor stabilizer, 1.5s switch-control scanner, WCAG 2.2 AA audit pass |
| **Ch. 24** | Monetization & Economics | `docs/MONETIZATION.md`, `src/types/pricing.ts` | Pricing tiers, unit economics (Pro LTV/CAC 11.7x), developer REST API |
| **Ch. 25** | Testing & CI/CD Strategy | `tests/`, `package.json` | Vitest automated unit testing pyramid (18/18 tests passing) |
| **Ch. 26** | 18-Month Roadmap | `docs/ROADMAP.md` | Q1–Q6 quarterly milestone tracking |
| **Ch. 27** | Top-15 Risk Register | `docs/RISKS.md` | Comprehensive security, technical, and regulatory risk mitigations |
| **App. A** | Public APIs | `src/engine/DHSEEngine.ts`, `server/main.py` | Universal JavaScript SDK client & FastAPI REST API |
| **App. B** | Storage Schemas | `src/types/vault.ts`, `server/schema.sql` | IndexedDB `dhse-vault` & Cloud Postgres database schemas |
| **App. C** | Academic Bibliography | `docs/REFERENCES.md` | Full literature citations (Graves, CONSTANT, DiffusionPen, Lacquaniti, Viviani) |

---

## Key Studio Features

### 1. Multi-Format Ingestion (PDF, Word DOCX, TXT, MD)
- **Instant Live Page 1 Sample**: Ingest academic assignments, research drafts, or lecture notes and preview the handwritten transformation instantly.
- **Client-Side Text Extraction**: Uses `pdfjs-dist` and `mammoth` entirely within the browser with zero external server upload.

### 2. Personal Quirks & Evaluator Verification ("Highlight Peculiars")
- **Authentic Motor Hallmarks**:
  - European crossed '7' and crossed 'Z'
  - High and looped 't'-bar crossbars
  - Unconventional 'i'-dot gestures (open circle, filled dot, diagonal slash)
  - Realistic scratch-out typo corrections (`~~word~~`) and wavy underlines
  - Personalized wet-ink signature flourish seal block
- **Evaluator Audit Mode**: Toggling **"Highlight Peculiars"** renders dashed annotation halos and provenance badges, allowing department heads and evaluators to quickly verify that the submission exhibits the student's unique physical motor traits.

### 3. Multi-Page Authentic Handwritten PDF Export
- Generates high-DPI vector-fidelity PDFs with paginated layout matching standard notebook, grid, legal, dotted, or blank stationery.
- Includes embedded cryptographic verification watermarks for provenance tracking.

---

## Quick Start & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Interactive Web Sandbox
```bash
npm run dev
```
Navigate to `http://localhost:5173` to explore the live interactive studio.

### 3. Run Automated Tests
```bash
npm test
```
Executes all 18 unit tests across the biomechanical motor simulation, encrypted vault, structured content pipelines, personal quirks, and steganographic watermarking.

### 4. Build Production Bundle
```bash
npm run build
```

### 5. Run Python Evaluation & MLOps Suite
```bash
# Evaluate HTR metrics (CER, WER, HWD)
python3 mlops/eval_harness.py --ref "Handwritten equation" --hyp "Handwritten equation"

# Run MLOps training simulation
python3 mlops/train_vit_saq.py --dry-run

# Run ONNX INT8 dynamic quantization pipeline
python3 mlops/quantize.py
```

### 6. Run FastAPI Cloud License & Watermark Server
```bash
python3 server/main.py
```
API endpoints available at `http://localhost:8080/docs`.

---

## License & Compliance
Built under the zero-knowledge client privacy invariant. No biometric information leaves the user's local device without explicit user cryptographic export.

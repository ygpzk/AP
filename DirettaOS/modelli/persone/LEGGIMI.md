# Il modello delle persone

`model.onnx` è **MediaPipe Selfie Segmentation** (il modello «general» 256 × 256), licenza **Apache 2.0**:
<https://github.com/google-ai-edge/mediapipe> · <https://chuoling.github.io/mediapipe/solutions/selfie_segmentation.html>

L'ONNX viene da <https://huggingface.co/onnx-community/mediapipe_selfie_segmentation> (Apache 2.0), ed è stato
convertito in **opset 9, IR 4** perché Windows ML di Windows 10 (quello che usa `persone.cs` con `LearningModel`)
non legge gli opset nuovi. La conversione è solo di forma, i pesi sono gli stessi:

- `HardSwish` scomposto in `x * clip(x + 3, 0, 6) / 6`;
- i tre `Resize` diventati `Upsample` 2 × (16 → 32, 32 → 64, 64 → 128), con `mode = linear`;
- `Clip` riportato alla forma opset 9 (min/max come attributi), la catena `Shape`/`Slice`/`Concat` delle misure
  tolta (le misure sono fisse), dim `batch_size` messa a 1;
- input `pixel_values` [1, 3, 256, 256] in RGB 0…1 (NCHW), uscita `alphas` [1, 1, 256, 256] in 0…1.

La licenza Apache 2.0 permette di ridistribuirlo: per questo, a differenza del modello dei volti, sta nel
repository. Senza `model.onnx`, `persone.cs` non parte e i muri «dietro di me» restano normali (i pezzi non si
bucano): tutto il resto di Diretta OS funziona lo stesso.

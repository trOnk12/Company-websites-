# Text retrieval experiment

Compare word matching with a small embedding model on the same synthetic help center. The eight documents, twelve English questions and expected document IDs are in [cases.json](cases.json). [results.json](results.json) records the top three results per question. Each question has exactly one expected document. Ties break by document ID.

| Method | Literal top 1 | Paraphrased top 1 | All top 1 | All top 3 |
|---|---:|---:|---:|---:|
| TF-IDF | 6/6 | 1/6 | 7/12 | 9/12 |
| MiniLM | 6/6 | 6/6 | 12/12 | 12/12 |

The documents are fitted as a word-level TF-IDF matrix or encoded with the same MiniLM model as the queries. Both rank with cosine similarity. The model uses masked mean pooling on CPU with a single inference thread.

## Reproduce

Use Python 3.12 in a virtual environment. The model files are downloaded once. The experiment itself uses local files and does not make API calls.

```sh
python -m pip install scikit-learn==1.8.0 onnxruntime==1.23.2 tokenizers==0.22.2
model_dir="$(mktemp -d)"
mkdir -p "$model_dir/onnx"
model_base="https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9"
curl -fLsS "$model_base/tokenizer.json" -o "$model_dir/tokenizer.json"
curl -fLsS "$model_base/onnx/model_quantized.onnx" -o "$model_dir/onnx/model_quantized.onnx"
python run.py --model-dir "$model_dir"
```

Optional file integrity check:

```text
da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0  tokenizer.json
afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1  onnx/model_quantized.onnx
```

To run just the lexical baseline, install scikit-learn and run `python run.py`. This experiment measures retrieval only. It says how the two methods behaved on these hand-authored cases. It does not measure generated answers, larger collections, multilingual performance or exact-code queries.

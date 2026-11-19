"""Compare lexical retrieval and MiniLM embedding retrieval on the same cases."""

import argparse
import json
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DIRECTORY = Path(__file__).resolve().parent


def semantic_scores(model_dir, corpus, queries):
    import onnxruntime
    from tokenizers import Tokenizer

    tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
    tokenizer.enable_padding()
    tokenizer.enable_truncation(max_length=256)
    encoded = tokenizer.encode_batch([*corpus, *queries])
    attention = np.asarray([item.attention_mask for item in encoded], dtype=np.int64)
    tensors = {
        "input_ids": np.asarray([item.ids for item in encoded], dtype=np.int64),
        "attention_mask": attention,
        "token_type_ids": np.asarray([item.type_ids for item in encoded], dtype=np.int64),
    }
    options = onnxruntime.SessionOptions()
    options.intra_op_num_threads = 1
    session = onnxruntime.InferenceSession(
        str(model_dir / "onnx/model_quantized.onnx"),
        sess_options=options,
        providers=["CPUExecutionProvider"],
    )
    inputs = {field.name: tensors[field.name] for field in session.get_inputs()}
    vectors = session.run(["last_hidden_state"], inputs)[0]
    pooled = (vectors * attention[..., None]).sum(axis=1) / attention.sum(axis=1, keepdims=True)
    return cosine_similarity(pooled[len(corpus):], pooled[:len(corpus)])


def evaluate(scores, keys, cases):
    rows = []
    for case, values in zip(cases, scores, strict=True):
        order = sorted(range(len(values)), key=lambda i: (-values[i], keys[i]))
        top = [keys[i] for i in order[:3]]
        rows.append(dict(query=case["query"], type=case["type"], expected=case["expected"], top=top))
    metrics = {}
    for group in ("all", "literal", "paraphrase"):
        relevant = [row for row in rows if group == "all" or row["type"] == group]
        metrics[group] = {
            "queries": len(relevant),
            "hit_at_1": sum(row["top"][0] == row["expected"] for row in relevant),
            "hit_at_3": sum(row["expected"] in row["top"] for row in relevant),
        }
    return dict(metrics=metrics, rankings=rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, help="Local tokenizer and pinned quantized ONNX model")
    args = parser.parse_args()
    data = json.loads((DIRECTORY / "cases.json").read_text(encoding="utf-8"))
    keys = list(data["documents"])
    corpus = list(data["documents"].values())
    cases = data["queries"]
    queries = [case["query"] for case in cases]

    vectorizer = TfidfVectorizer()
    documents = vectorizer.fit_transform(corpus)
    lexical = cosine_similarity(vectorizer.transform(queries), documents)
    output = {"tfidf": evaluate(lexical, keys, cases)}
    if args.model_dir:
        scores = semantic_scores(args.model_dir, corpus, queries)
        output["minilm"] = evaluate(scores, keys, cases)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()

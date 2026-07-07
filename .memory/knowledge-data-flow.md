# Knowledge Data Flow

```text
[Paragraph]
  -> [Tokenizer]
  -> [Tiny seq2seq/generative model in Transformers.js]
  -> [Short generated summary/title]
  -> [Post-process max tokens / strip punctuation]
```

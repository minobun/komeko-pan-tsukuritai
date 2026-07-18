<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# コーディング規約

設計指針（SOLID・レイヤー分離）・命名・テストファーストの開発フロー・PR運用ルールは
`docs/CODING_CONVENTION.md` に従う。実装前に必ず読むこと。

- 仕様→テスト→実装のテストファーストで進める。テストは `npm test` で実行できる。
- PRは小さく保つ（1PR = 1つの関心事。分割の目安・方法は規約参照）。

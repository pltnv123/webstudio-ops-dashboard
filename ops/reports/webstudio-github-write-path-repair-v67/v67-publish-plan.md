# V6.7 publish plan

- source_commit: 1c96cc9e261f13387fcd177e9cb5a58868377a59
- branch: webstudio/product-build-v31
- selected_path: repaired host bridge minimal SHA-preserving git push
- fallback_path: mcp_github_push_files
- safety_gates: local checks, allowlist, changed-files secret scan, git diff check
- live external writes: none
- force_push: prohibited
- branch_delete: prohibited

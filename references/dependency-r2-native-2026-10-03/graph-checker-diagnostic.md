# Initial checker diagnostic

The first exhaustive stage2 graph check exited 1 while interpreting an inherited npm alias:
`@isaacs/cliui@8.0.2 -> string-width-cjs@string-width@4.2.3`.

The unchanged lock actually records the alias target `string-width@4.2.3`, not the concatenated key. The checker now resolves direct names first, then verifies any alias is byte-identical to the accepted stage1 snapshot and resolves the actual package key. This correction does not normalize peer suffixes or accept new alias edges. All earlier target package/importer/snapshot checks had already passed before this diagnostic. It is a checker error, not candidate acceptance or a product regression.

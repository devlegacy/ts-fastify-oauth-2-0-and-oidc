module.exports = (async () => {
  const [
    {
      default: configConventional,
    },
    {
      default: {
        defaultConfig,
        RuleConfigSeverity,
      },
    },
  ] = await Promise.all([
    import('@commitlint/config-conventional'),
    import('cz-git'),
  ])

  const typeEnums = configConventional?.rules?.['type-enum']?.at(2) || []

  /** @type {import('cz-git').UserConfig} */
  return {
    extends: [
      '@commitlint/config-conventional',
    ],
    rules: {
      'type-enum': [
        RuleConfigSeverity.Error,
        'always',
        [
          ...typeEnums,
          // 'imp', // REVIEW: Implement
          // 'update', // REVIEW: Implement
          'wip',
        ],
      ],
    },
    prompt: {
      useEmoji: true,
      types: [
        ...defaultConfig.types,
        {
          value: 'wip',
          name: 'wip:      A work in progress feature',
          emoji: ':construction:',
        },
      ],
    },
  }
})()

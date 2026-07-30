/**
 * User-facing copy, grouped by the screen or component that renders it.
 *
 * Plain constants — import `Strings` and reference a branch directly. There is no
 * i18n runtime and no key-path lookup helper. A handful of entries are small arrow
 * functions rather than bare strings; those are the sentences that interpolate a
 * value (a count, a platform name), and keeping the whole sentence here is the
 * point of the file.
 *
 * Copy that already lives in a structured data table stays there rather than being
 * split across two files: `constants/features.ts` (feature `label` / `note`, which
 * both Settings and the injection engine build from) and `constants/presets.ts`
 * (preset `name` / `description`).
 */
export const Strings = {
  onboarding: {
    goals: {
      title: "What's pulling you in?",
      subtitle: "Pick what you'd like to change.\nWe'll set things up for you.",
      scrolling: 'Endless scrolling',
      reels: 'Reels & Shorts',
      counts: 'Like & follower counts',
      time: 'Losing track of time',
      habit: 'Opening apps out of habit',
    },
    presets: {
      title: 'Pick your mode',
      subtitle: 'Start here. Change anytime in Settings.',
      recommended: 'Recommended',
    },
    done: {
      title: "You're all set",
      subtitle: "Here's what Quiet does for you.",
      dmsWork: 'Your DMs still work',
      staysOnDevice: 'Nothing leaves your phone',
      reversible: 'Change any setting, anytime',
      feedEnds: 'Your feed now has an ending',
    },
    next: 'Next',
    getStarted: 'Get started',
  },

  settings: {
    title: 'Settings',
    subtitle: 'Choose what to hide.',
    loading: 'Loading…',
    master: {
      groupTitle: 'Everywhere',
      groupFooter: "These override individual platform settings while they're on.",
      killAllMetrics: {
        label: 'Kill All Metrics',
        note: 'Hides every like, view, and follower count on every platform.',
      },
      killAllBadges: {
        label: 'Kill All Badges',
        note: 'Removes red dots and notification counts everywhere.',
      },
      messagesOnly: {
        label: 'Messages Only Mode',
        note: 'Every platform opens straight to its inbox.',
      },
      grayscaleEverything: {
        label: 'Grayscale Everything',
        note: 'Desaturates every platform.',
      },
    },
    doctor: {
      row: 'Selector Health',
      groupFooter: 'Checks whether each blocker still finds its target on the live site.',
    },
  },

  doctor: {
    title: 'Selector Health',
    subtitle: 'Tests the blockers against the live site. Screenshot results.',
    waiting: (platformName: string) =>
      `Loading ${platformName} and counting… first report in ~5s.`,
    measuredOn: (path: string) => `Measured on ${path} — `,
    allFound: 'every selector found its target.',
    misses: (count: number) =>
      `${count} selector${count === 1 ? '' : 's'} found nothing (red).`,
    textKindPrefix: 'text: ',
    invalidCount: 'invalid',
    zeroCount: 'none',
  },

  snapchat: {
    title: 'Snapchat works differently',
    whyNot:
      "iOS won't let us change Snapchat's screen the way we change Instagram or YouTube, so we can't hide just Spotlight, Snap Score, or Quick Add.",
    whatsNext:
      'What we can do — once app blocking is ready — is help you step away from Snapchat entirely on a schedule you set. The surgical version is coming to Android first.',
    comingSoon: 'Block Snapchat — coming soon',
    close: 'Close',
  },

  platformTile: {
    beta: 'BETA',
    blockOnly: 'BLOCK ONLY',
    soon: 'SOON',
    comingSoon: 'Coming soon',
    timeToday: (duration: string) => `${duration} today`,
    filtersActive: (count: number) =>
      `${count} filter${count !== 1 ? 's' : ''} active`,
  },

  limitReached: {
    title: "You're all caught up",
    body: (limit: number, platformName: string) =>
      `You set a limit of ${limit} posts on ${platformName}. Anything past this is the algorithm's idea, not yours.`,
    timeSpent: (duration: string) => `You've spent ${duration} here`,
    durationUnderAMinute: 'less than a minute',
    durationOneMinute: '1 minute',
    durationMinutes: (minutes: number) => `${minutes} minutes`,
    done: "I'm done",
    keepScrolling: 'Keep scrolling',
    waitCooldown: (seconds: number) => `Wait ${seconds}s...`,
  },

  settingsRow: {
    alwaysOn: 'Always On',
    hideButtonToo: 'Hide Button Too',
    hideButtonTooNote: 'Also removes the tap target, not just the number.',
  },

  platformSection: {
    comingSoon: 'Coming soon',
    reset: 'Reset to Defaults',
  },

  feedLimitSlider: {
    label: 'Posts before it stops',
  },
} as const;

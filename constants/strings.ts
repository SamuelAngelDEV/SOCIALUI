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
  /**
   * Product name and tagline.
   *
   * The tagline names the mechanism rather than the mood. Baughan et al.
   * (CHI 2022, University of Washington) ran a custom Twitter client with 43
   * people for a month: over half agreed they lost track of time and stayed
   * longer than intended, only half could recall most of what they had seen,
   * and 42% at some point strongly agreed they were using it "without really
   * paying attention". They call it normative dissociation. The product's whole
   * claim is that it stops the session before that point.
   */
  app: {
    name: 'Finite',
    tagline: 'It ends before you lose track.',
  },

  onboarding: {
    /** Q1 — the hook. Same chips as before; they test well and cost nothing. */
    goals: {
      title: "What's pulling you in?",
      subtitle: 'Pick anything that sounds familiar.',
      scrolling: 'Endless scrolling',
      reels: 'Reels & Shorts',
      counts: 'Like & follower counts',
      time: 'Losing track of time',
      habit: 'Opening apps out of habit',
    },

    /**
     * Q2 — anchors the later report. "Not sure" is a first-class answer, not a
     * skip: most people genuinely don't know, and pretending otherwise makes the
     * first weekly report feel like an accusation rather than news.
     */
    amount: {
      title: 'How long do you think you spend a day?',
      subtitle: 'A guess is fine. We measure the real number either way.',
      under1: 'Under an hour',
      one2: '1 – 2 hours',
      two4: '2 – 4 hours',
      over4: 'More than 4 hours',
      unsure: "I honestly don't know",
      unsureNote: "That's the normal answer. You'll have a real number in a week.",
    },

    /** Q3 — seeds Rhythm with a prior so it has something to confirm or correct. */
    when: {
      title: 'When does it usually get away from you?',
      subtitle: 'Pick as many as apply.',
      morning: 'First thing in the morning',
      work: 'During work or class',
      evening: 'Evening on the couch',
      night: 'Late at night in bed',
      unsure: 'Not sure — find it for me',
      unsureNote: "We'll watch for a few days and tell you.",
    },

    /**
     * Q4 — the one that actually decides the mode. Everything the category gets
     * wrong comes from blocking the part someone needed.
     */
    keep: {
      title: 'What do you actually want to keep?',
      subtitle: 'These stay working. Everything else is fair game.',
      messages: 'Messages and DMs',
      search: 'Search — looking things up',
      subs: 'Subscriptions and people I follow',
      posting: 'Posting my own stuff',
      nothing: 'Nothing. I want out for a while',
    },

    /** Q5 — becomes the line the weekly report measures against. */
    goal: {
      title: 'What would a good month look like?',
      subtitle: "We'll measure against this, not against a streak.",
      half: 'Cut my time roughly in half',
      hour: 'Get about an hour back a day',
      night: 'Stop the late-night scrolling',
      stop: 'Stop opening it without meaning to',
    },

    presets: {
      title: 'Here’s where to start',
      subtitle: 'Based on what you kept. Change it anytime in Settings.',
      recommended: 'Recommended',
    },

    done: {
      title: "You're all set",
      subtitle: "Here's what Finite does for you.",
      dmsWork: 'Your messages still work',
      staysOnDevice: 'Nothing leaves your phone',
      reversible: 'Change any setting, anytime',
      feedEnds: 'Your feed now has an ending',
    },

    next: 'Next',
    skip: 'Skip',
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

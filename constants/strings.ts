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
    /**
     * Q1 — the consequence the user has actually noticed.
     *
     * Deliberately not "is social media having a negative impact on your life".
     * Everyone who downloads a blocker answers that yes, so it separates nobody
     * and routes nothing; and asking someone to self-assess harm sets a clinical
     * frame this product has no standing to set. A named consequence is
     * observable, it discriminates, and it adjusts the mode — `recommendMode`
     * reads `sleep`/`focus` to tighten the feed cap, and `mood` to decide
     * whether counts come off.
     */
    cost: {
      title: "What's it actually costing you?",
      subtitle: "Pick anything you've noticed. This decides where we start.",
      sleep: 'Sleep — I stay up later than I meant to',
      focus: 'Focus — it breaks up work or study',
      presence: 'Time with people who are actually there',
      mood: 'I feel worse after than before',
      time: 'Nothing specific. Just the time.',
      timeNote: 'Fine. Time is the one thing here we can measure without guessing.',
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
      one2: '1–2 hours',
      two4: '2–4 hours',
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
      title: "Here's where to start",
      subtitle: 'Based on what you kept. Change it anytime in Settings.',
      recommended: 'Recommended',
      /** Why this one. Stated so the recommendation is auditable, not magic. */
      because: (reason: string) => `Recommended because ${reason}.`,
      /**
       * Shown on the scheduled mode when Q3 was "not sure": we need a window and
       * they didn't give one, so the fallback is named rather than slipped in.
       */
      windowAssumed: (window: string) =>
        `You weren't sure when, so this starts at ${window}. Change it in Settings.`,
      windowFrom: (window: string) => `Uses the window you gave: ${window}.`,
    },

    done: {
      title: "You're all set",
      subtitle: (appName: string) => `Here's what ${appName} does for you.`,
      dmsWork: 'Your messages still work',
      staysOnDevice: 'Nothing leaves your phone',
      reversible: 'Change any setting, anytime',
      feedEnds: 'Your feed now has an ending',
    },

    next: 'Next',
    back: 'Back',
    getStarted: 'Get started',
  },

  insights: {
    title: 'Insights',
    subtitle: 'Counted on your phone. Never uploaded.',

    /**
     * THE LEARNING STATE IS A WHOLE SCREEN, NOT FOUR EMPTY CARDS.
     *
     * The three readers on this screen — the split, Rhythm, and the year
     * projection — each have their own threshold, and each used to print its
     * own "not yet" sentence into an otherwise blank card. Rendering the mature
     * layout with the slots empty is what made the screen look broken on a
     * fresh install.
     *
     * Naming all three in one list, with what each is still waiting for, is
     * both less empty and more honest. It is also the answer to "how does it
     * decide things", given before it decides anything.
     */
    learningTitle: (since: string) => `Counting since ${since}.`,
    learningBody:
      "Nothing here is a guess, so each line turns on only once there's enough of your own data behind it.",
    learningFirstDay:
      "Counting from today. Open a platform and it starts; there's nothing to show until it does.",
    unlockSplit: 'Where your time goes',
    unlockRhythm: 'Your rhythm',
    unlockTrend: 'Compared to your first week',
    unlockReady: 'ready',
    unlockDays: (n: number) => `${n} more day${n === 1 ? '' : 's'}`,
    unlockWeeks: (n: number) => `${n} more full week${n === 1 ? '' : 's'}`,
    /** Enough days have passed, but the data hasn't formed a pattern worth naming. */
    unlockWatching: 'no pattern yet',
    learningFooter: 'None of it leaves your phone.',
    /** Heads the compact list of things not yet ready, on an otherwise mature screen. */
    stillComing: 'Still counting',

    /** The headline. `splitByKind` supplies the percentage; `other` is excluded. */
    splitHeadline: 'of your time this week was chosen for you.',
    splitBody:
      'Feeds and reels are ranked by an algorithm. Messages and the videos you open are not.',
    splitUnclassified: (amount: string) =>
      `${amount} was profiles, search and notifications. That mixes both, so it stays out of the percentage rather than being assigned to a side.`,

    weekTotal: 'this week',
    weekDelta: (amount: string, direction: 'down' | 'up') =>
      `${direction === 'down' ? '−' : '+'}${amount} vs last week`,
    weekNoPrev: 'First week counted.',
    perAppShare: (pct: number) => `${pct}% of the week`,
    perAppEmpty: 'No activity detail recorded yet.',

    /**
     * Shown before there is enough measured data for a finding, when
     * onboarding's Q3 gave us a window to check. States what the user told us
     * and that we haven't verified it — it is their claim on the screen, not
     * ours.
     */
    rhythmStated: (window: string) =>
      `You said it usually gets away from you ${window}. We'll confirm or correct that once there are a few days of data.`,
    rhythmEvidence: (days: number) =>
      `From your last ${days} day${days === 1 ? '' : 's'} with activity. Worth knowing, that's all.`,

    /** Compares onboarding's Q2 guess to the first week actually measured. */
    guessVsMeasured: (guess: string, measured: string) =>
      `You guessed ${guess} a day. You're actually averaging ${measured}.`,
    /** Same comparison, phrased for someone who answered "I honestly don't know". */
    guessUnsureMeasured: (measured: string) =>
      `You weren't sure how much time this was taking. Now you have a number: ${measured} a day.`,

    /**
     * THE DISCLOSURE.
     *
     * One place that states every threshold and every classification rule, so
     * "how does it come to conclusions" has an answer inside the app rather
     * than only in the source. Keep these sentences true against the constants
     * they describe — if a threshold moves, this text moves with it.
     */
    methodTitle: 'How this is worked out',
    methodTiming:
      "Time counts only while a platform is open here and you've touched the screen in the last minute. A phone put down mid-scroll stops counting after 60 seconds rather than running on.",
    methodSplit:
      'Feeds and reels count as chosen for you. Messages, and videos you opened yourself, count as chosen by you. Profiles, search and notifications are a mix of both, so they are left out of the percentage instead of being pushed onto whichever side reads better.',
    methodRhythm: (days: number, minutes: number) =>
      `A rhythm window is named only after ${days} days with activity and at least ${minutes} minutes of it, and only when one stretch of the day holds enough of that time to stand out from an even spread. Otherwise it says nothing.`,
    methodTrend: (weeks: number) =>
      `The yearly figure is arithmetic on your own weeks, projected forward — never a population average, and never a claim about what caused the change. It needs ${weeks} full weeks before it will name a direction.`,
    methodNoCredit:
      'Nothing here takes credit for a change. A rise is reported as plainly as a fall.',
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

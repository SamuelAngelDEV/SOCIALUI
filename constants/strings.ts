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
      // The `mood` id is kept for a label that no longer mentions mood. Naming
      // the comparison instead of the feeling makes the answer observable
      // ("I did that today") rather than a self-assessment, and it points at
      // the mechanism: counts are what a comparison is run on, which is exactly
      // what this answer turns off in `recommendMode`.
      mood: 'Comparing myself to everyone else',
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

    /**
     * The app picker. Two questions in one screen, in this order on purpose:
     * which apps are yours, then which of those you want changed.
     *
     * "Just track it" is a first-class answer, not a soft no. Someone who
     * doesn't yet know what they want blocked should be able to say so and get
     * a real number in a week — which is the honest way to decide. Offering
     * only "restrict" would push people into blocking things they hadn't
     * decided about, and the ones they got wrong are what makes a blocker get
     * deleted.
     */
    apps: {
      title: 'Which of these are yours?',
      subtitle: 'Pick the ones you actually open.',
      restrict: 'Restrict',
      track: 'Just track',
      restrictNote: 'Feed, Reels and the rest come out.',
      trackNote: 'Nothing changes. Time still gets counted.',
      blockOnly: "Can't be changed from the inside — we explain why.",
      comingSoon: 'Not ready yet.',
      /** Shown when nothing is selected, so the Next button's state is explained. */
      needOne: 'Pick at least one to carry on.',
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
    learningBody: 'Each line turns on when there’s enough of your data behind it.',
    learningFirstDay: 'Counting from today. Open an app and it starts.',
    unlockSplit: 'Where your time goes',
    unlockRhythm: 'When it happens',
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
    splitEyebrow: 'Where it went',
    weekEyebrow: 'This week',
    /**
     * Defines the two words rather than arguing for them.
     *
     * This replaced "Screen Time tells you which app. This tells you which
     * part of it — the feed the algorithm chose, versus the message you came
     * to answer." That sentence made the case for the idea; it never said what
     * the labels on the chart actually mean. Naming the surfaces teaches the
     * vocabulary in one line, and the chart below is then readable.
     */
    splitBody:
      'Feed, Reels and Explore are picked by an algorithm. Messages, Search and Video are picked by you.',
    /** Reads directly after the figure: "62" + " % algorithmic". */
    splitUnit: '% algorithmic',
    splitHeadline: 'of your time this week was chosen for you.',
    splitUnclassified: (amount: string) =>
      `${amount} on profiles and notifications, left out of the split.`,
    /**
     * Names its own window. The percentage above is the calendar week, which is
     * short mid-week; a yearly projection off a half-finished week would be a
     * different number pretending to be the same one. This reads the rolling
     * seven days and says so.
     */
    splitHorizon: (span: string) =>
      `At the last seven days' pace, that's ${span} a year of feed you didn't choose.`,
    /**
     * The idea, before there is any data to apply it to. Shown on first open so
     * the real percentage lands in a frame the user already holds.
     */
    splitExample:
      'A message from a friend, or a video you went looking for, is time you chose. A feed or a reel is time a ranking model chose for you. Both count as time on your phone — only one of them was your idea.',

    /**
     * DAY ONE — THEIR OWN GUESS, PROJECTED.
     *
     * There is no measured data on first open, so this is arithmetic on the
     * number they gave us in onboarding Q2 and nothing else. The rule it has to
     * keep: it must never read like a measurement. `estimateEyebrow` names it as
     * theirs *above* the figure rather than in a footnote below it, and
     * app/insights.tsx renders it in a deliberately quieter register than
     * ReclaimedCard. A guess that looks like a fact is the same failure this
     * screen avoids everywhere else, just in a new place.
     */
    estimateEyebrow: 'From your own estimate',
    estimateFigure: (span: string, atLeast: boolean) => (atLeast ? `at least ${span}` : span),
    estimateSub: 'a year, if that holds.',
    estimateSaid: (phrase: string) => `You said ${phrase} a day.`,
    estimateHorizon: (years: number, span: string) => `Over ${years} years that's ${span}.`,
    estimateDisclaimer:
      'Your figure, not a measurement — we haven’t counted anything yet. Once there are a few days of real data, this is replaced by what actually happened.',

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
    /** The eyebrow above the finding. Replaced "Rhythm", which meant nothing. */
    rhythmEyebrow: 'When it happens',
    rhythmStated: (window: string) => `You said ${window}. We'll check that.`,
    rhythmEvidence: (days: number) =>
      `From ${days} day${days === 1 ? '' : 's'} of activity.`,

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

  /**
   * SESSION SUMMARY — shown once, on the way out.
   *
   * The only moment the user is already stopping, which is the only moment a
   * number lands without nagging. Everything here is descriptive: it names the
   * surfaces the session touched and which side of the split they fall on. It
   * never says the session was too long, and it never congratulates anyone for
   * closing the app — the same rule utils/reclaimed.ts enforces on the weekly
   * figures applies to the one that shows up most often.
   *
   * The `verdict*` lines are observations about the time, not about the person.
   */
  session: {
    eyebrow: 'This session',
    on: (platformName: string) => `on ${platformName}`,
    /** One line, under the bars. Set in Newsreader italic — never a paragraph. */
    verdictAlgorithmic: 'Most of that was chosen for you.',
    verdictIntentional: 'Most of that was yours to choose.',
    verdictEven: 'About an even split between the two.',
    /** Surfaces a pathname couldn't identify — reported, never folded into either side. */
    unclassified: (total: string) => `${total} on pages we don't classify.`,
    today: (total: string) => `${total} across all apps today.`,
    done: 'Done',
  },

  /**
   * DELAYED DISABLE — the wait between asking to weaken a protection and it
   * applying. See utils/commitment.ts for the mechanism.
   *
   * Beyond stating the wait, this copy has one job: making unmistakably clear
   * that this is not a lock. Every surface that mentions the delay also says
   * that opening an app is unaffected — because a user who believes they have
   * been locked out of their own phone will delete the app rather than wait,
   * and they would be right to.
   */
  commitment: {
    pending: (remaining: string) => `Turns off in ${remaining}`,
    keepOn: 'Keep it on',
    groupTitle: 'Turning protections off',
    /** One clause. The mechanism moved behind the info tap. */
    groupFooter: 'Turning something on is instant. Opening an app is never affected.',
    rowLabel: 'Wait before it applies',
    immediate: 'Applies immediately',
    hours: (n: number) => `${n} hour${n === 1 ? '' : 's'}`,
    pendingDelay: (value: string, remaining: string) =>
      `Changing to ${value} in ${remaining}`,
  },

  /**
   * BACKGROUND THEMES. Purely decorative, and the copy says so — the footer
   * exists to head off the reasonable assumption that a theme does something.
   */
  themes: {
    groupTitle: 'Background',
    groupFooter: 'Decoration only. Nothing it blocks or counts changes.',
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

  /**
   * QUIET HOURS — the window the user asked to be kept out of.
   *
   * Two rules run through this copy. First, it never claims an outcome: the
   * window is something the user set, and nothing here says what it achieved
   * (see utils/reclaimed.ts). Second, the way out is always visible and always
   * stated. Friction is the mechanism — a wall with no door is a different
   * product, and one this app argues against.
   */
  quietHours: {
    title: 'Your quiet hours',
    body: (platformName: string, window: string) =>
      `You asked to be kept off ${platformName} ${window}.`,
    fromRhythm: 'You set this from your own measured pattern.',
    done: "I'm done",
    openAnyway: 'Open anyway',
    waitCooldown: (seconds: number) => `Wait ${seconds}s…`,
    /** Home-tile marker while the window is open. */
    tileBadge: 'QUIET',

    /** The Insights call to action, shown under a Rhythm finding. */
    ctaTitle: 'Close this window',
    ctaBody: (window: string) => `Keep yourself out ${window}. You can still open anyway.`,
    ctaButton: (window: string) => `Turn on for ${window}`,
    ctaActive: (window: string) => `Quiet hours are on, ${window}.`,
    ctaTurnOff: 'Turn off',

    settingsTitle: 'Quiet hours',
    settingsSubtitle: 'A daily window. Nothing is locked.',
    settingsOff: 'Off',
    settingsOn: (window: string) => `On, ${window}`,
    settingsStart: 'From',
    settingsEnd: 'Until',
  },
} as const;

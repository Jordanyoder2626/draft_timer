import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import notesData from './notes.json';

import bml from './BML_LOGO.png';
import bmldraft from './bmldraft.png';
import chime from './nfl-draft-chime.mp3';
import countdown from './countdown.mp3';
import nfl from './nfl-theme-song.mp3';

import claude from './logos/claude.png';
import dak from './logos/dak.jpg';
import dirk from './logos/dirk.jpg';
import drP from './logos/drP.png';
import fants from './logos/levis.jpg';
import fw from './logos/firewheel.png';
import gustavo from './logos/gustavo.svg';
import hurts from './logos/hurts.png';
import lamario from './logos/lamario.jpg';
import lamario2 from './logos/lamario2.jpg';
import leighton from './logos/leighton.jpg';
import pen from './logos/pen.jpg';
import phoenix from './logos/phoenix.jpg';
import sonic from './logos/sonic.svg';
import stormforce from './logos/stormforce.jpg';
import warrior from './logos/warrior.svg';

const TIME_PER_PICK = 90;
const TEAMS_PER_ROUND = 10;
const MAX_ROUNDS = 16;
const PICK_EXIT_DURATION_MS = 700;
const NEXT_PICK_ENTER_DURATION_MS = 1100;
const DRAFT_INTRO_DURATION_MS = 30500;
const DRAFT_INTRO_ROUTE_DELAY_MS = DRAFT_INTRO_DURATION_MS - 3000;
const AUDIO_FADE_OUT_MS = 3000;

const DRAFT_ORDER_STORAGE_KEY = 'bmlDraftOrder';
const DRAFT_TEAM_NAMES_STORAGE_KEY = 'bmlDraftTeamNames';

const initialDraftOrder = [
  {
    id: 'warriors',
    name: 'The Warriors',
    noteKeys: [],
    logo: warrior,
    finish: 9,
    ending: 'th',
    record: '60-42',
  },
  {
    id: 'bijario',
    name: 'Bijario',
    noteKeys: [],
    logo: lamario,
    alternateLogo: lamario2,
    finish: 6,
    ending: 'th',
    record: '58-44',
  },
  {
    id: 'kittys-revenge',
    name: "Kitty's Revenge",
    noteKeys: [],
    logo: leighton,
    finish: 5,
    ending: 'th',
    record: '38-50',
  },
  {
    id: 'grudens-grinders',
    name: 'Grudens Grinders',
    noteKeys: ["Gruden's Grinders"],
    logo: fants,
    finish: 3,
    ending: 'rd',
    record: '52-50',
  },
  {
    id: 'droupymagic',
    name: 'droupymagic',
    noteKeys: [],
    logo: phoenix,
    finish: 2,
    ending: 'nd',
    record: '53-48',
  },
  {
    id: 'mighty-acorns',
    name: 'Mighty Acorns',
    noteKeys: [],
    logo: dirk,
    finish: 10,
    ending: 'th',
    record: '50-52',
  },
  {
    id: 'moose-knuckle',
    name: 'Moose Knuckle',
    noteKeys: [],
    logo: pen,
    finish: 7,
    ending: 'th',
    record: '52-50',
  },
  {
    id: 'kings-landing',
    name: "King's Landing",
    noteKeys: [],
    logo: dak,
    finish: 8,
    ending: 'th',
    record: '43-59',
  },
  {
    id: 'riceism',
    name: 'Riceism',
    noteKeys: [],
    logo: hurts,
    finish: 1,
    ending: 'st',
    record: '44-58',
  },
  {
    id: 'gustavo',
    name: 'Gustavo',
    noteKeys: [],
    logo: gustavo,
    finish: 4,
    ending: 'th',
    record: '55-47',
  },
];

const getSavedDraftOrder = () => {
  try {
    const savedOrder = JSON.parse(window.localStorage.getItem(DRAFT_ORDER_STORAGE_KEY));
    const savedTeamNames = JSON.parse(
      window.localStorage.getItem(DRAFT_TEAM_NAMES_STORAGE_KEY)
    );
    const teamNameById =
      savedTeamNames && typeof savedTeamNames === 'object' && !Array.isArray(savedTeamNames)
        ? savedTeamNames
        : {};
    const withSavedName = (team) => ({
      ...team,
      originalName: team.originalName || team.name,
      name: typeof teamNameById[team.id] === 'string' && teamNameById[team.id].trim()
        ? teamNameById[team.id].trim()
        : team.name,
    });

    if (!Array.isArray(savedOrder)) {
      return initialDraftOrder.map(withSavedName);
    }

    const teamsById = new Map(initialDraftOrder.map((team) => [team.id, withSavedName(team)]));
    const orderedTeams = savedOrder
      .map((teamId) => teamsById.get(teamId))
      .filter(Boolean);
    const savedTeamIds = new Set(orderedTeams.map((team) => team.id));
    const missingTeams = initialDraftOrder
      .filter((team) => !savedTeamIds.has(team.id))
      .map(withSavedName);

    return [...orderedTeams, ...missingTeams];
  } catch {
    return initialDraftOrder;
  }
};

const saveDraftOrder = (teams) => {
  window.localStorage.setItem(
    DRAFT_ORDER_STORAGE_KEY,
    JSON.stringify(teams.map((team) => team.id))
  );
  window.localStorage.setItem(
    DRAFT_TEAM_NAMES_STORAGE_KEY,
    JSON.stringify(
      Object.fromEntries(
        teams.map((team) => [team.id, String(team.name || '').trim()])
      )
    )
  );
};

const sponsorLogos = [
  { src: fw, alt: 'Firewheel sponsor logo', className: 'sponsor-logo-firewheel' },
  { src: claude, alt: 'Claude sponsor logo', className: 'sponsor-logo-claude' },
  { src: sonic, alt: 'Sonic sponsor logo', className: 'sponsor-logo-sonic' },
  { src: drP, alt: 'DrP sponsor logo', className: 'sponsor-logo-drp' },
  { src: stormforce, alt: 'Stormforce sponsor logo', className: 'sponsor-logo-stormforce' },
];

const getDraftOrderIndexForPick = (round, pick) => {
  const zeroBasedPick = pick - 1;
  return round % 2 === 1 ? zeroBasedPick : TEAMS_PER_ROUND - 1 - zeroBasedPick;
};

const getNextPickPosition = (round, pick) => {
  if (pick >= TEAMS_PER_ROUND) {
    return {
      round: round + 1,
      pick: 1,
    };
  }

  return {
    round,
    pick: pick + 1,
  };
};

const getTeamLogo = (team, round, pick) => {
  if (team.id === 'bijario') {
    const appearanceNumber = Math.floor((round - 1) / 2) * 2 + (pick <= TEAMS_PER_ROUND / 2 ? 1 : 2);
    return appearanceNumber % 2 === 0 ? lamario2 : lamario;
  }

  return team.logo;
};

const getTeamForPick = (draftOrder, round, pick) => {
  const team = draftOrder[getDraftOrderIndexForPick(round, pick)] || draftOrder[0];

  return {
    ...team,
    logo: getTeamLogo(team, round, pick),
  };
};

const DRAFT_ROUTE = '/draft';

const getBasePath = () => {
  const currentPath = window.location.pathname.replace(/\/$/, '');

  if (currentPath.endsWith(DRAFT_ROUTE)) {
    return currentPath.slice(0, -DRAFT_ROUTE.length);
  }

  return currentPath === '' ? '' : currentPath;
};

const getRoute = () => {
  const basePath = getBasePath();
  const currentPath = window.location.pathname;
  const routePath =
    basePath && currentPath.startsWith(basePath)
      ? currentPath.slice(basePath.length) || '/'
      : currentPath;

  return routePath === DRAFT_ROUTE ? DRAFT_ROUTE : '/';
};

const normalizeTeamName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');

const stripLeadingThe = (name) => String(name || '').replace(/^the\s+/i, '');

const getObjectValue = (object, keys) => {
  if (!object || typeof object !== 'object') {
    return undefined;
  }

  const matchingKey = Object.keys(object).find((key) =>
    keys.some((candidateKey) => key.toLowerCase() === candidateKey.toLowerCase())
  );

  return matchingKey ? object[matchingKey] : undefined;
};

const toNoteList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(toNoteList);
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value === 'object') {
    return toNoteList(getObjectValue(value, ['notes', 'note', 'text', 'content']));
  }

  return [];
};

const getTeamNameCandidates = (team) => {
  const names = [
    team.name,
    stripLeadingThe(team.name),
    team.originalName,
    stripLeadingThe(team.originalName),
    ...(team.noteKeys || []),
  ];

  return Array.from(new Set(names.filter(Boolean).map(normalizeTeamName)));
};

const teamNamesMatch = (teamNameCandidates, noteTeamName) => {
  const normalizedNoteTeamName = normalizeTeamName(noteTeamName);

  if (!normalizedNoteTeamName) {
    return false;
  }

  return teamNameCandidates.some((teamName) => {
    if (teamName === normalizedNoteTeamName) {
      return true;
    }

    const shortestNameLength = Math.min(teamName.length, normalizedNoteTeamName.length);

    return (
      shortestNameLength >= 6 &&
      (teamName.includes(normalizedNoteTeamName) || normalizedNoteTeamName.includes(teamName))
    );
  });
};

const getTeamNotes = (team) => {
  const teamNameCandidates = getTeamNameCandidates(team);

  if (Array.isArray(notesData)) {
    const matchingEntries = notesData.filter((entry) => {
      if (typeof entry === 'string') {
        return false;
      }

      const entryName = getObjectValue(entry, ['team', 'name', 'teamName', 'team_name', 'owner']);
      return teamNamesMatch(teamNameCandidates, entryName);
    });

    return matchingEntries.flatMap(toNoteList);
  }

  if (notesData && typeof notesData === 'object') {
    const matchingKey = Object.keys(notesData).find((key) => teamNamesMatch(teamNameCandidates, key));

    return toNoteList(matchingKey ? notesData[matchingKey] : null);
  }

  return [];
};

const getRandomNoteIndex = (notes) => {
  if (notes.length < 2) {
    return 0;
  }

  return Math.floor(Math.random() * notes.length);
};

function WelcomeRoute({ keyboardIsDisabled, onOpenDraftOrder, onStartDraft }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (keyboardIsDisabled) {
        return;
      }

      if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        onOpenDraftOrder();
        return;
      }

      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      onStartDraft();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardIsDisabled, onOpenDraftOrder, onStartDraft]);

  return (
    <div className="App">
      <header className="App-header">
        <p className="welcome">Welcome to the 2026 BML Draft</p>
        <div className="App-logo-wrapper" style={{ '--mask-url': `url(${bmldraft})` }}>
          <img src={bmldraft} className="App-logo" alt="BML draft logo" />
          <div className="shimmer-overlay" />
        </div>

        <div className="year">
          YEAR 9
          <div className="Sponsors">
            <p className="sponsors-text">Thank You to our Sponsors:</p>
            <div className="sponsors-logos">
              {sponsorLogos.map((logo) => (
                <img
                  key={logo.alt}
                  className={`sponsor-logo ${logo.className}`}
                  src={logo.src}
                  alt={logo.alt}
                />
              ))}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

function DraftIntroTransition({ teams }) {
  const featuredTeams = teams.slice(0, 10);
  const nutCupWinner = teams.find((team) => team.finish === 1) || teams[0];
  const bootymanWinner =
    teams.find((team) => team.finish === TEAMS_PER_ROUND) || teams[teams.length - 1];

  return (
    <div className="draft-intro-transition" aria-live="polite">
      <div className="draft-intro-grid" />
      <div className="draft-intro-band draft-intro-band-top" />
      <div className="draft-intro-band draft-intro-band-bottom" />

      <div className="draft-intro-opening">
        <div className="draft-intro-logo-stack">
          <img src={bml} className="draft-intro-bml-logo" alt="BML logo" />
          <img src={bmldraft} className="draft-intro-draft-logo" alt="BML draft logo" />
        </div>

        <div className="draft-intro-copy">
          <div className="draft-intro-kicker">Live From Draft Night</div>
          <div className="draft-intro-title">BML Draft</div>
          <div className="draft-intro-subtitle">Year 9 - Round 1 Begins Now</div>
        </div>
      </div>

      <div className="draft-intro-awards">
        <div className="draft-intro-section-title">Last Season's Hardware</div>
        <div className="draft-intro-award-grid">
          <div className="draft-intro-award draft-intro-award-champ">
            <div className="draft-intro-award-label">2025 Nut Cup Winner</div>
            <img src={nutCupWinner.logo} alt="" />
            <div className="draft-intro-award-name">{nutCupWinner.name}</div>
          </div>
          <div className="draft-intro-award draft-intro-award-booty">
            <div className="draft-intro-award-label">2025 Bootyman Winner</div>
            <img src={bootymanWinner.logo} alt="" />
            <div className="draft-intro-award-name">{bootymanWinner.name}</div>
          </div>
        </div>
      </div>

      <div className="draft-intro-order">
        <div className="draft-intro-order-title">Draft Order</div>
        <ol className="draft-intro-order-list">
          {teams.slice(0, TEAMS_PER_ROUND).map((team, index) => (
            <li className="draft-intro-order-team" key={team.id}>
              <span>{index + 1}</span>
              <img src={team.logo} alt="" />
              <strong>{team.name}</strong>
            </li>
          ))}
        </ol>
      </div>

      <div className="draft-intro-team-track" aria-hidden="true">
        {featuredTeams.map((team, index) => (
          <img
            key={`${team.id}-${index}`}
            className="draft-intro-team-logo"
            src={team.logo}
            alt=""
          />
        ))}
      </div>
    </div>
  );
}

function DraftRoute({
  backOne,
  currentTeam,
  formattedTime,
  keyboardIsDisabled,
  nextTeam,
  onKeyboardNextPick,
  onOpenDraftOrder,
  pick,
  pickIsAdvancing,
  pickIsIn,
  nextPickIsEntering,
  round,
  toggle,
}) {
  const [statsView, setStatsView] = useState('finish');
  const [noteIndex, setNoteIndex] = useState(0);
  const teamNotes = useMemo(() => getTeamNotes(currentTeam), [currentTeam]);
  const currentNote = teamNotes[noteIndex] || 'No team note found.';

  useEffect(() => {
    setStatsView('finish');
    setNoteIndex(getRandomNoteIndex(teamNotes));
  }, [currentTeam, teamNotes]);

  useEffect(() => {
    const rotation = setInterval(() => {
      setStatsView((currentStatsView) =>
        currentStatsView === 'finish' ? 'record' : 'finish'
      );
      setNoteIndex((currentNoteIndex) => {
        if (teamNotes.length < 2) {
          return 0;
        }

        let nextNoteIndex = getRandomNoteIndex(teamNotes);

        if (nextNoteIndex === currentNoteIndex) {
          nextNoteIndex = (nextNoteIndex + 1) % teamNotes.length;
        }

        return nextNoteIndex;
      });
    }, 15000);

    return () => {
      clearInterval(rotation);
    };
  }, [teamNotes]);

  useEffect(() => {
    const handlePickAction = () => {
      if (!pickIsIn) {
        toggle();
        return;
      }

      onKeyboardNextPick();
    };

    const handleKeyDown = (event) => {
      if (keyboardIsDisabled) {
        return;
      }

      if (![' ', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        backOne();
        return;
      }

      if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        onOpenDraftOrder();
        return;
      }

      if (event.key === 'ArrowRight') {
        onKeyboardNextPick();
        return;
      }

      handlePickAction();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [backOne, keyboardIsDisabled, onKeyboardNextPick, onOpenDraftOrder, pickIsIn, toggle]);

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    if (!pickIsIn) {
      toggle();
      return;
    }

    onKeyboardNextPick();
  };

  return (
    <div className="timer" onMouseDown={handleMouseDown}>
      <header
        className={`timer-header ${pickIsIn ? 'timer-header-pick-is-in' : ''} ${
          nextPickIsEntering ? 'timer-header-next-pick-entering' : ''
        }`}
      >
        <div className="words" style={{ opacity: pickIsIn ? 0 : 100 }}>
          <div className="on-clock-label">On the Clock</div>
          <h1 className="onC">{currentTeam.name}</h1>
        </div>

        <img
          key={`${currentTeam.id}-${round}-${currentTeam.logo}`}
          src={currentTeam.logo}
          className="circle"
          alt={`${currentTeam.name} logo`}
          style={{ opacity: pickIsIn ? 0 : 100 }}
        />
        <img
          key={`${nextTeam.id}-${nextTeam.logo}`}
          src={nextTeam.logo}
          className="next"
          alt={`${nextTeam.name} logo`}
          style={{ opacity: pickIsIn ? 0 : 100 }}
        />
        <img
          src={bml}
          className="next-bml"
          alt="BML logo"
          style={{ opacity: pickIsIn ? 0 : 100 }}
        />

        <div className="team-stats" style={{ opacity: pickIsIn ? 0 : 100 }}>
          <div className={`team-stat ${statsView === 'finish' ? 'team-stat-visible' : ''}`}>
            <div className="tt-finish-font">2025 Finish:</div>
            <div className="tt-finish-place">
              {currentTeam.finish}
              {currentTeam.ending}
            </div>
          </div>
          <div className={`team-stat ${statsView === 'record' ? 'team-stat-visible' : ''}`}>
            <div className="tt-finish-font">Career Record:</div>
            <div className="tt-finish-place">{currentTeam.record}</div>
          </div>
        </div>

        <div className="team-note" style={{ opacity: pickIsIn ? 0 : 100 }}>
          <div className="team-note-text" key={`${currentTeam.name}-${noteIndex}`}>
            {currentNote}
          </div>
        </div>

        <div className="next-words" style={{ opacity: pickIsIn ? 0 : 100 }}>
          Next Pick:
        </div>
        {pickIsIn ? (
          <div
            className={`pick-is-in-transition ${
              pickIsAdvancing ? 'pick-is-in-transition-exiting' : ''
            }`}
            aria-live="polite"
          >
            <div className="pick-transition-sweep pick-transition-sweep-top" />
            <div className="pick-transition-sweep pick-transition-sweep-bottom" />
            <div className="pick-transition-grid" />
            <div className="pick-transition-logo-ring">
              <img
                src={currentTeam.logo}
                className="pick-transition-logo"
                alt={`${currentTeam.name} logo`}
              />
            </div>
            <div className="pick-transition-copy">
              <div className="pick-transition-kicker">Round {round} - Pick {pick}</div>
              <div className="pick-transition-title">The Pick Is In</div>
              <div className="pick-transition-team">{currentTeam.name}</div>
            </div>
          </div>
        ) : null}

        <div className="time-group" style={{ opacity: pickIsIn ? 0 : 100 }}>
          <h2 className="time">{formattedTime}</h2>
          <h1 className="round">
            Round: {round}, Pick: {pick}
          </h1>
        </div>
      </header>
    </div>
  );
}

function DraftOrderEditor({ draftOrder, onCancel, onSave }) {
  const [orderedTeams, setOrderedTeams] = useState(draftOrder);
  const [draggedTeamId, setDraggedTeamId] = useState(null);

  useEffect(() => {
    setOrderedTeams(draftOrder);
  }, [draftOrder]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const moveDraggedTeam = useCallback((targetTeamId) => {
    setOrderedTeams((currentTeams) => {
      const draggedIndex = currentTeams.findIndex((team) => team.id === draggedTeamId);
      const targetIndex = currentTeams.findIndex((team) => team.id === targetTeamId);

      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        return currentTeams;
      }

      const nextTeams = [...currentTeams];
      const [draggedTeam] = nextTeams.splice(draggedIndex, 1);
      nextTeams.splice(targetIndex, 0, draggedTeam);
      return nextTeams;
    });
  }, [draggedTeamId]);

  const renameTeam = useCallback((teamId, name) => {
    setOrderedTeams((currentTeams) =>
      currentTeams.map((team) => (team.id === teamId ? { ...team, name } : team))
    );
  }, []);

  return (
    <div className="draft-order-overlay" role="dialog" aria-modal="true">
      <div className="draft-order-widget">
        <div className="draft-order-header">
          <h2>Draft Order</h2>
          <button className="draft-order-icon-button" type="button" onClick={onCancel}>
            X
          </button>
        </div>

        <ol className="draft-order-list">
          {orderedTeams.map((team, index) => (
            <li
              className="draft-order-item"
              draggable
              key={team.id}
              onDragStart={() => setDraggedTeamId(team.id)}
              onDragOver={(event) => {
                event.preventDefault();
                moveDraggedTeam(team.id);
              }}
              onDragEnd={() => setDraggedTeamId(null)}
            >
              <span className="draft-order-number">{index + 1}</span>
              <img src={team.logo} alt="" />
              <input
                aria-label={`Team ${index + 1} name`}
                className="draft-order-name-input"
                onChange={(event) => renameTeam(team.id, event.target.value)}
                onMouseDown={(event) => event.stopPropagation()}
                onDragStart={(event) => event.preventDefault()}
                value={team.name}
              />
            </li>
          ))}
        </ol>

        <div className="draft-order-actions">
          <button className="button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={() => onSave(orderedTeams)}
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(getRoute);
  const [seconds, setSeconds] = useState(TIME_PER_PICK);
  const [isActive, setIsActive] = useState(false);
  const [pick, setPick] = useState(1);
  const [round, setRound] = useState(1);
  const [pickIsIn, setPickIsIn] = useState(false);
  const [pickIsAdvancing, setPickIsAdvancing] = useState(false);
  const [nextPickIsEntering, setNextPickIsEntering] = useState(false);
  const [draftOrder, setDraftOrder] = useState(getSavedDraftOrder);
  const [draftOrderEditorIsOpen, setDraftOrderEditorIsOpen] = useState(false);
  const [draftIntroIsRunning, setDraftIntroIsRunning] = useState(false);

  const countdownAudioRef = useRef(null);
  const nflAudioRef = useRef(null);
  const chimeAudioRef = useRef(null);
  const pickAdvanceTimeoutRef = useRef(null);
  const nextPickEnterTimeoutRef = useRef(null);
  const draftIntroTimeoutRef = useRef(null);
  const draftIntroUnmountTimeoutRef = useRef(null);
  const draftIntroAudioFadeTimeoutRef = useRef(null);
  const audioFadeIntervalRef = useRef(null);

  const currentTeam = useMemo(
    () => getTeamForPick(draftOrder, round, pick),
    [draftOrder, pick, round]
  );
  const nextPickPosition = useMemo(() => getNextPickPosition(round, pick), [pick, round]);
  const nextTeam = useMemo(
    () => getTeamForPick(draftOrder, nextPickPosition.round, nextPickPosition.pick),
    [draftOrder, nextPickPosition]
  );

  useEffect(() => {
    countdownAudioRef.current = new Audio(countdown);
    nflAudioRef.current = new Audio(nfl);
    chimeAudioRef.current = new Audio(chime);
  }, []);

  useEffect(() => () => {
    clearTimeout(pickAdvanceTimeoutRef.current);
    clearTimeout(nextPickEnterTimeoutRef.current);
    clearTimeout(draftIntroTimeoutRef.current);
    clearTimeout(draftIntroUnmountTimeoutRef.current);
    clearTimeout(draftIntroAudioFadeTimeoutRef.current);
    clearInterval(audioFadeIntervalRef.current);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoute());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((path) => {
    window.history.pushState(null, '', `${getBasePath()}${path}`);
    setRoute(path);
  }, []);

  const stopAudio = useCallback((audioRef) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  }, []);

  const fadeOutAudio = useCallback((audioRef, duration = AUDIO_FADE_OUT_MS) => {
    const audio = audioRef.current;

    if (!audio || audio.paused) {
      return;
    }

    clearInterval(audioFadeIntervalRef.current);

    const startingVolume = audio.volume || 1;
    const fadeStartedAt = Date.now();

    audioFadeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - fadeStartedAt;
      const progress = Math.min(elapsed / duration, 1);

      audio.volume = Math.max(startingVolume * (1 - progress), 0);

      if (progress >= 1) {
        clearInterval(audioFadeIntervalRef.current);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
      }
    }, 50);
  }, []);

  const stopAllAudioExcept = useCallback((activeAudioRef) => {
    [countdownAudioRef, nflAudioRef, chimeAudioRef].forEach((audioRef) => {
      if (audioRef !== activeAudioRef) {
        if (audioRef === nflAudioRef) {
          fadeOutAudio(audioRef);
          return;
        }

        stopAudio(audioRef);
      }
    });
  }, [fadeOutAudio, stopAudio]);

  const playAudio = useCallback((audioRef) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    clearInterval(audioFadeIntervalRef.current);
    stopAllAudioExcept(audioRef);
    audio.volume = 1;
    audio.currentTime = 0;
    audio.play();
  }, [stopAllAudioExcept]);

  const playChime = useCallback(() => {
    playAudio(chimeAudioRef);
  }, [playAudio]);

  const resetCountdownAudio = useCallback(() => {
    stopAudio(countdownAudioRef);
  }, [stopAudio]);

  const increasePick = useCallback(() => {
    if (pick >= TEAMS_PER_ROUND && round >= MAX_ROUNDS) {
      return;
    }

    if (pick >= TEAMS_PER_ROUND) {
      setRound((currentRound) => currentRound + 1);
      setPick(1);
      return;
    }

    setPick((currentPick) => currentPick + 1);
  }, [pick, round]);

  const decreasePick = useCallback(() => {
    if (round === 1 && pick === 1) {
      return;
    }

    if (pick === 1) {
      setPick(TEAMS_PER_ROUND);
      setRound((currentRound) => currentRound - 1);
      return;
    }

    setPick((currentPick) => currentPick - 1);
  }, [pick, round]);

  const completePickAdvance = useCallback(() => {
    increasePick();
    resetCountdownAudio();
    setPickIsIn(false);
    setPickIsAdvancing(false);
    setSeconds(TIME_PER_PICK);
    setIsActive(true);
    setNextPickIsEntering(true);

    clearTimeout(nextPickEnterTimeoutRef.current);
    nextPickEnterTimeoutRef.current = setTimeout(() => {
      setNextPickIsEntering(false);
    }, NEXT_PICK_ENTER_DURATION_MS);
  }, [increasePick, resetCountdownAudio]);

  const reset = useCallback(() => {
    if (pickIsAdvancing) {
      return;
    }

    clearTimeout(pickAdvanceTimeoutRef.current);
    clearTimeout(nextPickEnterTimeoutRef.current);

    if (!pickIsIn) {
      completePickAdvance();
      return;
    }

    setPickIsAdvancing(true);
    pickAdvanceTimeoutRef.current = setTimeout(() => {
      completePickAdvance();
    }, PICK_EXIT_DURATION_MS);
  }, [completePickAdvance, pickIsAdvancing, pickIsIn]);

  const toggle = useCallback(() => {
    setIsActive((currentIsActive) => {
      if (currentIsActive) {
        clearTimeout(nextPickEnterTimeoutRef.current);
        setNextPickIsEntering(false);
        playChime();
        resetCountdownAudio();
        setPickIsIn(true);
      }

      return !currentIsActive;
    });
  }, [playChime, resetCountdownAudio]);

  const startDraft = useCallback(() => {
    if (draftIntroIsRunning) {
      return;
    }

    setDraftIntroIsRunning(true);
    playAudio(nflAudioRef);

    clearTimeout(draftIntroTimeoutRef.current);
    clearTimeout(draftIntroUnmountTimeoutRef.current);
    clearTimeout(draftIntroAudioFadeTimeoutRef.current);

    draftIntroAudioFadeTimeoutRef.current = setTimeout(() => {
      fadeOutAudio(nflAudioRef);
    }, Math.max(DRAFT_INTRO_ROUTE_DELAY_MS - AUDIO_FADE_OUT_MS, 0));

    draftIntroTimeoutRef.current = setTimeout(() => {
      navigate('/draft');
      setNextPickIsEntering(true);

      clearTimeout(nextPickEnterTimeoutRef.current);
      nextPickEnterTimeoutRef.current = setTimeout(() => {
        setNextPickIsEntering(false);
      }, NEXT_PICK_ENTER_DURATION_MS);

      draftIntroUnmountTimeoutRef.current = setTimeout(() => {
        setDraftIntroIsRunning(false);
      }, DRAFT_INTRO_DURATION_MS - DRAFT_INTRO_ROUTE_DELAY_MS);
    }, DRAFT_INTRO_ROUTE_DELAY_MS);
  }, [draftIntroIsRunning, fadeOutAudio, navigate, playAudio]);

  const backOne = useCallback(() => {
    clearTimeout(pickAdvanceTimeoutRef.current);
    clearTimeout(nextPickEnterTimeoutRef.current);
    setPickIsIn(false);
    setPickIsAdvancing(false);
    setNextPickIsEntering(false);
    setSeconds(TIME_PER_PICK);
    setIsActive(true);
    decreasePick();
  }, [decreasePick]);

  const keyboardNextPick = useCallback(() => {
    reset();
  }, [reset]);

  const openDraftOrderEditor = useCallback(() => {
    setDraftOrderEditorIsOpen(true);
  }, []);

  const closeDraftOrderEditor = useCallback(() => {
    setDraftOrderEditorIsOpen(false);
  }, []);

  const handleSaveDraftOrder = useCallback((nextDraftOrder) => {
    const normalizedDraftOrder = nextDraftOrder.map((team) => ({
      ...team,
      name: String(team.name || '').trim() || team.originalName || team.id,
    }));

    setDraftOrder(normalizedDraftOrder);
    saveDraftOrder(normalizedDraftOrder);
    setDraftOrderEditorIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSeconds((currentSeconds) => {
        if (pickIsIn) {
          resetCountdownAudio();
        }

        if (currentSeconds === 12) {
          playAudio(countdownAudioRef);
        }

        if (currentSeconds > 0) {
          return currentSeconds - 1;
        }

        setPickIsIn(true);
        resetCountdownAudio();
        playChime();
        setIsActive(false);
        return currentSeconds;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isActive, pickIsIn, playAudio, playChime, resetCountdownAudio]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  }, [seconds]);

  const routeContent = route === '/draft' ? (
    <DraftRoute
      backOne={backOne}
      currentTeam={currentTeam}
      formattedTime={formattedTime}
      keyboardIsDisabled={draftOrderEditorIsOpen}
      nextTeam={nextTeam}
      onKeyboardNextPick={keyboardNextPick}
      onOpenDraftOrder={openDraftOrderEditor}
      pick={pick}
      pickIsAdvancing={pickIsAdvancing}
      pickIsIn={pickIsIn}
      nextPickIsEntering={nextPickIsEntering}
      round={round}
      toggle={toggle}
    />
  ) : (
    <WelcomeRoute
      keyboardIsDisabled={draftOrderEditorIsOpen}
      onOpenDraftOrder={openDraftOrderEditor}
      onStartDraft={startDraft}
    />
  );

  return (
    <>
      {routeContent}
      {draftIntroIsRunning ? <DraftIntroTransition teams={draftOrder} /> : null}
      {draftOrderEditorIsOpen ? (
        <DraftOrderEditor
          draftOrder={draftOrder}
          onCancel={closeDraftOrderEditor}
          onSave={handleSaveDraftOrder}
        />
      ) : null}
    </>
  );
}

export default App;

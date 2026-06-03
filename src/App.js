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

const DRAFT_ORDER_STORAGE_KEY = 'bmlDraftOrder';

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

    if (!Array.isArray(savedOrder)) {
      return initialDraftOrder;
    }

    const teamsById = new Map(initialDraftOrder.map((team) => [team.id, team]));
    const orderedTeams = savedOrder
      .map((teamId) => teamsById.get(teamId))
      .filter(Boolean);
    const savedTeamIds = new Set(orderedTeams.map((team) => team.id));
    const missingTeams = initialDraftOrder.filter((team) => !savedTeamIds.has(team.id));

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

const getRoute = () => window.location.pathname;

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
  const names = [team.name, stripLeadingThe(team.name), ...(team.noteKeys || [])];

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

function WelcomeRoute({ onOpenDraftOrder, onStartDraft }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key.startsWith('Arrow')) {
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
  }, [onOpenDraftOrder, onStartDraft]);

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

function DraftRoute({
  backOne,
  currentTeam,
  formattedTime,
  isActive,
  move,
  nextTeam,
  onKeyboardNextPick,
  onOpenDraftOrder,
  pick,
  pickIsIn,
  reset,
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
    const handleKeyDown = (event) => {
      if (event.key !== ' ') {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      if (!pickIsIn) {
        toggle();
        return;
      }

      onKeyboardNextPick();
    };

    const handleArrowKeyDown = (event) => {
      if (!event.key.startsWith('Arrow')) {
        return;
      }

      event.preventDefault();
      onOpenDraftOrder();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleArrowKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleArrowKeyDown);
    };
  }, [onKeyboardNextPick, onOpenDraftOrder, pickIsIn, toggle]);

  return (
    <div className="timer">
      <header className="timer-header" style={{ backgroundColor: pickIsIn ? 'black' : null }}>
        <div className="words" style={{ opacity: pickIsIn ? 0 : 100 }}>
          <h1 className="onC">On the Clock: {currentTeam.name}</h1>
        </div>

        <img
          key={`${currentTeam.id}-${round}-${currentTeam.logo}`}
          src={currentTeam.logo}
          className="circle"
          alt={`${currentTeam.name} logo`}
          style={{ scale: pickIsIn ? '1.75' : '1' }}
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
        <h1
          className="pick-words"
          style={{
            opacity: pickIsIn ? 100 : 0,
            transitionDelay: pickIsIn ? '3000ms' : '0ms',
            transitionDuration: pickIsIn ? '3000ms' : '1000ms',
            left: move ? '0px' : null,
          }}
        >
          The Pick is In...
        </h1>

        <div className="time-group" style={{ opacity: pickIsIn ? 0 : 100 }}>
          <h2 className="time">{formattedTime}</h2>
          <button className="button" onClick={backOne}>
            Previous Pick
          </button>
          <button
            className={`button button-primary button-primary-${isActive ? 'active' : 'inactive'}`}
            onClick={toggle}
          >
            {isActive ? 'Pick Is In' : 'Start'}
          </button>
          <button className="button" onClick={reset}>
            Next Pick
          </button>
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
              <span>{team.name}</span>
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
  const [move, setMove] = useState(true);
  const [draftOrder, setDraftOrder] = useState(getSavedDraftOrder);
  const [draftOrderEditorIsOpen, setDraftOrderEditorIsOpen] = useState(false);

  const countdownAudioRef = useRef(null);
  const nflAudioRef = useRef(null);
  const chimeAudioRef = useRef(null);

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
    window.history.pushState(null, '', path);
    setRoute(path);
  }, []);

  const playChime = useCallback(() => {
    const chimeAudio = chimeAudioRef.current;

    if (!chimeAudio) {
      return;
    }

    chimeAudio.currentTime = 0;
    chimeAudio.play();
  }, []);

  const resetCountdownAudio = useCallback(() => {
    const countdownAudio = countdownAudioRef.current;

    if (!countdownAudio) {
      return;
    }

    countdownAudio.pause();
    countdownAudio.currentTime = 0;
  }, []);

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

  const reset = useCallback(() => {
    increasePick();
    resetCountdownAudio();
    setPickIsIn(false);
    setSeconds(TIME_PER_PICK);
    setIsActive(true);
  }, [increasePick, resetCountdownAudio]);

  const toggle = useCallback(() => {
    setIsActive((currentIsActive) => {
      if (currentIsActive) {
        playChime();
        resetCountdownAudio();
        setPickIsIn(true);
        setMove(false);
      }

      return !currentIsActive;
    });
  }, [playChime, resetCountdownAudio]);

  const startDraft = useCallback(() => {
    navigate('/draft');
    nflAudioRef.current?.play();
  }, [navigate]);

  const backOne = useCallback(() => {
    setPickIsIn(false);
    setSeconds(TIME_PER_PICK);
    setIsActive(true);
    decreasePick();
  }, [decreasePick]);

  const keyboardNextPick = useCallback(() => {
    setMove(false);
    reset();
  }, [reset]);

  const openDraftOrderEditor = useCallback(() => {
    setDraftOrderEditorIsOpen(true);
  }, []);

  const closeDraftOrderEditor = useCallback(() => {
    setDraftOrderEditorIsOpen(false);
  }, []);

  const handleSaveDraftOrder = useCallback((nextDraftOrder) => {
    setDraftOrder(nextDraftOrder);
    saveDraftOrder(nextDraftOrder);
    setDraftOrderEditorIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSeconds((currentSeconds) => {
        if (currentSeconds < 150) {
          setMove(true);
        }

        if (pickIsIn) {
          resetCountdownAudio();
          setMove(false);
        }

        if (currentSeconds === 12) {
          const countdownAudio = countdownAudioRef.current;

          if (countdownAudio) {
            countdownAudio.currentTime = 0;
            countdownAudio.play();
          }
        }

        if (currentSeconds > 0) {
          return currentSeconds - 1;
        }

        setMove(false);
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
  }, [isActive, pickIsIn, playChime, resetCountdownAudio]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  }, [seconds]);

  if (route === '/draft') {
    return (
      <>
        <DraftRoute
          backOne={backOne}
          currentTeam={currentTeam}
          formattedTime={formattedTime}
          isActive={isActive}
          move={move}
          nextTeam={nextTeam}
          onKeyboardNextPick={keyboardNextPick}
          onOpenDraftOrder={openDraftOrderEditor}
          pick={pick}
          pickIsIn={pickIsIn}
          reset={reset}
          round={round}
          toggle={toggle}
        />
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

  return (
    <>
      <WelcomeRoute onOpenDraftOrder={openDraftOrderEditor} onStartDraft={startDraft} />
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

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CircleAlert, Clock3, MapPin, RotateCcw, Search, Timer, University } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

type Branch = { id: string; code: string; name: string };
type Semester = { id: number; label: string };
type Subject = { code: string; title: string };
type Faculty = { code: string; label: string };
type Room = { id: string; label: string };
type EnrollmentMapping = { enrollment: string; branchId: string; batch: string };
type TimetableCell = { label: string; faculty?: string; room?: string };
type TimetableRow = { time: string; cells: Record<string, TimetableCell | null> };
type StudentContext = EnrollmentMapping & { semester: number };
type Lecture = { row: TimetableRow; cell: TimetableCell };

/* Supplied/reference data: keep academic facts here, apart from the UI. */
export const BRANCHES: Branch[] = [
  { id: 'computer-engineering', code: 'CE', name: 'Computer Engineering' },
];

export const SEMESTERS: Semester[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  label: `Semester ${index + 1}`,
}));

export const SUBJECTS: Subject[] = [
  { code: 'BME', title: 'BME' },
  { code: 'PPS', title: 'PPS' },
  { code: 'MATHS 1', title: 'MATHS 1' },
  { code: 'BE', title: 'BE' },
  { code: 'CPS 1', title: 'CPS 1' },
  { code: 'IPC', title: 'IPC' },
  { code: 'BEE', title: 'BEE' },
  { code: 'LIBRARY', title: 'LIBRARY' },
];

export const FACULTY: Faculty[] = ['AKP', 'KMG', 'DAP', 'VMP', 'DJP', 'PRP', 'CGP', 'DT', 'S.L.B.', 'S.K.']
  .map((code) => ({ code, label: code }));

export const ROOMS: Room[] = [];

const DEMO_ENROLLMENTS = [
  'CE001', 'CE003', 'CE04', 'CE05', 'CE06', 'CE07', 'CE09', 'CE10', 'CE14', 'CE17', 'CE19', 'CE21',
  'CE24', 'CE78', 'CE79', 'CE92', 'CE93', 'CE94', 'CE95', 'CE96', 'CE26', 'CE28', 'CE29', 'CE30', 'CE31',
  'CE32', 'CE33', 'CE34', 'CE38', 'CE39', 'CE40', 'CE41', 'CE42', 'CE43', 'CE45', 'CE46', 'CE49',
  'CE97', 'CE98', 'CE99', 'CE100', 'CE101', 'CE102', 'CE103', 'CE52', 'CE53', 'CE55', 'CE56',
  'CE57', 'CE58', 'CE59', 'CE61', 'CE62', 'CE63', 'CE65', 'CE66', 'CE68', 'CE70', 'CE72', 'CE73',
  'CE74', 'CE76', 'CE77', 'CE104', 'CE105', 'CE106', 'CE107', 'CE108', 'CE109', 'CE110', 'CE111',
  'CE112', 'CE113', 'CE114',
];

const batchForEnrollment = (enrollment: string) => {
  const number = Number(enrollment.replace(/^CE/i, ''));
  if (number <= 95) return 'CP1';
  if (number <= 103) return 'CP2';
  return 'CP3';
};

export const ENROLLMENT_MAPPINGS: EnrollmentMapping[] = DEMO_ENROLLMENTS.map((enrollment) => ({
  enrollment,
  branchId: 'computer-engineering',
  batch: batchForEnrollment(enrollment),
}));

export const TIMETABLES: Record<string, TimetableRow[]> = {
  'computer-engineering-1': [
    {
      time: '10:30–11:30',
      cells: {
        Monday: { label: 'BME', faculty: 'AKP' },
        Tuesday: { label: 'BE', faculty: 'DJP' },
        Wednesday: { label: 'MATHS 1', faculty: 'DAP' },
        Thursday: { label: 'PPS', faculty: 'KMG' },
        Friday: null,
      },
    },
    {
      time: '11:30–12:30',
      cells: {
        Monday: { label: 'PPS', faculty: 'KMG' },
        Tuesday: { label: 'BME', faculty: 'PRP' },
        Wednesday: { label: 'BME CP1 / CP2 / CP3', faculty: 'PRP' },
        Thursday: { label: 'BEE CP1 / BEE CP2', faculty: 'DJP' },
        Friday: { label: 'BEE CP1 / BEE CP2 / BEE CP3', faculty: 'DJP' },
      },
    },
    {
      time: '02:00–03:00',
      cells: {
        Monday: { label: 'MATHS 1', faculty: 'DAP' },
        Tuesday: { label: 'PPS CP1 / PPS CP2 / PPS CP3', faculty: 'KMG' },
        Wednesday: { label: 'IPC (CGP) / IPC (DT)' },
        Thursday: { label: 'BEE (DJP) / BEE CP1 (DJP) / BEE CP2 (DJP)' },
        Friday: { label: 'LIBRARY S.K.' },
      },
    },
    {
      time: '03:00–04:00',
      cells: {
        Monday: { label: 'BE', faculty: 'VMP' },
        Tuesday: { label: 'BE CP1 / BE CP2 / BE CP3', faculty: 'DJP' },
        Wednesday: { label: 'BME CP1 / BME CP2 / BME CP3' },
        Thursday: { label: 'CPS 1 S.L.B.' },
        Friday: { label: 'LIBRARY S.K.' },
      },
    },
    {
      time: '04:10–05:10',
      cells: {
        Monday: { label: 'MATHS 1 (CP1)' },
        Tuesday: { label: 'CPS 1 S.L.B.' },
        Wednesday: { label: 'BME CP1 / CP2 S.L.B.' },
        Thursday: { label: 'PPS (KMG) / PPS CP1 (KMG)' },
        Friday: { label: 'LIBRARY S.K.' },
      },
    },
  ],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
function timetableCellForBatch(cell: TimetableCell, batch: string) {
  const parts = cell.label.split(' / ');
  const hasBatchSpecificLabels = parts.some((part) => /\bCP[123]\b/.test(part));

  if (!hasBatchSpecificLabels) return cell;

  const matchingParts = parts.filter((part) => part.includes(batch));
  if (matchingParts.length > 0) {
    return { ...cell, label: matchingParts.join(' / ') };
  }

  return null;
}

function resolvedRowsForStudent(student: StudentContext) {
  const rows = TIMETABLES[`${student.branchId}-${student.semester}`] ?? [];
  return rows.map((row) => ({
    ...row,
    cells: Object.fromEntries(
      DAYS.map((day) => [
        day,
        row.cells[day] ? timetableCellForBatch(row.cells[day], student.batch) : null,
      ]),
    ),
  }));
}

function normalizeEnrollment(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

function findEnrollment(value: string) {
  const normalized = normalizeEnrollment(value);
  return ENROLLMENT_MAPPINGS.find((entry) => entry.enrollment === normalized);
}

function timeToMinutes(value: string) {
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const isAfternoon = rawHour < 8;
  return (isAfternoon ? rawHour + 12 : rawHour) * 60 + rawMinute;
}

function timeRangeToMinutes(time: string) {
  const [start, end] = time.split('–');
  return { start: timeToMinutes(start), end: timeToMinutes(end) };
}

function getTodayName(now: Date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
}

function lecturesForDay(rows: TimetableRow[], day: string): Lecture[] {
  return rows.flatMap((row) => {
    const cell = row.cells[day];
    return cell ? [{ row, cell }] : [];
  });
}

function getLectureMoment(lectures: Lecture[], now: Date) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const current = lectures.find(({ row }) => {
    const range = timeRangeToMinutes(row.time);
    return currentMinutes >= range.start && currentMinutes < range.end;
  });
  const next = lectures.find(({ row }) => timeRangeToMinutes(row.time).start > currentMinutes);
  return { current, next };
}

function formatCountdown(minutes: number, prefix: string) {
  if (minutes <= 0) return `${prefix} now`;
  if (minutes < 60) return `${prefix} ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${prefix} ${hours}h${remainder ? ` ${remainder}m` : ''}`;
}

type CampusState = {
  student: StudentContext | null;
  setStudent: (student: StudentContext) => void;
  resetStudent: () => void;
};

const CampusContext = createContext<CampusState | null>(null);

function useCampus() {
  const context = useContext(CampusContext);
  if (!context) throw new Error('Campus context is unavailable');
  return context;
}

function Header() {
  const [location] = useLocation();
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark focus-ring" data-testid="link-home">
        <span className="brand-emblem" aria-hidden="true">G</span>
        <span className="brand-text">GEC Palanpur<span className="brand-subtext">Class finder</span></span>
      </Link>
      <nav className="header-nav" aria-label="Primary navigation">
        <Link href="/my-class" aria-current={location === '/my-class' ? 'page' : undefined} data-testid="link-my-class">My class</Link>
        <Link href="/timetable" aria-current={location === '/timetable' ? 'page' : undefined} data-testid="link-timetable">Full timetable</Link>
        <Link href="/find" aria-current={location === '/find' ? 'page' : undefined} data-testid="link-find">Find my class</Link>
      </nav>
    </header>
  );
}

function Home() {
  return (
    <div className="app-shell">
      <Header />
      <main className="home-main">
        <section className="hero enter">
          <div>
            <div className="eyebrow">Government Engineering College, Palanpur</div>
            <h1>Find Your Class.<br /><em>Never Miss Your Lecture.</em></h1>
            <p className="hero-copy">Find your class, current lecture, next lecture and complete timetable in seconds.</p>
            <Link href="/find" className="primary-button focus-ring" data-testid="button-find-my-class">
              Find My Class <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
          <div className="preview-wrap" aria-label="Preview of the class finder flow">
            <span className="preview-label">Your day, at a glance</span>
            <div className="finder-preview">
              <div className="finder-preview-top">
                <span className="preview-kicker">GEC PALANPUR</span>
                <span className="preview-status"><span className="live-dot" /> Ready when you are</span>
              </div>
              <div className="finder-preview-body">
                <span className="finder-preview-step">01</span>
                <div><strong>Select your semester</strong><small>Semester 1 · Semester 2 · Semester 3 · ...</small></div>
                <Check size={17} aria-hidden="true" />
                <span className="finder-preview-step">02</span>
                <div><strong>Find your class</strong><small>Enter your enrollment number</small></div>
                <ArrowRight size={17} aria-hidden="true" />
              </div>
              <div className="finder-preview-footer"><Clock3 size={14} /> Current lecture, next lecture, and your full week</div>
            </div>
          </div>
        </section>
        <section className="home-strip" aria-label="How class finder works">
          <div><strong><BookOpen size={14} aria-hidden="true" /> 01 / Select semester</strong><p>You choose the semester. It is never inferred.</p></div>
          <div><strong><Search size={14} aria-hidden="true" /> 02 / Find your class</strong><p>Use the enrollment number issued by GEC Palanpur.</p></div>
          <div><strong><MapPin size={14} aria-hidden="true" /> 03 / See your day</strong><p>Current lecture first, full timetable when you need it.</p></div>
        </section>
      </main>
    </div>
  );
}

function FinderPage() {
  const [, setLocation] = useLocation();
  const { setStudent } = useCampus();
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const detected = useMemo(() => findEnrollment(enrollment), [enrollment]);

  const chooseSemester = (value: number) => {
    setSemester(String(value));
    setEnrollment('');
    setError('');
  };

  const handleLookup = () => {
    if (!semester) {
      setError('Select your semester first.');
      return;
    }
    if (!enrollment.trim()) {
      setError('Enter an enrollment number to continue.');
      return;
    }
    if (!detected) {
      setError('We could not find that enrollment in the supplied reference list.');
      return;
    }
    setStudent({ ...detected, semester: Number(semester) });
    setLocation('/my-class');
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main enter">
        <div className="page-heading">
          <div className="eyebrow">Find my class</div>
          <h1>Start with your semester.</h1>
          <p>Choose your semester first, then enter your enrollment number. We’ll detect your branch and practical batch from the supplied reference mapping.</p>
        </div>
        <div className="finder-layout">
          <section className="finder-card" aria-labelledby="finder-title">
            <h2 id="finder-title" className="sr-only">Find a student timetable</h2>
            <div className="finder-step">
              <div className="step-heading">
                <span className="step-number">01</span>
                <div><span className="step-label">Step one</span><h2>Select your semester</h2></div>
              </div>
              <div className="semester-choice-grid" role="radiogroup" aria-label="Select your semester">
                {SEMESTERS.map((item) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={semester === String(item.id)}
                    className={`semester-choice focus-ring ${semester === String(item.id) ? 'selected' : ''}`}
                    onClick={() => chooseSemester(item.id)}
                    key={item.id}
                    data-testid={`choice-semester-${item.id}`}
                  >
                    <span>0{item.id}</span>
                    <strong>{item.label}</strong>
                    {semester === String(item.id) && <Check size={15} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
            <div className={`finder-step finder-step-two ${semester ? 'visible' : ''}`}>
              <div className="step-heading">
                <span className="step-number">02</span>
                <div><span className="step-label">Step two</span><h2>Enter your enrollment number</h2></div>
              </div>
              <p className="field-hint">Use the format printed on your college records, for example <span className="font-mono-app">CE06</span> or <span className="font-mono-app">CE104</span>.</p>
              <div className="input-row">
                <input
                  id="enrollment-number"
                  className="text-input focus-ring"
                  value={enrollment}
                  onChange={(event) => { setEnrollment(event.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={(event) => { if (event.key === 'Enter') handleLookup(); }}
                  placeholder="Enter enrollment number"
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                  disabled={!semester}
                  data-testid="input-enrollment-number"
                />
                <button type="button" className="primary-button find-button focus-ring" onClick={handleLookup} disabled={!semester} data-testid="button-lookup-enrollment">
                  Find My Class <Search size={15} aria-hidden="true" />
                </button>
              </div>
              {semester && <p className="semester-help"><Check size={13} aria-hidden="true" /> Semester {semester} selected. Your branch and CP batch will be detected automatically.</p>}
              {error && <p className="validation-error" role="alert" data-testid="status-find-error"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
              <div className="finder-submit-note">No manual CP selection is needed.</div>
            </div>
            {!semester && (
              <div className="finder-locked-note"><CalendarDays size={16} aria-hidden="true" /> Select a semester to unlock enrollment lookup.</div>
            )}
            {semester && detected && (
              <div className="finder-detection-preview" aria-live="polite">
                <span className="live-dot" aria-hidden="true" />
                <span>Reference match ready for <strong>{detected.enrollment}</strong> · {detected.batch}</span>
              </div>
            )}
          </section>
          <aside className="context-card">
            <h2>One unified flow</h2>
            <p>Semester comes first. Enrollment comes second. Your branch and practical batch are detected from the supplied mapping.</p>
            <ul className="context-list">
              <li>Select Semester 1–8 manually</li>
              <li>Enter your enrollment number</li>
              <li>Open your current class view</li>
              <li>CP1 — through <span className="font-mono-app">CE95</span></li>
              <li>CP2 — <span className="font-mono-app">CE96</span> through <span className="font-mono-app">CE103</span></li>
              <li>CP3 — <span className="font-mono-app">CE104</span> through <span className="font-mono-app">CE114</span></li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MyClassPage() {
  const [, setLocation] = useLocation();
  const { student, resetStudent } = useCampus();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!student) setLocation('/find');
  }, [setLocation, student]);

  if (!student) return null;

  const branch = BRANCHES.find((item) => item.id === student.branchId);
  const rows = resolvedRowsForStudent(student);
  const semester = SEMESTERS.find((item) => item.id === student.semester);
  const today = getTodayName(now);
  const todayLectures = lecturesForDay(rows, today);
  const { current, next } = getLectureMoment(todayLectures, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentEndsIn = current ? timeRangeToMinutes(current.row.time).end - currentMinutes : 0;
  const nextStartsIn = next ? timeRangeToMinutes(next.row.time).start - currentMinutes : 0;

  const startOver = () => {
    resetStudent();
    setLocation('/find');
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main enter">
        <div className="class-result-header">
          <div>
            <div className="eyebrow">My class / {today}</div>
            <h1>My class</h1>
            <p>{branch?.name ?? 'Branch unavailable'} · {semester?.label ?? 'Semester unavailable'} · {student.batch}</p>
          </div>
          <button type="button" className="quiet-button focus-ring" onClick={startOver} data-testid="button-start-over"><RotateCcw size={14} aria-hidden="true" /> Start over</button>
        </div>
        <div className="student-context class-context" aria-label="Current student context">
          <span className="context-chip"><University size={12} aria-hidden="true" /><strong data-testid="text-current-enrollment">{student.enrollment}</strong></span>
          <span className="context-chip"><BookOpen size={12} aria-hidden="true" /><strong data-testid="text-current-batch">{student.batch}</strong></span>
          <span className="context-chip"><CalendarDays size={12} aria-hidden="true" /><strong data-testid="text-current-branch">{branch?.code}</strong></span>
        </div>
        <div className="focus-grid">
          <section className={`focus-card current-card ${current ? 'is-live' : 'is-idle'}`} data-testid="card-current-lecture">
            <div className="focus-card-heading">
              <span className="focus-label">Current lecture</span>
              {current ? <span className="live-badge"><span className="live-dot" /> Live now</span> : <Clock3 size={16} aria-hidden="true" />}
            </div>
            {current ? (
              <>
                <h2 data-testid="text-current-lecture">{current.cell.label}</h2>
                <p className="lecture-time">{current.row.time}</p>
                <div className="lecture-details"><span>Faculty · {current.cell.faculty ?? 'not listed'}</span><span>Room · {current.cell.room ?? 'not listed'}</span></div>
                <p className="countdown">{formatCountdown(currentEndsIn, 'Ends in')}</p>
              </>
            ) : (
              <>
                <h2 data-testid="text-no-current-lecture">No lecture right now</h2>
                <p className="focus-support">Your next class is shown below. This view follows your local time.</p>
              </>
            )}
          </section>
          <section className="focus-card next-card" data-testid="card-next-lecture">
            <div className="focus-card-heading"><span className="focus-label">Next lecture</span><ArrowRight size={16} aria-hidden="true" /></div>
            {next ? (
              <>
                <h2 data-testid="text-next-lecture">{next.cell.label}</h2>
                <p className="lecture-time">{next.row.time}</p>
                <div className="lecture-details"><span>Faculty · {next.cell.faculty ?? 'not listed'}</span><span>Room · {next.cell.room ?? 'not listed'}</span></div>
                <p className="countdown">{formatCountdown(nextStartsIn, 'Starts in')}</p>
              </>
            ) : (
              <>
                <h2 data-testid="text-no-next-lecture">No more lectures today</h2>
                <p className="focus-support">There are no upcoming supplied lectures for {today}.</p>
              </>
            )}
          </section>
        </div>
        <section className="today-section" aria-labelledby="today-heading">
          <div className="section-heading-row">
            <div><span className="focus-label">Today’s lectures</span><h2 id="today-heading">{today}</h2></div>
            <span className="today-source">Reference schedule · {student.batch}</span>
          </div>
          {todayLectures.length > 0 ? (
            <div className="today-list">
              {todayLectures.map(({ row, cell }) => {
                const range = timeRangeToMinutes(row.time);
                const isCurrent = Boolean(current && current.row.time === row.time);
                const isComplete = range.end <= currentMinutes;
                return (
                  <div className={`today-lecture ${isCurrent ? 'is-current' : ''} ${isComplete && !isCurrent ? 'is-complete' : ''}`} key={row.time} data-testid={`today-lecture-${row.time.replace(/[^0-9]/g, '')}`}>
                    <div className="today-time">{row.time}</div>
                    <div className="today-subject"><strong>{cell.label}</strong><span>{isCurrent ? 'Live now' : isComplete ? 'Completed' : 'Upcoming'}</span></div>
                    <div className="today-meta"><span>Faculty · {cell.faculty ?? 'not listed'}</span><span>Room · {cell.room ?? 'not listed'}</span></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="day-empty" data-testid="status-no-today-lectures"><CalendarDays size={18} aria-hidden="true" /><span>No supplied lectures are listed for {today}.</span></div>
          )}
        </section>
        <div className="class-actions">
          <Link href="/timetable" className="primary-button focus-ring" data-testid="button-view-full-timetable">View full timetable <ArrowRight size={15} aria-hidden="true" /></Link>
          <button type="button" className="quiet-button focus-ring" onClick={startOver} data-testid="button-change-enrollment"><ArrowLeft size={14} aria-hidden="true" /> Change enrollment</button>
        </div>
      </main>
    </div>
  );
}

function FullTimetablePage() {
  const [, setLocation] = useLocation();
  const { student, resetStudent } = useCampus();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!student) setLocation('/find');
  }, [setLocation, student]);

  if (!student) return null;

  const branch = BRANCHES.find((item) => item.id === student.branchId);
  const rows = resolvedRowsForStudent(student);
  const semester = SEMESTERS.find((item) => item.id === student.semester);
  const today = getTodayName(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startOver = () => {
    resetStudent();
    setLocation('/find');
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main enter">
        <div className="timetable-header">
          <div>
            <div className="eyebrow">Full timetable</div>
            <h1>{semester?.label ?? 'Timetable'}</h1>
            <p>{branch?.name ?? 'Branch unavailable'} · {student.batch} · First Semester Batch 2026</p>
          </div>
          <Link href="/my-class" className="quiet-button focus-ring" data-testid="button-back-to-my-class"><ArrowLeft size={14} aria-hidden="true" /> Back to My Class</Link>
        </div>
        <div className="schedule-meta">
          <span data-testid="text-schedule-source">Reference schedule · Computer Engineering · Sem 1 · {student.batch}</span>
          <span className="live-key"><span className="live-dot" aria-hidden="true" /> Today is {today}</span>
        </div>
        {rows.length > 0 ? (
          <section className="schedule-shell" aria-label={`${semester?.label ?? 'Semester'} weekly timetable`}>
            <div className="schedule-scroll">
              <table className="schedule-table">
                <thead>
                  <tr><th scope="col">Time</th>{DAYS.map((day) => <th scope="col" key={day}>{day}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.time}>
                      <td className="time-cell"><Timer size={13} aria-hidden="true" />{row.time}<small>local time</small></td>
                      {DAYS.map((day) => {
                        const cell = row.cells[day];
                        const range = timeRangeToMinutes(row.time);
                        const isCurrent = Boolean(cell) && today === day && currentMinutes >= range.start && currentMinutes < range.end;
                        return (
                          <td key={`${row.time}-${day}`} data-testid={`cell-${day.toLowerCase()}-${row.time.replace(/[^0-9]/g, '')}`}>
                            {cell && (
                              <div className={`lecture ${isCurrent ? 'current' : ''}`} data-testid={`lecture-${day.toLowerCase()}-${row.time.replace(/[^0-9]/g, '')}`}>
                                {isCurrent && <span className="now-label">Now</span>}
                                <div className="lecture-code">{cell.label}</div>
                                {cell.faculty && <div className="lecture-faculty">Faculty · {cell.faculty}</div>}
                                <div className="lecture-room">Room · {cell.room ?? 'not listed'}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="empty-card" data-testid="status-no-timetable">
            <div className="empty-icon"><CalendarDays size={19} aria-hidden="true" /></div>
            <h2>No supplied timetable for {semester?.label ?? 'this semester'}</h2>
            <p>The available reference image is labeled First Semester Batch 2026. No schedule has been supplied for this semester, so nothing has been invented here.</p>
          </section>
        )}
        <div className="timetable-footer">
          <span>Room numbers are not present in the supplied reference data.</span>
          <button type="button" onClick={startOver} data-testid="button-change-enrollment">Change enrollment</button>
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/find" component={FinderPage} />
        <Route path="/my-class" component={MyClassPage} />
        <Route path="/timetable" component={FullTimetablePage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [student, setStudentState] = useState<StudentContext | null>(() => {
    try {
      const saved = window.sessionStorage.getItem('gec-student-context');
      return saved ? JSON.parse(saved) as StudentContext : null;
    } catch {
      return null;
    }
  });

  const setStudent = (nextStudent: StudentContext) => {
    setStudentState(nextStudent);
    window.sessionStorage.setItem('gec-student-context', JSON.stringify(nextStudent));
  };
  const resetStudent = () => {
    setStudentState(null);
    window.sessionStorage.removeItem('gec-student-context');
  };
  const campusState = useMemo(() => ({ student, setStudent, resetStudent }), [student]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CampusContext.Provider value={campusState}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </CampusContext.Provider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
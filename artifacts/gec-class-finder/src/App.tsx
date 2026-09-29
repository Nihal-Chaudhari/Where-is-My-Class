import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CalendarDays, CircleAlert, MapPin, RotateCcw, Search, Timer, University } from 'lucide-react';
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
const TIME_STARTS = ['10:30', '11:30', '02:00', '03:00', '04:10'];

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

function isCurrentLecture(time: string, day: string, now: Date) {
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  if (today !== day) return false;
  const [start, end] = time.split('–');
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= timeToMinutes(start) && current < timeToMinutes(end);
}

type CampusState = {
  student: StudentContext | null;
  setStudent: (student: StudentContext) => void;
  resetStudent: () => void;
  changeSemester: (semester: number) => void;
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
        <Link href="/timetable" aria-current={location === '/timetable' ? 'page' : undefined} data-testid="link-timetable">Timetable</Link>
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
            <h1>Find Your Class.<br /><em>Find Your Timetable.</em></h1>
            <p className="hero-copy">Your personalized college timetable, just one search away.</p>
            <Link href="/find" className="primary-button focus-ring" data-testid="button-find-my-class">
              Find My Class <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
          <div className="preview-wrap" aria-label="Preview of a weekly class timetable">
            <span className="preview-label">A quiet view of your week</span>
            <div className="timetable-preview">
              <div className="preview-top"><strong>Semester 1</strong><span>CP1 · 11/7/2026</span></div>
              <div className="preview-grid">
                <span />
                {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day) => <span className="day" key={day}>{day}</span>)}
                <span className="time">10:30</span>
                <div className="preview-cell tinted"><strong>BME</strong><small>AKP</small></div>
                <div className="preview-cell"><strong>BE</strong><small>DJP</small></div>
                <div className="preview-cell"><strong>MATHS 1</strong><small>DAP</small></div>
                <div className="preview-cell"><strong>PPS</strong><small>KMG</small></div>
                <div className="preview-cell" />
                <span className="time">11:30</span>
                <div className="preview-cell"><strong>PPS</strong><small>KMG</small></div>
                <div className="preview-cell current"><strong>BME</strong><small>PRP</small></div>
                <div className="preview-cell"><strong>BME CP1</strong><small>PRP</small></div>
                <div className="preview-cell"><strong>BEE</strong><small>DJP</small></div>
                <div className="preview-cell"><strong>BEE</strong><small>DJP</small></div>
                <span className="time">02:00</span>
                <div className="preview-cell"><strong>MATHS 1</strong><small>DAP</small></div>
                <div className="preview-cell"><strong>PPS CP1</strong><small>KMG</small></div>
                <div className="preview-cell"><strong>IPC</strong><small>CGP / DT</small></div>
                <div className="preview-cell"><strong>BEE</strong><small>DJP</small></div>
                <div className="preview-cell"><strong>LIBRARY</strong><small>S.K.</small></div>
              </div>
              <p className="preview-note">Faculty initials and subject codes are shown as supplied in the reference timetable.</p>
            </div>
          </div>
        </section>
        <section className="home-strip" aria-label="How class finder works">
          <div><strong><Search size={14} aria-hidden="true" /> Search your enrollment</strong><p>Use the number issued to you by GEC Palanpur.</p></div>
          <div><strong><BookOpen size={14} aria-hidden="true" /> Confirm your semester</strong><p>You choose the semester. It is never inferred.</p></div>
          <div><strong><MapPin size={14} aria-hidden="true" /> Read the week</strong><p>See your subject, faculty initials, and supplied room details in one view.</p></div>
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
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const detected = useMemo(() => findEnrollment(enrollment), [enrollment]);
  const branch = BRANCHES.find((item) => item.id === detected?.branchId);

  const handleLookup = () => {
    setHasSearched(true);
    setError('');
    if (!enrollment.trim()) {
      setError('Enter an enrollment number to continue.');
      return;
    }
    if (!detected) {
      setError('We could not find that enrollment in the supplied reference list.');
      return;
    }
    setSemester('');
  };

  const handleContinue = () => {
    if (!detected) return;
    if (!semester) {
      setError('Choose your semester. It is not inferred from your enrollment number.');
      return;
    }
    setStudent({ ...detected, semester: Number(semester) });
    setLocation('/timetable');
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page-main enter">
        <div className="page-heading">
          <div className="eyebrow">01 / Identify your place</div>
          <h1>Find your class</h1>
          <p>Start with your enrollment number. We’ll show what the supplied reference data recognizes, then you choose the semester yourself.</p>
        </div>
        <div className="finder-layout">
          <section className="finder-card" aria-labelledby="finder-title">
            <h2 id="finder-title" className="sr-only">Find a student timetable</h2>
            <label className="field-label" htmlFor="enrollment-number">Enrollment number</label>
            <p className="field-hint">Use the format printed on your college records, for example <span className="font-mono-app">CE001</span> or <span className="font-mono-app">CE104</span>.</p>
            <div className="input-row">
              <input
                id="enrollment-number"
                className="text-input focus-ring"
                value={enrollment}
                onChange={(event) => { setEnrollment(event.target.value.toUpperCase()); setHasSearched(false); setError(''); }}
                onKeyDown={(event) => { if (event.key === 'Enter') handleLookup(); }}
                placeholder="Type your enrollment number"
                autoComplete="off"
                aria-invalid={Boolean(error)}
                data-testid="input-enrollment-number"
              />
              <button type="button" className="primary-button find-button focus-ring" onClick={handleLookup} data-testid="button-lookup-enrollment">
                Look up <Search size={15} aria-hidden="true" />
              </button>
            </div>
            {error && <p className="validation-error" role="alert" data-testid="status-find-error"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
            {hasSearched && detected && branch && (
              <div className="detected-card" data-testid="card-detected-student">
                <h2>We found a reference match</h2>
                <div className="student-fields">
                  <div className="student-field"><span>Enrollment</span><strong data-testid="text-detected-enrollment">{detected.enrollment}</strong></div>
                  <div className="student-field"><span>Branch</span><strong data-testid="text-detected-branch">{branch.code}</strong></div>
                  <div className="student-field"><span>Batch</span><strong data-testid="text-detected-batch">{detected.batch}</strong></div>
                </div>
                <div className="semester-select">
                  <label className="field-label" htmlFor="semester-choice">Choose semester</label>
                  <select id="semester-choice" className="select-input focus-ring" value={semester} onChange={(event) => { setSemester(event.target.value); setError(''); }} data-testid="select-semester">
                    <option value="">Select a semester</option>
                    {SEMESTERS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
                  </select>
                  <p className="semester-help">Semester is a manual choice; this tool will not guess it.</p>
                </div>
                <div className="continue-row">
                  <span className="reference-note">Branch and batch are detected from supplied reference mappings.</span>
                  <button type="button" className="primary-button focus-ring" onClick={handleContinue} data-testid="button-open-timetable">
                    Open timetable <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            {hasSearched && enrollment.trim() && !detected && (
              <div className="empty-card" data-testid="status-no-enrollment">
                <div className="empty-icon"><Search size={19} aria-hidden="true" /></div>
                <h2>No reference match</h2>
                <p>Check the enrollment number and try again. Only the supplied demo enrollment mappings are available in this frontend.</p>
                <button type="button" className="quiet-button focus-ring" onClick={() => setEnrollment('')} data-testid="button-clear-enrollment">Clear and try again</button>
              </div>
            )}
          </section>
          <aside className="context-card">
            <h2>What gets detected</h2>
            <p>The reference mapping currently covers Computer Engineering enrollment numbers and their practical batch group.</p>
            <ul className="context-list">
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

function TimetablePage() {
  const [, setLocation] = useLocation();
  const { student, changeSemester, resetStudent } = useCampus();
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
  const timetableKey = `${student.branchId}-${student.semester}`;
  const rows = TIMETABLES[timetableKey];
  const semester = SEMESTERS.find((item) => item.id === student.semester);

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
            <div className="eyebrow">02 / Your week</div>
            <h1>{semester?.label ?? 'Timetable'}</h1>
            <p>{branch?.name ?? 'Branch unavailable'} · First Semester Batch 2026 · 11/7/2026 to 12/11/2026</p>
            <div className="student-context" aria-label="Current student context">
              <span className="context-chip"><University size={12} aria-hidden="true" /><strong data-testid="text-current-enrollment">{student.enrollment}</strong></span>
              <span className="context-chip"><BookOpen size={12} aria-hidden="true" /><strong data-testid="text-current-batch">{student.batch}</strong></span>
              <span className="context-chip"><CalendarDays size={12} aria-hidden="true" /><strong data-testid="text-current-branch">{branch?.code}</strong></span>
            </div>
          </div>
          <button type="button" className="quiet-button focus-ring" onClick={startOver} data-testid="button-start-over"><RotateCcw size={14} aria-hidden="true" /> Start over</button>
        </div>
        <div className="semester-tabs" role="tablist" aria-label="Semester selector">
          {SEMESTERS.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={item.id === student.semester}
              className={`semester-tab focus-ring ${item.id === student.semester ? 'active' : ''}`}
              onClick={() => changeSemester(item.id)}
              key={item.id}
              data-testid={`button-semester-${item.id}`}
            >
              S{item.id}
            </button>
          ))}
        </div>
        <div className="schedule-meta">
           <span data-testid="text-schedule-source">Reference schedule · Computer Engineering · Sem 1 · {student.batch}</span>
          <span className="live-key"><span className="live-dot" aria-hidden="true" /> Current lecture follows your local time</span>
        </div>
        {rows ? (
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
                         const cell = row.cells[day] ? timetableCellForBatch(row.cells[day], student.batch) : null;
                        const current = Boolean(cell) && isCurrentLecture(row.time, day, now);
                        return (
                          <td key={`${row.time}-${day}`} data-testid={`cell-${day.toLowerCase()}-${row.time.replace(/[^0-9]/g, '')}`}>
                            {cell && (
                              <div className={`lecture ${current ? 'current' : ''}`} data-testid={`lecture-${day.toLowerCase()}-${row.time.replace(/[^0-9]/g, '')}`}>
                                {current && <span className="now-label">Now</span>}
                                <div className="lecture-code">{cell.label}</div>
                                {cell.faculty && <div className="lecture-faculty">Faculty · {cell.faculty}</div>}
                                <div className="lecture-room">Room · not listed</div>
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
            <button type="button" className="quiet-button focus-ring" onClick={() => changeSemester(1)} data-testid="button-view-semester-one">View Semester 1 reference</button>
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
        <Route path="/timetable" component={TimetablePage} />
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
  const changeSemester = (semester: number) => {
    if (!student) return;
    setStudent({ ...student, semester });
  };
  const campusState = useMemo(() => ({ student, setStudent, resetStudent, changeSemester }), [student]);

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
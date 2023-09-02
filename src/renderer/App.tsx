import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';

const Log = (props: { content: string; date: string }) => {
  const { content, date } = props;

  return (
    <>
      <span className="date">{date}</span>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </>
  );
};

function Main() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<[string, React.ReactElement][]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!autoScroll) {
      return;
    }

    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    window.electron.ipcRenderer.on('setting-change', (setting, value) => {
      if (setting === 'autoScroll') {
        setAutoScroll(value as boolean);
      }
    });

    window.electron.ipcRenderer.on('dofus-log', (arg) => {
      const typedArg = arg as [string, string, string][];

      setLogs((logs) => {
        let nextLogs = [
          ...logs,
          ...typedArg.map(
            ([id, date, log]) =>
              [id, <Log date={date} content={log} />] as [
                string,
                React.ReactElement
              ]
          ),
        ];

        if (logs.length > 500) {
          nextLogs = nextLogs.splice(0, logs.length - 500);
        }

        return nextLogs;
      });
    });

    const cancel = setInterval(() => {
      window.electron.ipcRenderer.sendMessage('dofus-log', 'request');
    }, 300);

    return () => {
      clearInterval(cancel);
    };
  }, []);

  useEffect(scrollToBottom, [logs]);

  return (
    <>
      <h1>Dofus logger</h1>
      <div id="log">
        <div id="output">
          {logs.map(([id, log]) => (
            <div className="entry" key={id}>
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}

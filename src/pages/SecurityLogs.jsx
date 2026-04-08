import { useEffect, useState } from "react";
import "./SecurityLogs.css";

export default function SecurityLogs() {
    const [logs, setLogs] = useState([]);

    const fetchLogs = () => {

        const token = localStorage.getItem("token");

        fetch("http://localhost:5000/security-logs", {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        })
        .then((res) => res.json())
        .then((data) => {
            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                console.error("Unexpected response:", data);
                setLogs([]); // prevent crash
            }
        })
        .catch((err) => console.error(err));
    };
    
    useEffect(() => {
        fetchLogs();

        const interval = setInterval(fetchLogs, 5000); // every 5 seconds

        return () => clearInterval(interval); // cleanup

    }, []);

  return (
    <div className="logs-container">
        <h2>Security Logs</h2>

        <div className="logs-scroll">
            <p>Total Events: {logs.length}</p>

            <button onClick={() => window.location.reload()}>
                Refresh Logs
            </button>

            <table className="logs-table">
                <thead>
                <tr>
                    <th>User</th>
                    <th>IP</th>
                    <th>Type</th>
                    <th>Input</th>
                    <th>Time</th>
                </tr>
                </thead>

                <tbody>
                {logs.map((log, index) => (
                    <tr key={index}>
                    <td>{log.username || "—"}</td>
                    <td>{log.ip_address}</td>

                    <td className={
                        log.event_type === "SUSPICIOUS_INPUT"
                        ? "danger"
                        : "warning"
                    }>
                        {log.event_type}
                    </td>

                    <td className="input-cell">{log.input}</td>

                    <td>
                        {new Date(log.created_at).toLocaleString()}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}